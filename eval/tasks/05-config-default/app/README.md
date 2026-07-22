# catalog-service

Serves the product catalog. `GET /api/products` returns the shipped catalog as
JSON. The data file location can be overridden with the `CATALOG_DATA_FILE`
environment variable; out of the box it serves the catalog bundled in `data/`.

- `npm test` — run the unit tests
- `npm start` — start the server
- `npm run paranoid:check` — acceptance check: boots the real server and
  verifies the endpoint end to end
