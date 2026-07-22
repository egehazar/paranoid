import { readFile } from "node:fs/promises";

// Load the product catalog from a JSON file.
export async function loadProducts(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}
