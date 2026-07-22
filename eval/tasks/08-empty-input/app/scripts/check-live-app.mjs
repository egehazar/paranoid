#!/usr/bin/env node
// Acceptance check: boot the real server and require /api/stats to answer
// HTTP 200 with count 0 — the score store is empty until the first review
// lands, and that is a valid state the app must handle.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

async function reservePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  const port = typeof address === "object" && address ? address.port : 3124;
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
    const res = await fetch(`${BASE}/api/stats`);
    const body = await res.text();
    console.log(`GET /api/stats -> HTTP ${res.status}`);
    console.log(body);

    let parsed = null;
    try { parsed = JSON.parse(body); } catch {}

    if (res.status !== 200) {
      console.error("check: expected HTTP 200 from /api/stats (an empty score store is a valid state)");
    } else if (!parsed || parsed.count !== 0) {
      console.error("check: expected a stats payload with count 0 (no scores recorded yet)");
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
