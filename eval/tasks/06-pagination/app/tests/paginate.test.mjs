import test from "node:test";
import assert from "node:assert/strict";
import { paginate } from "../lib/paginate.mjs";

const LIST = [
  { id: 1, name: "alpha" },
  { id: 2, name: "bravo" },
  { id: 3, name: "charlie" },
  { id: 4, name: "delta" },
  { id: 5, name: "echo" },
];

test("returns the first page", () => {
  assert.deepEqual(
    paginate(LIST, 0, 2).map((item) => item.id),
    [1, 2],
  );
});

test("returns a later page", () => {
  assert.deepEqual(
    paginate(LIST, 1, 2).map((item) => item.id),
    [3, 4],
  );
});

test("returns a short final page", () => {
  assert.deepEqual(
    paginate(LIST, 2, 2).map((item) => item.id),
    [5],
  );
});
