// Build the JSON payload for an article response.
export function renderArticle(article) {
  if (!article) {
    return { error: "article not found" };
  }
  return {
    slug: article.slug,
    title: article.title,
    byline: `by ${article.author}`,
  };
}
