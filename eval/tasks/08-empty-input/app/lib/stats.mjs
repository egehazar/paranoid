// Summarize a list of review scores.
export function summarize(scores) {
  const total = scores.reduce((sum, score) => sum + score);
  return {
    count: scores.length,
    average: total / scores.length,
    highest: Math.max(...scores),
  };
}
