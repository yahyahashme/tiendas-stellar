# Finals deck: slide text (#41)

Written Wed Nov 11 from `docs/deck-outline.md`, `docs/pitch.md` (PR #83) and `docs/facts.md`. Refreshed Thu Nov 12 late evening against `main` at 9c1b0fe, after #72, #73, #83, #84, #85, #86, #90, #100 and #102 merged. Paste this into Velocity's template; `docs/deck-outline.md` keeps the sources, what each slide still needs, and the open questions.

**Rules each slide follows:** a headline of 8 words or fewer, at most 3 lines of about 10 words (12 at most), readable in 5 seconds. Sources go in the small print under the slide, never in the 3 lines. A `[bracket]` is something the team has not decided or we don't have yet: **do not paste a bracket into the real deck.** Words were counted on Thu Nov 12 (a "$2" or "pay-in-7-days" counts as one word); recount after any edit. Slide 7 was recounted Sat Nov 14 after its third line was cut: headline 7 words, lines 7 and 11.

**Words to avoid** (facts "Never use" and "Say this, not that", PR #83 "Never say"): the $7 billion market; "about 70,000 shops"; "85,265 neighbourhood shops" (say "more than 50,000 neighbourhood shops"); "a $5 billion market"; the Chivo $30 bonus or fuel discounts; MoneyGram's 5%; "$98.40 per $100"; "$0.35 per credit sale"; a "$2.5 million" revenue figure; "open source" or "open contract" (say "public contract"); "audited" (we reviewed it ourselves); "blockchain", "wallet" or "crypto" for shops (say "digital dollars", "test dollars"). **Fee sponsorship is built** (#113): if you say it, say "our sponsor account pays the network fees" (the diagram says it), not "gasless" or "users never need XLM". Stellar's speed and fees are Stellar's own claims: always "Stellar says". MoneyGram: always "as far as we found".

**Still open on Fri Nov 13:** who pitches (the repo doesn't record it), "what users told us", and our ask. The code-slide image needs PR #163 (new contract ID after #139), and the phone screenshots (PR #119) need a check against the live app after #125 and #126. The name is decided: **Relay**, with *Paga tu ruta* under it (PR #100). The live app is https://relay-sv.vercel.app (the old tiendas-stellar.vercel.app redirects there, so show the new one). Everything else below is on `main`.

**Update Fri Nov 13 night:** PR #82 is merged and #139 (the sliding fee) is merged with the new contract ID, so `docs/img/code-slide.png` was re-rendered after #139 and slide 5 is ready (see slide 5). Slide 6 now says "up to 1.5%" (line 2 is now about 21 words, over the limit of 12: the .pptx draft sets the bracket sentence small, and it can be cut if the slide reads as too much). Slide 3's phone screenshots (PR #119) predate #125 and #126 and need a retake before the deck is final (steps in `docs/deck-outline.md`).

**Update Sat Nov 14:** Slide 7's third line, "We spoke to [N] people and changed [one thing].", is cut, so no `[N]` or `[one thing]` is left. No conversation with a user is logged: PR #152 (open) logs 7 interview requests and 5 nonprofit emails, which are messages sent, not conversations. The team's rule (#61) is exact counts only, and a count of 0 means cut the line, not say 0. Slide 7 now has two lines. Still open: our ask (slide 8) and who pitches.

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
**Visual:** the three phone screenshots on `main`, left to right as the three lines: `docs/trifold/img/shop-pay.png`, `shop-credit.png` and `driver-cash.png`, captured from the live app (PR #119). `docs/screenshots/mock-screens-nov10.png` is a mock: don't use it.
**Waiting on:** a comparison with the live app. #125 and #126 merged after the captures (Fri Nov 13, 7:26 and 7:27 PM ET) and changed the shop's pay screen (#125 also the driver's route screen). If the images differ, recapture (steps in `docs/deck-outline.md`, "Capturing the three phone screenshots") and check the page header reads "Relay" with "Paga tu ruta" under it.

## 4. How it works on Stellar (20 s)

**Headline:** The rules live in a public contract

1. Amounts are public. Names are not.
2. Every payment and fee split is recorded on Stellar.
3. Testnet, test dollars.

**Small print:** none (the diagram carries it).
**Visual:** `docs/img/architecture.png` as it is on `main` (re-rendered in #119). Its server box says "Pays the network fees (fee sponsorship)", which has been true since #113 (evidence: `docs/pitch.md` section 3). The three lines above don't mention it; the diagram carries it.
**Waiting on:** nothing.

## 5. The code (15 s)

**Headline:** Real contract code, not a mock-up

1. Three credit checks run before the pool pays.
2. Late payment, over the limit, empty pool: all refused.

**Small print:** Abridged from `pay_with_credit` in `contracts/route_ledger/src/lib.rs`. The contract ID and its stellar.expert link are on the image.
**Visual:** `docs/img/code-slide.png`. Ready on `main`: re-rendered Fri Nov 13 after #139 merged, so it shows the current contract ID (CAGCZ3I7...), equal to `contracts.routeLedger` in `config/testnet.json`, and the three blocks as they are now in `pay_with_credit`. `node docs/slides/render.mjs` reads both the ID and the code, so the script can't drift, but the PNG can: re-render it after any redeploy or any change to `pay_with_credit`. The old IDs (CAPQ6ZDD..., CDHDZX7V...) are gone from it. It shows no fee code, and its first callout ("No new credit while a payment is late") is still true: #139 changed what `repay` does about lateness, not the overdue check. Re-render at the print size too if the slide is printed (`SCALE=3 node docs/slides/render.mjs`).
**Waiting on:** nothing: the deployed WASM hash matches #139's code (checked Nov 13).

## 6. Money in 30 seconds, and go-to-market (30 s)

**Headline:** Distributors pay. Shops never do.

1. Pay in 7 days: shop repays $100, distributor gets $98.50 now
2. The distributor's fee, up to 1.5%: $0.75 loss buffer, $0.50 lenders, $0.25 us. (Less when the shop pays part up front.)
3. Start with one distributor's routes, then Ecuador and Panama.

**Small print:** Fees are the numbers in our testnet contract. Cash or digital invoices pay 0.1% (for cash it is recorded, but nothing collects it yet). Credit sales pay no usage fee. Ecuador and Panama also use the US dollar. A plan, not a deal: no distributor, bank or lender has agreed to anything. Entries 29, 25 and 26.
**Visual:** the $100 example as 3 rows.
**Not on the slide:** a revenue figure. Entry 30's scenarios are Q&A backup only, always "scenario, not a forecast".
**Waiting on:** nothing; entries 25, 26 and 29 are on `main`.

## 7. Risk #1 and our plan (30 s)

**Headline:** Risk #1: turning cash into digital dollars

1. Not solved yet. Our demo simulates it.
2. Plan: a licensed partner converts cash in bulk and does KYC/KYB.

**Small print:** KYC/KYB: checking who shops and distributors are. Shops would repay weekly, like a bill. MoneyGram lists cash-out points in El Salvador but, as far as we found, not cash-in. A plan, not a deal: no bank, cash-in company or lender has agreed to anything.
**Visual:** text only: two cards, one per line.
**Cut Sat Nov 14:** the old third line, "We spoke to [N] people and changed [one thing]." The research log has no conversation with a user (0). PR #152 (open) logs 7 interview requests to shops and distributors and 5 advice emails to nonprofits: messages sent, not conversations. Rule (#61): a count of 0 means cut the line, not say 0. Don't add it back until a real conversation is logged, and then use the exact count.
**Not used instead:** (a) The advisors' advice to partner with banks and cash-in companies. Facts entry 57 (on `main`) only says we held 2 advisor calls, and it says never to count advisors as users or traction; the advice itself is in `docs/research.md` and context §14, not in a facts entry. (b) "We emailed 5 organisations": that is entry 58, which is on PR #159 and not on `main` yet, and an email sent is not a conversation.
**The spoken line (PR #166, open, `docs/pitch.md` 2:30 to 2:50):** "We've asked [7] grocers and distributors to talk; zero conversations yet." The slide says nothing about users, so the voice and the slide don't contradict. But the `[7]` comes from PR #152 (not merged): re-read it from `docs/research.md` before each run. The #61 rule says to cut a zero, so the team should decide whether to keep that spoken sentence. Context §13 and answer 8 (Q&A) say to give the real number when asked.
**Waiting on:** nothing for the slide, except that a person should look at MoneyGram's coverage map before the small-print line goes on a slide (entry 38 is still pending).

## 8. Team and our ask (20 s)

**Headline:** Who we are, and what we ask

1. Yahya: contract and app. Jack: security review and slides.
2. Rohan: research and facts. Ruhaan: helper code.
3. [our ask]

**Small print:** none.
**Visual:** names, large.
**Waiting on:** the team picks the ask. Candidate, not decided: "Introductions to a distributor, a cash-in partner and a licensed lender" (context §14).
