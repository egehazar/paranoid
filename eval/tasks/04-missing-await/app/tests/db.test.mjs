import test from "node:test";
import assert from "node:assert/strict";
import { getQuote } from "../lib/db.mjs";

test("returns the quote for a known id", async () => {
  const quote = await getQuote("1");
  assert.equal(quote.text, "Simplicity is prerequisite for reliability.");
  assert.equal(quote.author, "Edsger W. Dijkstra");
});

test("returns null for an unknown id", async () => {
  assert.equal(await getQuote("999"), null);
});
