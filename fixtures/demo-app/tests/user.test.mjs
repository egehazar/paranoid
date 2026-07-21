// The agent's own test: GREEN, because it feeds formatUser an object the
// agent invented — camelCase, exactly matching its own assumption.
import test from "node:test";
import assert from "node:assert/strict";
import { formatUser } from "../lib/format-user.mjs";

test("formats a user label", () => {
  const user = { displayName: "Ada Lovelace", email: "ada@example.com" };
  assert.equal(formatUser(user), "Ada Lovelace <ada@example.com>");
});
