import test from "node:test";
import assert from "node:assert/strict";
import { formatUser } from "../lib/format-user.mjs";

test("formats a user label", () => {
  const user = { display_name: "Ada Lovelace", email: "ada@example.com" };
  assert.equal(formatUser(user), "Ada Lovelace <ada@example.com>");
});
