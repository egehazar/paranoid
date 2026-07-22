# articles-api

A small article lookup service. `GET /api/articles/:id` returns the article as
JSON; a missing article returns HTTP 404.

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
