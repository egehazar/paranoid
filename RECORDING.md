# Recording the Paranoid demo

This is the human-recorded companion to the scripted evidence in `evidence/`.
Record it in the **live-demo project**, not this repo:

```
../paranoid-live-demo/
```

That project's root **is** the demo app, so `.paranoid.json` sits at the root
and Paranoid's config discovery finds it. (If you opened Claude Code in *this*
plugin repo instead, discovery would correctly find nothing and the hook would
stay silent — that is by design.) The plugin is already installed there at
**local scope** and enabled (`.claude/settings.local.json` →
`enabledPlugins: { "paranoid@paranoid": true }`), verified in
`evidence/07-live-install-verified.txt`.

---

## 1. The Session-2 prompt

Open a **fresh** Claude Code session in `../paranoid-live-demo/` and paste
exactly this — nothing about Paranoid, nothing about the fix:

> Users report GET /api/users/123 returns a 500 in production, but our test
> suite is green. Find the bug, fix it, and finish the task.

---

## 2. Shot list (in order)

Record one screenshot / GIF segment per step. Capture a few idle frames before
and after each action so the GIF plays smoothly.

| # | Shot | What to capture |
|---|------|-----------------|
| **a** | Tests green | In `../paranoid-live-demo/`, run `npm test` — 1 pass, 0 fail. The suite the ticket says is green. |
| **b** | The real 500 | Run `node scripts/check-live-app.mjs` (or `npm run paranoid:check`). Shows `GET /api/users/123 -> HTTP 500`. The app is actually broken. |
| **c** | Paranoid blocks the finish | In the Session-2 transcript, the moment Claude first tries to finish and the **PARANOID** report appears instead, sending the real 500 back to the agent. |
| **d** | The fix + clean finish | Claude edits `lib/format-user.mjs` (`user.displayName` → `user.display_name`), tries to finish again, and Paranoid lets it through (`Real app check ✓ passed`). |
| **e** | Proof it's installed | `claude plugin list` showing `paranoid@paranoid`, Version 0.1.5, Scope local, Status ✔ enabled. |

### Honest note about shot (c)

Shot (c) is the payoff — but it only happens live **if the agent tries to
declare "done" before it has actually fixed the bug** (or fixes it wrong). A
capable agent may find and fix the camelCase/snake_case mismatch *before* its
first finish attempt, in which case the Stop hook's first run already passes and
no block is filmed.

If that happens, **do not stage a fake block.** Use the scripted capture
`evidence/04-stop-hook-blocks.txt` instead, and in the post label it plainly as
a scripted reproduction of the Stop hook (the identical report, run outside a
live session). The whole project's credibility rests on never dressing up a
scripted capture as a live one.

---

## 3. Recorder

Use whatever you're comfortable with — [asciinema](https://asciinema.org/) or
[vhs](https://github.com/charmbracelet/vhs) for crisp terminal casts, or a plain
screen recorder if you want the Claude Code TUI and the transcript in-frame for
shots (c) and (d). Your choice.
