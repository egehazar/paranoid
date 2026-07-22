import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../lib/stats.mjs";

test("summarizes recorded scores", () => {
  assert.deepEqual(summarize([4, 8, 6]), {
    count: 3,
    average: 6,
    highest: 8,
  });
});

test("handles a single score", () => {
  assert.deepEqual(summarize([7]), {
    count: 1,
    average: 7,
    highest: 7,
  });
});
