// Data layer. Stands in for the items table.
const ITEMS = [
  { id: 1, name: "alpha" },
  { id: 2, name: "bravo" },
  { id: 3, name: "charlie" },
  { id: 4, name: "delta" },
  { id: 5, name: "echo" },
];

export async function getItems() {
  return ITEMS;
}
