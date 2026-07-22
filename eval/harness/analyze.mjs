// Aggregate results.jsonl into per-condition rates + cost, and a per-task table.
// Usage: node analyze.mjs [results.jsonl]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = process.argv[2] || fileURLToPath(new URL("../results/results.jsonl", import.meta.url));
const rows = readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (n, d) => (d ? (100 * n / d).toFixed(0) + "%" : "—");

function summarize(rs) {
  const n = rs.length;
  const tbs = rs.filter((r) => r.tbs).length;
  const fc = rs.filter((r) => r.false_completion).length;
  const recovered = rs.filter((r) => r.check_exit === 0).length;
  return {
    n,
    TBS: `${tbs}/${n} (${pct(tbs, n)})`,
    false_completion: `${fc}/${n} (${pct(fc, n)})`,
    recovery: `${recovered}/${n} (${pct(recovered, n)})`,
    mean_turns: +mean(rs.map((r) => r.num_turns || 0)).toFixed(1),
    mean_cost_usd: +mean(rs.map((r) => r.cost_usd || 0)).toFixed(3),
    total_cost_usd: +rs.reduce((a, r) => a + (r.cost_usd || 0), 0).toFixed(2),
  };
}

const byCond = {};
for (const r of rows) (byCond[r.condition] ??= []).push(r);

const overall = Object.fromEntries(Object.entries(byCond).map(([c, rs]) => [c, summarize(rs)]));

console.log(`\n== Reality-Gap Eval — ${rows.length} sessions ==\n`);
console.table(overall);

// per task × condition false-completion
const tasks = [...new Set(rows.map((r) => r.task))].sort();
const perTask = {};
for (const t of tasks) {
  perTask[t] = {};
  for (const c of Object.keys(byCond)) {
    const rs = rows.filter((r) => r.task === t && r.condition === c);
    perTask[t][`${c}_FC`] = rs.length ? `${rs.filter((r) => r.false_completion).length}/${rs.length}` : "—";
  }
}
console.log("\nPer-task false-completion:");
console.table(perTask);

writeFileSync(file.replace(/results\.jsonl$/, "summary.json"), JSON.stringify({ overall, perTask, n: rows.length }, null, 2));
console.log(`\nwrote ${file.replace(/results\.jsonl$/, "summary.json")}`);
