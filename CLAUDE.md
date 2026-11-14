# Relay (repo: yahyahashme/relay)

Read docs/context.md first (sections relevant to your issue). It is the source of truth.

## Rules
- Work on ONE GitHub issue per session. Stay inside the files that issue needs.
- Branch is already created (NN-slug). Never commit to main. Never force-push.
- Run `git branch --show-current` before every commit. If it isn't your issue's branch, stop and tell me.
  Never switch branches in a shared checkout; use your own ../ts-NN-slug worktree (./scripts/wt.sh NN slug).
- Small PR, body ends with "Closes #NN". Include screenshots for UI, test output for contract.
- Rebase on origin/main before the first push: git fetch origin && git rebase origin/main
  Once the branch is pushed, never rebase (force-push is denied). Use git merge origin/main instead.
- Do not redeploy the contract or edit config/testnet.json unless the issue says so.
  Contract IDs change on deploy, and only the deploy owner (Yahya) does that.
  Never run scripts/deploy.sh. It calls `stellar keys address`, which is why `stellar keys` is
  denied in .claude/settings.json. Leave that deny in place.
- NEVER read, print, or commit .env* files or any Stellar secret key (starts with S).
- Contract: Rust in contracts/route_ledger. Spec: docs/context.md section 8.2 (read the dated notes
  at the top first; the contract issues win over the table).
  - Run `cargo test` at the repo root before PR. It needs no Stellar CLI.
  - Build wasm with `stellar contract build`, not `cargo build --target wasm32v1-none`
    (soroban-sdk 29 refuses plain cargo for wasm).
  - Only approved distributors can create invoices (`approve_distributor`), so tests and scripts
    must approve one first.
- App: Next.js + TS + Tailwind at the repo root (pages in app/), Spanish UI, mobile-first (360px).
  All data via lib/api.ts. Run `npm run build`, `npm run lint` and `npm test` at the repo root.
  Every screen also has English (ES/EN switch in the top banner). New screen text goes through
  `t("español", "English")` from `useT()` in lib/i18n.tsx. New server/contract messages stay Spanish
  and need a rule in lib/translate.ts (lib/translate.test.ts fails if one is missing).
- Done = tests pass, PR open, "Done means" line from the issue is met.
- Any change touching cash-in or cash-out must also update the Risk #1 notes (docs/context.md section 6).
- Screens say "dólares digitales", never blockchain, wallet or crypto (docs/context.md section 3.5).
  A small "Ver detalles" link may show it is USDC on Stellar.
