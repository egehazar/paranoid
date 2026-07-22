#!/usr/bin/env node
// Acceptance check: boot the real server, require the stored quote text for a
// known id and a 404 for an unknown one.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

async function reservePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  const port = typeof address === "object" && address ? address.port : 3120;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

const PORT = await reservePort();
const BASE = `http://127.0.0.1:${PORT}`;

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
    const res = await fetch(`${BASE}/api/quotes/1`);
    const body = await res.text();
    console.log(`GET /api/quotes/1 -> HTTP ${res.status}`);
    console.log(body);

    const missRes = await fetch(`${BASE}/api/quotes/999`);
    console.log(`GET /api/quotes/999 -> HTTP ${missRes.status}`);

    if (res.status !== 200 || !body.includes("Simplicity is prerequisite for reliability.")) {
      console.error("check: expected /api/quotes/1 to return the stored quote text");
    } else if (missRes.status !== 404) {
      console.error(`check: an unknown quote id must return HTTP 404, got ${missRes.status}`);
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
