# Security notes

This is the page to open when someone asks "who can move the money?". It covers the `route_ledger` contract (`contracts/route_ledger/src/lib.rs`), how keys are handled, and what is real versus demo. It is a testnet demo: no real dollars, no outside audit.

Reviewed Nov 10, 2026 against v3 plus the #58 review fixes. Every claim about the contract below has a test in `contracts/route_ledger/src/test.rs`; the names are in brackets.

## 1. Who can move the money

Every state-changing function takes the signer as its first `Address` and calls `require_auth()` on it, except `set_terms`, `approve_distributor` and `cover_default`, which check `config.admin`. A call signed by anyone else fails as a host error before anything moves [`each_function_asks_for_exactly_its_documented_signer`, `wrong_signer_*`, `set_terms_and_cover_default_need_the_admin`].

| Function | Who must sign | What it checks | What it can move |
|---|---|---|---|
| `__constructor` | the deployer, once, at deploy | nothing; it can't run twice | nothing. Stores admin, token, treasury and the credit period. None of them can be changed later. |
| `approve_distributor` | admin | signer is `config.admin` | nothing directly. It lets an address create invoices, which is the only way pool money can reach a distributor. No revoke yet. |
| `create_invoice` | the distributor | approved distributor (`NotApproved`), new id (`AlreadyExists`), amount above 0 | nothing. It only records an invoice. |
| `pay` | the shop on the invoice | invoice is that shop's (`NotYourInvoice`), not already paid, amount above 0, not more than what is left (`Overpay`) | the shop's own tokens: amount minus 0.10% to the distributor, 0.10% to the treasury. Nothing from the pool. |
| `cash_claim` | the driver on the invoice | invoice's driver (`NotYourInvoice`), not paid, amount above 0, not more than what is left | nothing. It stores one claim per invoice (a new claim replaces the old one). |
| `cash_confirm` | the shop on the invoice | invoice is that shop's, a claim exists (`NoCashClaim`), the claim equals the `amount` the shop confirmed (`ClaimChanged`), not paid, claim still fits what is left | no tokens. It adds to the invoice's `paid`, the driver's cash total and the distributor's usage fee owed, then deletes the claim. |
| `cash_handed_in` | an approved distributor | signer is an approved distributor (`NotApproved`), amount above 0 and not more than the driver holds | no tokens. It lowers the driver's cash total. Known limit 4. |
| `deposit` | the lender | amount above 0 | the lender's own tokens, into the contract, added to `pool.available`. |
| `set_terms` | admin | signer is `config.admin`, limit not negative | nothing directly. It sets a shop's credit limit. |
| `pay_with_credit` | the shop on the invoice | invoice is that shop's, not paid, shop has terms (`NoCreditTerms`), nothing overdue, `owed + remaining` within the limit (`OverLimit`), `pool.available` covers it (`PoolTooLow`) | **pool money.** Distributor gets remaining minus 1.50%, treasury gets 0.25%, 0.75% moves from `available` to `buffer`, and 0.50% stays in `available` for lenders. Never more than the shop's limit. |
| `repay` | the shop that owes | something is owed (`NothingOwed`), amount above 0 and not more than the debt | the shop's own tokens, into the contract: to `available`, or to `buffer` if it is paying a written-off debt. |
| `cover_default` | admin | signer is `config.admin`, the shop owes, and is 4 credit periods late (`NotInDefault`) | nothing leaves the contract. The buffer moves to `available` (back to the lenders), and the shop's debt becomes `written_off`. |
| `fund_buffer` | whoever pays | amount above 0 | the signer's own tokens, into the contract, added to `pool.buffer`. |
| `get_invoice`, `list_invoices`, `invoice_count`, `list_invoices_page`, `get_totals`, `get_config`, `get_pool`, `get_shop`, `get_driver_cash`, `get_usage_owed`, `get_cash_claim`, `is_distributor` | nobody | reads only (`list_invoices` returns the newest 60; `list_invoices_page` up to 30 per call, newest first) | nothing. |

### Where pool money can go

Tokens leave the contract in exactly one function: `pay_with_credit`, to the distributor (the payout) and the treasury (our 0.25%). No other function transfers from the contract's address (the only `send(&token, &me, ...)` calls are in `pay_with_credit`), and there is no withdraw, sweep, upgrade or arbitrary-call function.

- The contract's token balance equals `pool.available + pool.buffer` after every step of a full cycle (deposit, buffer, credit, part and full repay, on-time and late, default cover, repaying a written-off debt), and it only drops in `pay_with_credit` [`contract_balance_equals_the_pool_and_only_credit_sends_money_out`].
- Fees round down, so rounding never pays out more than the invoice. For every amount A, `payout + ours + to_buffer <= A`, and the lenders' share is never negative. This is checked on the arithmetic for every amount from 1 to 200,000 units and for large values near the overflow edge [`credit_split_never_pays_out_more_than_the_invoice`], and through the contract for a set of rounding edge cases [`credit_never_pays_out_more_than_the_invoice_in_the_contract`].
- The buffer is never lent. `pay_with_credit` checks only `available`.
- Money is lent only against an approved distributor's invoice, to a shop the admin gave credit terms, up to that shop's limit.

### Overflow

The deployed Wasm uses the root `Cargo.toml` `[profile.release]`, which has `overflow-checks = true`, so any arithmetic overflow traps and the transaction fails with nothing changed. `cargo test` doesn't use that profile, so the code doesn't lean on it: the fee math uses `checked_mul` and returns `InvalidAmount`, and the credit limit check uses `checked_add` and returns `OverLimit` (the review found that this one used a plain `+` and crashed instead of returning an error; it never moved money). Amounts near `i128::MAX` are rejected or fail with nothing moved [`huge_amounts_overflow_nothing_and_move_nothing`].

