import http from "node:http";
import { getQuote } from "./lib/db.mjs";

const PORT = process.env.PORT || 3120;

const server = http.createServer((req, res) => {
  const match = /^\/api\/quotes\/(\w+)$/.exec(req.url || "");
  if (!match) {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const quote = getQuote(match[1]);
    if (!quote) {
      res.writeHead(404).end(JSON.stringify({ error: "quote not found" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: match[1], quote }));
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`quotes api listening on :${PORT}`));
