import test from "node:test";
import assert from "node:assert/strict";
import { renderArticle } from "../lib/render.mjs";

test("renders an article payload", () => {
  const article = { slug: "hello-world", title: "Hello, World", author: "sam" };
  assert.deepEqual(renderArticle(article), {
    slug: "hello-world",
    title: "Hello, World",
    byline: "by sam",
  });
});

test("renders an error payload for a missing article", () => {
  assert.deepEqual(renderArticle(null), { error: "article not found" });
});
