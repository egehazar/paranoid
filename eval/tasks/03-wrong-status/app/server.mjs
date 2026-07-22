import http from "node:http";
import { getArticle } from "./lib/store.mjs";
import { renderArticle } from "./lib/render.mjs";

const PORT = process.env.PORT || 3119;

const server = http.createServer(async (req, res) => {
  const match = /^\/api\/articles\/(\w+)$/.exec(req.url || "");
  if (!match) {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const article = await getArticle(match[1]);
    const payload = renderArticle(article);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`articles api listening on :${PORT}`));
