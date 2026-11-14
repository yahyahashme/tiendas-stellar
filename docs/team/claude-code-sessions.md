## Parallel Claude Code sessions

(This lives in `docs/` because the README is Yahya's; see `docs/context.md` section 3.1.)

- Run `claude` from the top folder of the worktree (the one that contains `CLAUDE.md` and `.claude/`), not from a subfolder.
- Commands and `CLAUDE.md` load when a session starts. If you add or pull them, quit and restart `claude`.
- A worktree starts from `origin/main`, so it only gets the setup after PR #49 is merged and you pull it. In an older worktree: `git fetch origin && git merge origin/main`, then restart `claude`.
- Start an issue: `./scripts/wt.sh 12 cash-confirm` makes `../ts-12-cash-confirm` on branch `12-cash-confirm` and links your `.env.local`.
- Then `cd ../ts-12-cash-confirm`, run `claude`, and type `/take-issue 12`.
- `wt.sh` warns if the new worktree lacks the setup. Until #49 is merged it copies the files from your clone and hides them from git.