## 2. Keys

- The demo's secret keys (they start with `S`) live server-side only: in Vercel environment variables and in `.env.local` on a teammate's computer. Never in a `NEXT_PUBLIC_` variable (the browser can read those), the repo, a screenshot or a chat.
- The repo enforces it: `.gitignore` blocks `.env*` (only `.env.example` is allowed), `.stellar/` and `.soroban/`; `.claude/settings.json` stops Claude Code from reading `.env*` or running `stellar keys`; the README has a "Never commit secret keys" rule.
- The demo has one key per role: admin, issuer, treasury, lender, distributor, two drivers and three shops. The app's server signs for each role, so anyone who gets the server's environment can act as every role. That is acceptable on testnet with test dollars. It is not acceptable with real money.
- If a key leaks, it is testnet, so the fix is a rotation: a new key, updated in Vercel and `.env.local`. The admin and treasury addresses are fixed at deploy, so if one of those leaks the contract has to be redeployed (only the deploy owner runs `scripts/deploy.sh`).

## 3. Demo versus the real product

| | Demo (what judges see) | Real product |
|---|---|---|
| Who signs | our server, with one key per role; a sponsor account pays the network fees | each person signs: shops with a passkey smart wallet (fingerprint or face, no seed phrase), with fees sponsored |
| Identity | none. Addresses are made up | a licensed partner does KYC on shop owners and KYB on distributors, and registers the distributors (`approve_distributor`) |
| Money | test dollars we issue on testnet | USDC |
| Cash in and out | simulated and labelled on screen | a licensed partner; see Risk #1 in `docs/context.md` section 6 |
| Admin | one key | the partner, ideally as a multisig |

## 4. On-chain and off-chain

Following `docs/context.md` section 8.4:

- **On-chain:** invoice amounts, status and due dates, payments, cash confirmations, credit and repayments, fee splits, pool balances and limits. All of it is public, so **amounts are visible even without names.**
- **Off-chain:** shop and owner names, phone numbers, what is on each invoice, CSV files, WhatsApp reminders. No name or phone number is ever written to the contract.
- Addresses are not names, but anyone who links an address to a shop (for example from a receipt) can read that shop's whole payment history. Later: only a hash of each invoice on-chain, and batch settlement.

## 5. Testnet reset risk

The Stellar Development Foundation can wipe testnet, and a wipe deletes our contract, the test token and every account. To recover, run `./scripts/setup.sh --fresh && ./scripts/deploy.sh`: it rebuilds the accounts, the token, the contract and the demo invoices. (`deploy.sh` is in `scripts/`; `setup.sh` is issue #15 and is not on `main` yet, so check that command still matches once it lands.) Contract data also expires about 30 days after its last write (the contract extends it by 30 days on every write), so a contract nobody touches needs restoring or redeploying. Before any demo, check the contract still answers (`get_pool`).

## 6. Known limits

1. **The admin is trusted.** It can't take money out directly, but with `approve_distributor` and `set_terms` it can make an address it controls a distributor, give a shop it controls a large limit, and have that shop take pool money on credit. Only the admin's choices bound the loss. For real: the admin is the licensed partner (multisig), with a cap on limits and a vetting step for each distributor.
2. **Distributor approval can't be revoked.** There is no `revoke_distributor`. (Before the #58 review, any address could create invoices as a "distributor" and collect pool money. That is fixed.)
3. **Lenders can't withdraw, and deposits aren't tracked per lender.** `deposit` adds to the pool total, and only the `Deposited` event says who put in what. Interest to lenders stays in `available`. For real: per-lender shares and a withdraw function.
4. **`cash_handed_in` can't tell which distributor a driver works for.** The review fix (only an approved distributor may sign) stops outsiders. Any approved distributor can still lower any driver's cash total. These totals are bookkeeping and no tokens move. With one demo distributor it can't happen; with several, the driver would need to be tied to a distributor.
5. **Fixed in contract v3: the shop's cash confirmation names the amount.** It used to be `cash_confirm(shop, id)`, which confirmed whatever claim was stored when it ran, so a driver could swap the claim after the shop looked. Now it is `cash_confirm(shop, id, amount)`, and a claim that differs from `amount` is refused with `ClaimChanged` (test `confirm_fails_if_the_driver_changed_the_claim`).
6. **Usage fees on cash are recorded but not collected.** `get_usage_owed` shows what each distributor owes us from cash payments; no function settles it.
7. **The buffer only moves in `cover_default`,** from `buffer` to `available` (back to the lenders); it never leaves the contract. A written-off debt that is repaid later refills the buffer, not the lenders who took the unrecovered part of the loss.
8. **A cash claim left over from a payment by another route stays in storage.** `get_cash_claim` can show a claim on an invoice that is already paid. `cash_confirm` still rejects it, but the dashboard should ignore claims on paid invoices.
9. **Invoice ids are global and first come, first served,** so one distributor can take an id another planned to use. Since contract v3 the id list is stored in chunks of 50, so it no longer grows into one entry that could hit the network's size limit.
10. **Tokens sent straight to the contract address** (not through `deposit` or `fund_buffer`) aren't counted in the pool and can't be withdrawn.
11. **Credit risk is real.** A shop that never repays costs the buffer first, then the lenders. The limits, the 4-period default rule and "no credit while overdue" bound this; they don't remove it.
