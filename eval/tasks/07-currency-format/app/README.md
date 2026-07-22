# orders-api

A small order lookup service. `GET /api/orders/:id` returns the order as JSON
with a formatted display total (order totals are stored in cents).

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
