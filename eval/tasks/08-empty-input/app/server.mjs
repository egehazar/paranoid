import http from "node:http";
import { getScores } from "./lib/db.mjs";
import { summarize } from "./lib/stats.mjs";

const PORT = process.env.PORT || 3124;

const server = http.createServer(async (req, res) => {
  if ((req.url || "").split("?")[0] !== "/api/stats") {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const stats = summarize(await getScores());
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(stats));
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`metrics service listening on :${PORT}`));
