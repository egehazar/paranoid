// Data layer. Stands in for the quotes table.
const QUOTES = {
  "1": {
    text: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
  },
  "2": {
    text: "Programs must be written for people to read.",
    author: "Harold Abelson",
  },
};

export async function getQuote(id) {
  return QUOTES[id] ?? null;
}
