<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/relay-logo-white.svg">
    <img src="public/brand/relay-logo.svg" alt="Relay" height="56">
  </picture>
</h1>

*Paga tu ruta*

Neighbourhood shops (tiendas) in El Salvador buy their stock from distributors. In a four-country survey, 8 in 10 small businesses in El Salvador, Guatemala, Honduras and Mexico pay suppliers mainly in cash, and in El Salvador 6 in 10 informal small businesses have borrowed from loan sharks. This app lets a shop pay its supplier in digital dollars, or take the stock now and pay in 7 days with no interest, while a Stellar smart contract keeps the record and enforces the credit rules.

**Live app:** [relay-sv.vercel.app](https://relay-sv.vercel.app) · Built for the Velocity x Stellar challenge (Nov 2026) by Yahya, Jack, Rohan and Ruhaan. Plan and decisions: [docs/context.md](docs/context.md).

## How it works

Three screens (a website that works like a phone app): the **shop** pays an invoice, the **driver** sees the day's route, the **distributor** sees what's paid and owed. One Soroban contract, `route_ledger`, holds the invoices and the rules.

- **Pagar ahora:** the shop pays in digital dollars (USDC on Stellar) through our contract, straight to the distributor.
- **Cash in two taps:** the driver taps "Recibí efectivo", the shop taps "Confirmo". It's recorded on-chain as cash the driver holds for the distributor; no tokens move.
- **Pagar en 7 días:** a lender pool pays the distributor now, minus a fee the distributor pays: 1.5% when the whole invoice goes on credit, sliding down to 1.0% the more the shop paid up front (half paid first: 1.22%). Lenders always get 0.50%; the rest splits 3:1 between a safety buffer and us (0.75% / 0.25% at 1.5%). The shop repays within 7 days, with no interest.
- **Credit record:** a shop's limit starts at $200 and grows $25 per on-time repayment (cycles of $40+, or any size if the shop paid at least half of each credited invoice up front; at most once a week) up to $500. Lateness is graded by days past due: 1 day is a grace day, 2-7 days late lowers the limit $25, 8+ days lowers it $50 and stops raises for 4 weeks, and about 4 weeks late is a default. The record keeps on-time and late counts by band, the most days late, and the date of first credit.
- **Fees:** distributors pay a 0.1% usage fee on digital and cash payments (for cash it's recorded and billed later). Shops never pay fees.
- **Network fee sponsorship:** every transaction goes out inside a fee bump paid by our sponsor account (`lib/stellar/sponsor.ts`, used by `lib/stellar/send.ts`), so shops, drivers and the distributor never hold or spend XLM for fees.

**Demo vs real product:** in the demo the server signs for each role with test keys. The real product uses passkey smart wallets on the users' phones, and a licensed partner does KYC on shop owners and KYB on distributors.

<!-- contract-ids:start -->
## Contract IDs

Stellar testnet, deployed 2026-11-13 by `scripts/deploy.sh`.

| What | ID | Explorer |
|---|---|---|
| `route_ledger` contract | `CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML) |
| Test USDC token | `CANWPJKTWATAQKWD4VNDRMPHHWONWJ5IMCIJ2OTJNYFZ5IDQWX2E2NUP` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CANWPJKTWATAQKWD4VNDRMPHHWONWJ5IMCIJ2OTJNYFZ5IDQWX2E2NUP) |

Test USDC is our own, issued by `tiendas-issuer`, not Circle's.
<!-- contract-ids:end -->

## Demo accounts

Public keys only (from `config/testnet.json`, which is the source of truth after a redeploy).

| Role | Name | Public key |
|---|---|---|
| Admin | — | `GDD7KGT5UZNODMB26M6TRUQIOG3UMCXYYL52KQF7ESYS5DZ45LFDL3T3` |
| Lender (pool) | — | `GC24T2YOYPHSZ2BW42CFFMJVELOR3VBWXPCG2NCG257AHUDLSBQZFQRL` |
| Distributor | Distribuidora El Sol | `GBGNJTX64HA3NOMNCNLHUEBTYFRL2CVXKI3V3QFOVUGXC6OTSRUVJYDS` |
| Driver | Carlos | `GDUH4WF52CDM3G6M57B65IHDEF73CCXFZUSRLEFTB632GEJTTJO5T6WZ` |
| Driver | Ana | `GDBJ6GSKBXKCG2UY7EAHMRI32EVE2IPTNA2OI5JOVNOHNPUJTQLEQBRL` |
| Shop | Tienda Rosa | `GD2HWNZT4DQ4FXKKJ6FUXL4B5XWLSAJTRX2EGPQL5U3Q2VINRL4LRSOA` |
| Shop | Tienda Don Luis | `GDX3MHGPTGKZ4MQCMGMSRXVFCNQF2C4KNXG37D24JAUJQIA7V4BKGAU7` |
| Shop | Mini Súper La Esquina | `GDBFDE5UJXZKZNL7ZXHKPTNYIL4SFWWIT3CAHGDY7VHC32IBL45JVLZS` |

The test USDC is our own asset, issued by `tiendas-issuer` on testnet. It is not Circle's USDC.

## Accounts

Anyone can sign up at `/registro` (shop or distributor; drivers join by their distributor's invite) and sign in at `/entrar`.

- **Database:** Neon Postgres through the Vercel integration (`DATABASE_URL`). Tables in `db/schema.sql`. `npm run db:setup` creates them and adds the demo accounts above as seed rows. It's safe to run again.
- **Passwords:** salted scrypt. **Sessions:** a random id in an httpOnly cookie signed with `SESSION_SECRET`, stored in the database so signing out ends it.
- **A Stellar account per user:** made at sign-up. A new key, funded by friendbot, with the test-USDC trustline (the sponsor pays the fee). The secret key is stored encrypted with AES-256-GCM under `WALLET_KEY` and never leaves the server. This is testnet-only custody for the demo; the real product uses passkey wallets on the user's phone.
- **Who is who:** shops, drivers and distributors come from the database (`lib/server/directory.ts`), falling back to `config/testnet.json` when there is none, so the app still runs with demo data and no database.

## Risk #1: turning cash into digital dollars

We think shops are mostly paid in cash. For digital payments to work, that cash has to become digital dollars somewhere, cheaply. We haven't solved this yet. As of Nov 7, the other direction seems to exist: MoneyGram lists cash-out points in El Salvador, such as banks and supermarkets in San Salvador, so distributors may be able to cash out (its locator shows only the nearest 10, so we have no full count). For El Salvador, its coverage data lists cash-out but, as far as we found, not cash-in, and no person has checked its map yet. Getting cash in is the open problem. Our ideas so far are in section 6 of [docs/context.md](docs/context.md).

**Our plan:**
- The shop repays like a bill: cash at a bank or payment point with a reference number, and a licensed partner converts the cash in bulk.
- One weekly cash-in of only what is owed, with no deposit at sign-up.
- Partner with a bank or cash-in company that already has a reputation in El Salvador.

The demo uses test dollars, with cash-in simulated and labelled on screen.

## Run it locally

**Just to look around:** `npm install`, then `npm run dev` and open http://localhost:3000. With no `.env.local` the app runs on demo data: no keys, no Stellar CLI, nothing on testnet.

**With the real contract** you need Node, the Stellar CLI (version 30 or newer) and Rust (https://rustup.rs, for the contract build and `cargo test`).

1. `npm install`
2. `./scripts/setup.sh` creates the demo accounts and test dollars and writes `config/testnet.json` and `.env.local` (add `--fresh` to start over; testnet is reset sometimes).
3. `./scripts/deploy.sh` deploys the contract, credit terms, pool money and demo invoices. In your own clone this overwrites `config/testnet.json` with your own accounts and contract, which is fine. Teammates: don't run `deploy.sh` on the shared setup; Yahya owns the shared deploy.
4. Check `.env.local`: nine `STELLAR_SECRET_...` lines, and `NEXT_PUBLIC_USE_MOCKS=false` to use the contract (`true` = demo data only, no keys needed).
5. `npm run dev` and open http://localhost:3000.

Tests: `cargo test` (contract) and `npm test` (app). After a contract change, `./scripts/bindings.sh` regenerates the app's contract client.

## Before the showcase

Run on the laptop that ran `scripts/setup.sh` (it holds `tiendas-issuer`). Shop addresses (`G...`) are in `config/testnet.json` under `accounts.shops`.

1. Check a shop's test dollars (each starts with $500):
   `stellar token balance --id <test USDC ID from the table above> --account <shop G...> --network testnet --decimal`
2. Add $500 if it's low:
   `stellar token mint --id <test USDC ID from the table above> --to <shop G...> --amount 5000000000 --source-account tiendas-issuer --network testnet`
3. Open each shop's cuenta page (`/tienda/cuenta/tienda-1`, `-2`, `-3`) and tap "Pagar deuda" so credit is available again.
4. The trifold QR (`public/qr-demo.png`) opens `/demo`, which makes a new invoice for the judge and opens it. Put `/distribuidor` on the laptop screen. No Wi-Fi: use a phone hotspot. Last resort: the demo video.

## Never commit secret keys

Stellar secret keys start with `S`. They go in `.env.local` on your computer and in Vercel's settings, never in this repo.
