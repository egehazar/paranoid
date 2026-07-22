import http from "node:http";
import { getItems } from "./lib/db.mjs";
import { paginate } from "./lib/paginate.mjs";

const PORT = process.env.PORT || 3122;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/api/items") {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const page = Number(url.searchParams.get("page") ?? "1");
    const size = Number(url.searchParams.get("size") ?? "3");
    const items = paginate(await getItems(), page, size);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ page, size, items }));
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`items api listening on :${PORT}`));
