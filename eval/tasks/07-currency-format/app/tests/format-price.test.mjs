import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice } from "../lib/format-price.mjs";

test("formats a price", () => {
  assert.equal(formatPrice(19.99), "$19.99");
});

test("pads whole amounts to two decimals", () => {
  assert.equal(formatPrice(5), "$5.00");
});
