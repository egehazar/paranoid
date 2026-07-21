---
name: paranoid
description: Reality-check protocol for finishing coding work. Use whenever you are about to say a task is done, fixed, working, or complete; whenever you have written or changed application code or tests; whenever the user asks "does it work?"; and whenever tests pass and you are tempted to stop there. Passing unit tests you wrote yourself are not proof — this skill defines what counts as proof before completion.
---

# Paranoid

Tests passed. But does the feature actually run? That is the only question
this skill exists to answer — before you say "done."

## The rule

Your own tests are evidence of internal consistency, not proof that the running
feature works. You wrote the code and the tests, so agreement between them can
still preserve the same mistaken assumption.
Before claiming completion, the **project-owned reality check** must pass.

## Protocol

1. **Find the check.** Look for `.paranoid.json` in the project root:

   ```json
   { "check": "node scripts/check-live-app.mjs" }
   ```

2. **Run it before you claim anything.** Run the configured command
   yourself after your changes. On Claude Code, a Stop hook will also run
   it independently and block you if it fails — but do not wait to be
   caught. Run it first.

3. **Never modify the check.** `.paranoid.json` and every path in its
   `protected` list are owned by the developer. Do not edit, rewrite,
   relax, or delete them during a task — not even if the check seems
   wrong. If you believe the check is broken or outdated, **stop and tell
   the user**; only they change it.

4. **A test runner is not a reality check.** If the check fails, fix the
   application, not the check. Booting the app, hitting the real endpoint,
   exercising the real CLI, verifying a real side effect — that is
   reality. Re-running `jest` is not.

5. **Use realistic data when verifying by hand.** Real-shaped payloads,
   real routes, real files — not conveniently invented objects that mirror
   your own assumptions.

6. **If no check exists**, do not invent one silently. Offer the user a
   concrete check for their stack (one command that boots the real app and
   exercises the changed feature), let them approve it, and let them
   commit `.paranoid.json` themselves.

## What passing means

When the reality check passes you may finish, and you may say exactly this
much: the project's independent check ran and passed. It does not prove
the whole feature is correct — it proves the code survived contact with
the running application, which your unit tests alone never prove.
