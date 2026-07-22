// Data layer. Stands in for the articles table.
const ARTICLES = {
  "1": { slug: "hello-world", title: "Hello, World", author: "sam" },
  "2": { slug: "second-post", title: "Second Post", author: "kim" },
};

export async function getArticle(id) {
  return ARTICLES[id] ?? null;
}
