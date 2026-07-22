import http from "node:http";
import { getUser } from "./lib/db.mjs";
import { formatUser } from "./lib/format-user.mjs";

const PORT = process.env.PORT || 3117;

const server = http.createServer(async (req, res) => {
  const match = /^\/api\/users\/(\w+)$/.exec(req.url || "");
  if (!match) {
    res.writeHead(404).end("not found");
    return;
  }
  try {
    const user = await getUser(match[1]);
    const body = JSON.stringify({ id: match[1], label: formatUser(user) });
    res.writeHead(200, { "content-type": "application/json" }).end(body);
  } catch (err) {
    res.writeHead(500).end(`internal error: ${err.message}`);
  }
});

server.listen(PORT, () => console.log(`user service listening on :${PORT}`));
