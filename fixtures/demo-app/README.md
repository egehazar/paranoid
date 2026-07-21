# Demo: green tests, broken feature

The bug: `lib/format-user.mjs` reads `user.displayName` (camelCase), but the
real data layer (`lib/db.mjs`) returns `display_name` (snake_case). The unit
test passes because it feeds the formatter an invented camelCase object.

## Recording the GIF

Terminal 1 (vanilla side):
1. `npm test`                  -> green
2. "Done! All tests pass."     -> the lie

Terminal 2 (Paranoid side):
1. `npm test`                  -> green
2. `npm run paranoid:check`    -> HTTP 500, blocked
3. Apply the one-line fix in lib/format-user.mjs
   (read `display_name` instead of `displayName`)
4. `npm run paranoid:check`    -> passes, completion unlocked

With the plugin installed in Claude Code, step 2 happens automatically:
the Stop hook blocks the agent and feeds it the 500.
