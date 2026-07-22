# items-api

A small paginated listing service.

`GET /api/items?page=N&size=M` returns one page of items as JSON. Pages are
1-based: `page=1` returns the first `M` items.

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
