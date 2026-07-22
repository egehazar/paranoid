# quotes-api

A small quote lookup service. `GET /api/quotes/:id` returns the stored quote
as JSON; an unknown id returns HTTP 404.

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
