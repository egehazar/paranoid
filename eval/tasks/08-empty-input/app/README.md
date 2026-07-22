# metrics-service

Serves summary statistics over recorded review scores. `GET /api/stats`
returns the current summary as JSON. The score store starts empty and fills as
reviews land.

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
