# Agent instructions for jeffkazzee.dev

The site is static Astro output with a native Vercel Writing route. Production is currently `main`; the planned rename is `prod`. Confirm the Vercel production branch during the operational switch.

Follow the machine Git law in `~/AGENTS.md` (Jeff, 2026-11-03). Task branches start from `origin/dev` and squash-merge into `dev`. Promotions from `dev` to the active production branch (`main` or `prod`) use a pull request and a merge commit. Each merge waits for Jeff’s approval after an independent exact-head receipt passes.

## Verify

Before a change is called done, a session that did not build it runs the verify
skill in `.claude/skills/verify/` on the exact pull request head. Its answer key is
`acceptance.md` on the independently fetched production ref. Use `.claude/skills/verify/scripts/fetch-production.sh` before verification. Run it on a Linux build host.

## Git contract (agent-git, v1)

You work one task from the tasks table at a time.

Start
- Claim before you touch code: `agent-git claim <id> --repo Jeff-Kazzee/jeffkazzee.dev --agent <role> --runtime <rt> --session <id>`
- If the claim fails, pick another task. Never work an unclaimed task.
- Work only in the task's worktree, `jeffkazzee.dev-t<id>-<yyyymmdd>`, on branch `task/<id>-<slug>`.

While working
- Every commit ends with the trailers `Task: <id>`, `Agent: <role>`, `Agent-Session: <runtime>:<session id>`.
- After each step, run `agent-git stage <id> <Stage> "<artifact>"`.
- Push your branch at least once a day. Nothing stays on one machine overnight.

Finishing
- Open a pull request and set the stage to Checking.
- You never verify your own change. A different session runs the verify skill on the exact head and records `agent-git receipt`.
- A review finding counts only with a command that fails on the current head.
- Land only with `agent-git land <id>`. It refuses a stale or failed receipt.

Never
- Never push `refs/entire/*` or `refs/notes/*` to this public remote.
- Never put a transcript, email address, or secret in a commit, pull request, or comment.
- Never push to `main` or `prod` directly. Never force-push a branch you did not claim.
- Never delete a branch or ref outside `agent-git land`.

Ask the owner only for deleting refs or history, changing a GitHub setting, anything public that is not a pull request or its comments, and anything that costs money or creates an account.
