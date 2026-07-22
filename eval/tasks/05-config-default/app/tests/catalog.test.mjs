import test from "node:test";
import assert from "node:assert/strict";
import { getConfig } from "../lib/config.mjs";
import { loadProducts } from "../lib/products.mjs";

test("config honours the CATALOG_DATA_FILE override", () => {
  const config = getConfig({ CATALOG_DATA_FILE: "somewhere/else.json" });
  assert.equal(config.dataFile, "somewhere/else.json");
});

test("config falls back to the default data file", () => {
  assert.equal(getConfig({}).dataFile, "data/catalog.json");
});

test("loads products from a JSON file", async () => {
  const products = await loadProducts(
    new URL("./fixtures/sample-products.json", import.meta.url),
  );
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "Test Product");
});
