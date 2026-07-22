import http from "node:http";
import { getConfig } from "./lib/config.mjs";
import { loadProducts } from "./lib/products.mjs";

const PORT = process.env.PORT || 3121;

const server = http.createServer(async (req, res) => {
  if ((req.url || "").split("?")[0] !== "/api/products") {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const config = getConfig();
    const products = await loadProducts(config.dataFile);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ products }));
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`catalog service listening on :${PORT}`));
