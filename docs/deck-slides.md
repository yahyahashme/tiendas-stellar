# Finals deck: slide text (#41)

Written Wed Nov 11 from `docs/deck-outline.md`, `docs/pitch.md` (PR #83) and `docs/facts.md`. Refreshed Thu Nov 12 late evening against `main` at 9c1b0fe, after #72, #73, #83, #84, #85, #86, #90, #100 and #102 merged. Paste this into Velocity's template; `docs/deck-outline.md` keeps the sources, what each slide still needs, and the open questions.

**Rules each slide follows:** a headline of 8 words or fewer, at most 3 lines of about 10 words (12 at most), readable in 5 seconds. Sources go in the small print under the slide, never in the 3 lines. A `[bracket]` is something the team has not decided or we don't have yet: **do not paste a bracket into the real deck.** Words were counted on Thu Nov 12 (a "$2" or "pay-in-7-days" counts as one word); recount after any edit.

**Words to avoid** (facts "Never use" and "Say this, not that", PR #83 "Never say"): the $7 billion market; "about 70,000 shops"; "85,265 neighbourhood shops" (say "more than 50,000 neighbourhood shops"); "a $5 billion market"; the Chivo $30 bonus or fuel discounts; MoneyGram's 5%; "$98.40 per $100"; "$0.35 per credit sale"; a "$2.5 million" revenue figure; "open source" or "open contract" (say "public contract"); "audited" (we reviewed it ourselves); "blockchain", "wallet" or "crypto" for shops (say "digital dollars", "test dollars"). **Do not say fee sponsorship works**: it is not built (PR #81 is a draft), and it stays out of the pitch and the deck until after the finals. Stellar's speed and fees are Stellar's own claims: always "Stellar says". MoneyGram: always "as far as we found".

**Still open on Thu Nov 12:** PR #82 (the code-slide image), who pitches (the repo doesn't record it), "what users told us", and our ask. The name is decided: **Relay**, with *Paga tu ruta* under it (PR #100). The live app is https://relay-sv.vercel.app (the old tiendas-stellar.vercel.app redirects there, so show the new one). Everything else below is on `main`.

## 1. Name and one-line pitch (10 s)

**Headline:** Relay (tagline under it: *Paga tu ruta*)

1. Pay the truck now, in cash, or in 7 days.
2. No interest.

**Small print:** none.
**Visual:** "Relay", large, with "Paga tu ruta" under it. No logo yet.
**Waiting on:** nothing (name and tagline decided Nov 12, PR #100).

## 2. The problem (30 s)

**Headline:** Small shops struggle to get credit for stock

1. About $5.7 trillion: credit small businesses in developing countries can't get
2. Distributors sell 50,000+ neighbourhood shops about $2 billion a year (Conamype estimate)
3. About $35 interest per $100 borrowed from a loan shark (2019 survey)

**Small print:** $5.7 trillion: IFC and SME Finance Forum, "MSME Finance Gap", Mar 2025 (2019 data), entry 22. $2 billion: Conamype, via Diario El Salvador, 27 Feb 2026. Shop count: Distribución Dinámica, via Diario El Mundo, 1 Mar 2026. Entries 1 and 3. $35 per $100: CIOPS (UTEC) survey of 1,285 merchants in five cities, 2019, entry 10.
**Visual:** three big numbers, no chart. Lead with the worldwide number.
**Not on the slide:** 85,265. It also counts eateries and street vendors (entry 3). The $5.7 trillion is a finance gap, never our market.
**Waiting on:** nothing; entries 1, 3, 10 and 22 are on `main`.

## 3. The product (25 s)

**Headline:** One shop screen, three ways to pay

1. Pay now, in digital dollars.
2. Pay in 7 days, no interest.
3. Cash, confirmed by two taps.

**Small print:** Live at https://relay-sv.vercel.app, on Stellar testnet with test dollars. Cash-in is simulated.
**Visual:** three phone screenshots of the live app, left to right as the three lines (steps in `docs/deck-outline.md`, "Capturing the three phone screenshots"). `docs/screenshots/mock-screens-nov10.png` is a mock: don't use it.
**Waiting on:** Jack's capture. The redeploy is done (#90) and the name is set (#100), so the shots can be taken now from https://relay-sv.vercel.app. Check the page header reads "Relay" with "Paga tu ruta" under it before each capture.

## 4. How it works on Stellar (20 s)

**Headline:** The rules live in a public contract

1. Amounts are public. Names are not.
2. Every payment and fee split is recorded on Stellar.
3. Testnet, test dollars.

**Small print:** none (the diagram carries it).
**Visual:** `docs/img/architecture.png`, **with one fix first.** Its server box says "Will pay the network fees (fee sponsorship)". Fee sponsorship is not built and stays out of the deck until after the finals, so delete that bullet in `docs/slides/architecture.html`, re-render with `node docs/slides/render.mjs`, and look at the result. Don't use the picture as it is on `main`.
**Waiting on:** the architecture picture without the fee-sponsorship line. That edit is not in this PR.

## 5. The code (15 s)

**Headline:** Real contract code, not a mock-up

1. Three credit checks run before the pool pays.
2. Late payment, over the limit, empty pool: all refused.

**Small print:** Abridged from `pay_with_credit` in `contracts/route_ledger/src/lib.rs`. The contract ID and its stellar.expert link are on the image.
**Visual:** `docs/img/code-slide.png`. **Not ready on `main`:** it shows the old, stale contract ID (CAPQ6ZDD...), and its limit check (`terms.owed + amount > terms.limit`) is no longer the code in `lib.rs` after #66. PR #82 (open, not merged) re-renders it with the new ID (CDHDZX7V...) and the current code. The ID on the image must equal `contracts.routeLedger` in `config/testnet.json`. Re-render at the print size too if the slide is printed.
**Waiting on:** PR #82 merged, then Yahya confirming this is the deployed code (the open line of #56).

## 6. Money in 30 seconds, and go-to-market (30 s)

**Headline:** Distributors pay. Shops never do.

1. Pay in 7 days: shop repays $100, distributor gets $98.50 now
2. The fee, up to 1.5%: $0.75 buffer, $0.50 lenders, $0.25 us
3. Start with one distributor's routes, then Ecuador and Panama.

**Small print:** Fees are the numbers in our testnet contract. Cash or digital invoices pay 0.1% (for cash it is recorded, but nothing collects it yet). Credit sales pay no usage fee. Ecuador and Panama also use the US dollar. A plan, not a deal: no distributor, bank or lender has agreed to anything. Entries 29, 25 and 26.
**Visual:** the $100 example as 3 rows.
**Not on the slide:** a revenue figure. Entry 30's scenarios are Q&A backup only, always "scenario, not a forecast".
**Waiting on:** nothing; entries 25, 26 and 29 are on `main`.

## 7. Risk #1, our plan, what users told us (30 s)

**Headline:** Risk #1: turning cash into digital dollars

1. Not solved yet. Our demo simulates it.
2. Plan: a licensed partner converts cash in bulk and does KYC/KYB.
3. We spoke to [N] people and changed [one thing].

**Small print:** KYC/KYB: checking who shops and distributors are. Shops would repay weekly, like a bill. MoneyGram lists cash-out points in El Salvador but, as far as we found, not cash-in. A plan, not a deal: no bank, cash-in company or lender has agreed to anything.
**Visual:** text only.
**Waiting on:** the real count and the one change (#30 is open). `docs/research.md` is on `main` now (#72), but it logs only the two advisor calls and no shop-owner or distributor conversations. Advisors are not users, so don't count them in [N]. Also, a person should look at MoneyGram's coverage map before that small-print line goes on a slide (entry 38 is still pending).

## 8. Team and our ask (20 s)

**Headline:** Who we are, and what we ask

1. Yahya: contract and app. Jack: security review and slides.
2. Rohan: research and facts. Ruhaan: helper code.
3. [our ask]

**Small print:** none.
**Visual:** names, large.
**Waiting on:** the team picks the ask. Candidate, not decided: "Introductions to a distributor, a cash-in partner and a licensed lender" (context §14).
