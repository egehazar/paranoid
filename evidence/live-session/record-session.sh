#!/usr/bin/env bash
# Paranoid live demo — genuine gated session, headless capture (shots c + d).
# Runs the exact RECORDING.md two-turn flow via claude -p, saving full
# stream-json transcripts + --debug stderr. Leaves the worktree UNTOUCHED
# afterward so the fix diff can be audited before the bug is restored.
set -uo pipefail

REC="<recording>"
DEMO="<live-demo>"

cd "$DEMO" || exit 1

if [ -n "$(git status --short)" ]; then
  echo "ABORT: live-demo tree is not clean (a previous take?). Fix with:" >&2
  echo "  git -C \"$DEMO\" checkout lib/format-user.mjs" >&2
  exit 1
fi

run_claude() {
  env -u CLAUDE_CODE_CHILD_SESSION -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT \
      -u CLAUDE_CODE_SESSION_ID -u AI_AGENT -u CLAUDE_CODE_EXECPATH \
      claude "$@"
}

echo "=== TURN 1: verbatim runbook prompt (edits forbidden) — expect PARANOID block ==="
run_claude -p "Run the existing unit tests and report whether the project is ready. Do not modify any files." \
  --debug --output-format stream-json --verbose \
  --permission-mode bypassPermissions --max-turns 12 \
  > "$REC/session-turn1.jsonl" 2> "$REC/session-turn1-debug.txt"
echo "turn1 exit: $? (nonzero can be normal if the block/max-turns ended it)"

SID=$(grep -o '"session_id":"[^"]*"' "$REC/session-turn1.jsonl" | head -1 | cut -d'"' -f4)
echo "session_id: ${SID:-NOT FOUND}"
if [ -z "${SID:-}" ]; then
  echo "ABORT: no session id in turn-1 output — see $REC/session-turn1-debug.txt" >&2
  exit 1
fi
echo "$SID" > "$REC/session-id.txt"

echo "=== TURN 2: resume same session — fix allowed — expect edit + check PASS ==="
run_claude -p --resume "$SID" "Go ahead and fix it, then finish." \
  --debug --output-format stream-json --verbose \
  --permission-mode bypassPermissions --max-turns 25 \
  > "$REC/session-turn2.jsonl" 2> "$REC/session-turn2-debug.txt"
echo "turn2 exit: $?"

echo "=== worktree after the session (left as the agent left it, for diff audit) ==="
git status --short
git --no-pager diff -- lib/format-user.mjs

echo "=== newest debug logs in ~/.claude/debug (if the CLI wrote files) ==="
ls -t ~/.claude/debug 2>/dev/null | head -5

echo "DONE — transcripts in $REC (session-turn1/2.jsonl + -debug.txt)"
