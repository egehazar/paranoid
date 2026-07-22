import http from "node:http";
import { getOrder } from "./lib/db.mjs";
import { formatPrice } from "./lib/format-price.mjs";

const PORT = process.env.PORT || 3123;

const server = http.createServer(async (req, res) => {
  const match = /^\/api\/orders\/(\w+)$/.exec(req.url || "");
  if (!match) {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const order = await getOrder(match[1]);
    if (!order) {
      res.writeHead(404).end(JSON.stringify({ error: "order not found" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: order.order_id,
        item: order.item,
        total: formatPrice(order.total_cents),
      }),
    );
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`orders api listening on :${PORT}`));
