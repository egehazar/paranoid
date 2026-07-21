#!/usr/bin/env bash
# Reality-Gap Eval runner.
#   Usage: run.sh <taskNN> <baseline|paranoid> [runs] [model]
# Runs each session in a throwaway git-initialized copy of the task app, drives a
# nested `claude -p`, then runs the task's developer-owned acceptance check as the
# oracle. Appends one JSON row per session to eval/results/results.jsonl.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"

TASK="${1:?task id, e.g. 01}"
COND="${2:?condition: baseline | paranoid}"
RUNS="${3:-3}"
MODEL="${4:-claude-sonnet-5}"

TASKDIR="$(ls -d "$REPO/eval/tasks/${TASK}"-* 2>/dev/null | head -1)"
[ -d "$TASKDIR" ] || { echo "No task matching '$TASK' in eval/tasks/"; exit 1; }

RUNS_DIR="${RUNS_DIR:-${TMPDIR:-/tmp}/paranoid-eval-runs}"
RESULTS="$REPO/eval/results/results.jsonl"
mkdir -p "$RUNS_DIR" "$(dirname "$RESULTS")"

PROMPT="$(cat "$TASKDIR/task.md")"
CHECK="$(node -e 'process.stdout.write(require(process.argv[1]).check)' "$TASKDIR/meta.json")"

PLUGIN=()
[ "$COND" = "paranoid" ] && PLUGIN=(--plugin-dir "$REPO")

# The nested claude must authenticate as a top-level run, so clear the
# child-session markers this process inherits. (--bare would also isolate but
# empirically disables auth on this machine.)
CLEAR=(-u CLAUDE_CODE_CHILD_SESSION -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT
       -u CLAUDE_CODE_SESSION_ID -u AI_AGENT -u CLAUDE_CODE_EXECPATH)

for i in $(seq 1 "$RUNS"); do
  WORK="$RUNS_DIR/${TASK}-${COND}-r${i}"
  rm -rf "$WORK"; mkdir -p "$WORK"; cp -r "$TASKDIR/app/." "$WORK/"
  ( cd "$WORK" && git init -q -b main && git add -A \
      && git -c user.name=eval -c user.email=eval@local commit -qm init ) >/dev/null 2>&1

  echo ">>> task=$TASK cond=$COND run=$i/$RUNS model=$MODEL"
  t0="$(node -e 'process.stdout.write(String(Date.now()))')"
  ( cd "$WORK" && timeout 600 env "${CLEAR[@]}" \
      claude -p "$PROMPT" --permission-mode bypassPermissions \
      --output-format json --model "$MODEL" "${PLUGIN[@]}" \
      > "$WORK/session.json" 2> "$WORK/session.err" )
  t1="$(node -e 'process.stdout.write(String(Date.now()))')"

  ( cd "$WORK" && eval "$CHECK" > "$WORK/check.out" 2>&1 ); CHECKEXIT=$?

  node "$HERE/record.mjs" "$WORK/session.json" "$CHECKEXIT" \
       "$TASK" "$COND" "$i" "$((t1 - t0))" "$RESULTS"
done

echo "done -> $RESULTS"
