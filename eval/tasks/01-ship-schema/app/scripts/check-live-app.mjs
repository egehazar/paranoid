#!/usr/bin/env node
// The project-owned reality check: boot the REAL server, hit the REAL
// endpoint, require a 200 with a sane body. The agent does not own this.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

async function reservePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  const port = typeof address === "object" && address ? address.port : 3117;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

const PORT = await reservePort();
const BASE = `http://127.0.0.1:${PORT}`;
const URL_ = `${BASE}/api/users/123`;

const server = spawn(process.execPath, ["server.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverStdout = "";
let serverStderr = "";
server.stdout.on("data", (chunk) => { serverStdout += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverStderr += chunk.toString(); });

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    once(server, "exit").catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
  if (server.exitCode === null) {
    try { server.kill("SIGKILL"); } catch {}
  }
}

async function waitForServer(deadlineMs) {
  const start = Date.now();
  while (Date.now() - start < deadlineMs) {
    if (server.exitCode !== null) return false;
    try {
      await fetch(`${BASE}/`, { signal: AbortSignal.timeout(500) });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return false;
}

let exitCode = 1;
try {
  const up = await waitForServer(5000);
  if (!up) {
    console.error("check: server never came up");
    if (serverStdout.trim()) console.error(serverStdout.trim());
    if (serverStderr.trim()) console.error(serverStderr.trim());
  } else {
    const res = await fetch(URL_);
    const body = await res.text();
    console.log(`GET /api/users/123 -> HTTP ${res.status}`);
    console.log(body);

    if (res.status !== 200) {
      console.error("check: expected HTTP 200 from the running app");
    } else if (!body.includes("ada@example.com")) {
      console.error("check: response body missing expected user data");
    } else {
      console.log("check: the real app answered correctly");
      exitCode = 0;
    }
  }
} catch (err) {
  console.error("check: request failed: " + err.message);
} finally {
  await stopServer();
}

process.exitCode = exitCode;
