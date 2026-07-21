# Reality-Gap Eval

Measures how often a coding agent's session **ends while a developer-owned
acceptance check is still failing** — and whether Paranoid changes that, at what
cost. Design and honesty commitments are pre-registered in
[`PREREGISTER.md`](./PREREGISTER.md).

The check is the oracle — no LLM judge. Metrics: **TBS** (termination-in-broken-state),
**FC** (false-completion: ended broken *and* the agent claimed `VERDICT: READY`),
**recovery**, and cost (turns / USD).

## Layout

```
eval/
  PREREGISTER.md      the design, fixed before the scored run
  harness/
    run.sh            run <task> <baseline|paranoid> [runs] [model]
    record.mjs        turn one finished session into a results row
    analyze.mjs       aggregate results.jsonl -> summary + tables
  tasks/NN-*/
    app/              the seeded-bug project (green tests, broken app)
    task.md           the exact prompt given to the agent
    meta.json         bug class, prompt style, acceptance-check command
  results/
    results.jsonl     one row per session (committed; nothing dropped)
    pilot/            raw JSON from the 3-session mechanics pilot
```

## Run it

Requires `claude` (logged in), `node`, `git`, and bash. Each session runs in a
throwaway copy under `$TMPDIR/paranoid-eval-runs/`, never touching the repo.

```bash
# one task, both arms, 3 runs each
eval/harness/run.sh 01 baseline 3
eval/harness/run.sh 01 paranoid 3

# aggregate
node eval/harness/analyze.mjs
```

Model defaults to `claude-sonnet-5`. Sessions authenticate as top-level runs (the
harness clears the inherited child-session env markers); `--bare` is deliberately
**not** used because it disables auth on this machine.

## Status

Mechanics validated by a 3-session pilot (`results/pilot/`): nested `claude -p`
runs and authenticates, `--plugin-dir` activates Paranoid's Stop hook under `-p`
(the agent recovered a seeded 500), and the acceptance check grades cleanly. The
full 8-task × 3-run × 2-condition matrix (48 sessions) runs after all 8 task
fixtures are built.
