# One-page solution form: draft

Written for issue #8 (closed; merged in #64). **Nothing has been submitted.** We submit on the Thu Nov 12 9 PM call (#31); the form closes Fri Nov 13, 8:30 AM ET.

Form: "BlockChain Innovation Challenge: Project Showcase Submission" ([link](https://airtable.com/apprwC5wqwb4We3jo/pageD4iVuMUuoOvFs/form)). The form shows **no word or character limits** (checked Nov 10; Jack will say if one appears). We write to the targets below.

**Before submitting**
- Delete every `(Rohan to confirm)` marker and every `[bracketed placeholder]`, then re-count.
- No `(Rohan to confirm)` markers are left in answers 4 to 6. Every number comes from the fact sheet `docs/facts.md` (merged in #59; #73 added entries 22 to 28 and #84 entries 29 to 40). Rohan checks each against his final file. `docs/assumptions.md` (#12) is not in the repo: PR #74 was closed without merging and issue #12 is still open. Our own numbers (fees, limits) are in `facts.md` entries 29 to 31 instead.
- Never use: the $7B figure, "70,000 shops", the Chivo $30 bonus, or MoneyGram's 5% as a comparison. We compare to loan sharks.

---

## 1. Team Topic & Number (picker)

- Topic: Space 1, savings, credit and inflation resilience.
- Number: **TODO**, pick our number from the form's list.

## 2. Team Name

**Relay** (tagline: "Paga tu ruta").

## 3. Team Members (picker)

Yahya, Jack, Ruhaan, Rohan. Pick each from the form's list. If one is missing, type them in the "cannot find someone" box.

## 4. One-line summary

Target: about 20 words.

<!-- q4 -->
A mobile web app where El Salvador's neighbourhood shops pay distributors in digital dollars or buy stock on credit, interest-free.
<!-- /q4 -->

## 5. What specific problem is your solution working to solve, how does it benefit the future of this problem space?

Target: 120 to 150 words.

<!-- q5 -->
Around the world, small businesses in developing countries can't get about $5.7 trillion in credit they need. In El Salvador alone, more than 50,000 neighbourhood shops buy about $2 billion a year from distributors (Conamype estimate). Delivery crews in El Salvador have been robbed and extorted. Short of cash, 6 in 10 informal small businesses have borrowed from loan sharks, about $35 per $100 (2019 survey).

We built a mobile web app on our public Soroban contract. A shop pays now in test dollars, records cash with two taps, or pays in 7 days, interest-free. On-time repayment raises its limit, up to $500: a credit record it never had. Stellar says payments finalize in about five seconds, with fees under a cent.

Distributors pay, never shops: 1.5% to be paid instantly on pay-in-7-days sales (0.25% ours, the rest to lenders and a loss buffer), and 0.1% of other invoices.
<!-- /q5 -->

## 6. Why is your team best suited to solve this problem?

Target: 120 to 150 words.

<!-- q6 -->
Rohan studies FARM (Financial Analysis and Risk Management), which covers the credit and risk side. Three engineers (software, two computer) built and tested our public contract, CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML on Stellar testnet, and the app: https://relay-sv.vercel.app. Then we asked for help: 2 advisor calls, and emails to 4 banks and a supermarket chain in El Salvador. We are first-year Waterloo students and none of us has run a shop, so we learned this from them.

We also say the hardest part plainly. Risk #1: turning cash into digital dollars isn't solved in El Salvador, and our demo simulates it; MoneyGram lists cash-out points in El Salvador but, as far as we found, not cash-in. Our plan: shops repay weekly like a bill at a bank or payment point, and a licensed partner converts in bulk and does KYC on shops and KYB on distributors.
<!-- /q6 -->

## 7. Submit your Devpost link

**TODO.** Yahya adds it once the Devpost page exists (deadline still TBD in context §2).

---

## Number check

Every number in answers 4 to 6. "Confirm" means Rohan checks it against his final file before we submit.

| Number | Answer | Source | Status |
|---|---|---|---|
| about $5.7 trillion credit gap for small businesses in developing countries | 5 | Opening line and `facts.md` entry 22 (IFC/World Bank), merged in #73 | Checked by Claude, 12 Nov, against entry 22 (first on `origin/51-worldwide-number`, then again in `docs/facts.md` on `main` after #73 merged): the claim and the quote "a finance gap of about US$5.7 trillion" match the sentence. A finance **gap**, never our market. Wording approved by Yahya (Nov 11). |
| more than 50,000 neighbourhood shops | 5 | Opening line in `facts.md` (merged in #73); entry 3 | Matches `facts.md` entry 3 (50,133 neighbourhood shops) and the "Say this" table; checked by Claude, 12 Nov. Replaces 85,265 (Yahya, Nov 11), because 85,265 also counts eateries and street vendors. |
| about $2 billion a year from distributors (Conamype estimate) | 5 | `facts.md` entry 1 (merged in #59) | Matches `facts.md` entry 1 and the "Say this" table; checked by Claude, 12 Nov. One official, via Diario El Salvador, 27 Feb 2026. The opening line has no "(Conamype estimate)"; we keep it. |
| 6 in 10 informal small businesses have borrowed from loan sharks | 5 | `facts.md` entry 9 (62.2%) | Matches `facts.md` entry 9 (62.2%) and the "Say this" table; checked by Claude, 12 Nov. "Informal" must stay in the sentence. |
| about $35 per $100 (2019 survey) | 5 | `facts.md` entry 10 | Matches `facts.md` entry 10 (US$35 interest per US$100 loan, 2019 survey); checked by Claude, 12 Nov. Keep the year. |
| $500 cap on a shop's limit | 5 | `facts.md` entry 31; `docs/credit-model.md` and context §16; contract `LIMIT_CAP` is $500 and tested | Our design number, a guess to test in interviews, not repayment data. Matches `facts.md` entry 31; `LIMIT_CAP` in `lib.rs` on `main` is 5,000,000,000 units, which is $500 at the token's 7 decimals; checked by Claude, 12 Nov. `assumptions.md` (#12) is not in the repo (PR #74 closed, not merged). The start limit is a flat $200 (#134); the lower of $200 and one average delivery is a later step, not built. |
| 1.5% paid by the distributor on a pay-in-7-days sale | 5 | `facts.md` entry 29; context §5 and §16; contract `CREDIT_FEE_BPS` = 150 | Matches contract `CREDIT_FEE_BPS` = 150, `facts.md` entry 29 and context §5; checked by Claude, 12 Nov. Added after Yahya's review (Nov 11). |
| 0.25% of that is ours; the rest goes to lenders and a loss buffer | 5 | `facts.md` entry 29; context §5; contract `OUR_BPS` = 25, `LENDER_BPS` = 50, `BUFFER_BPS` = 75 | Matches contract `OUR_BPS` = 25; `LENDER_BPS` 50 and `BUFFER_BPS` 75 make up the rest (the contract asserts they sum to 150); checked by Claude, 12 Nov. |
| 0.1% of other invoices (paid now or in cash) | 5 | `facts.md` entry 29; context §5 and §16; contract `USAGE_FEE_BPS` = 10 | Matches contract `USAGE_FEE_BPS` = 10; context §5 gives 0.05% to 0.1% and says the demo contract uses 0.1%; checked by Claude, 12 Nov. |
| 7 days | 4, 5 | Product rule, context §7.3 | Design, not a measurement. |
| about five seconds to finalize; fees "under a cent" | 5 | `facts.md` entries 36 and 37; developers.stellar.org ("Ledgers close in ~5 seconds, and their transactions are final when they do"); stellar.org/solutions/cross-border-payments, updated 2026-11-03 ("network fees under a cent") | Stellar's own claims, so the sentence says "Stellar says". Stellar's own dollar figures for fees disagree, so never state a precise dollar fee. Entries 36 and 37 are marked pending: a teammate must open the links and confirm the quotes. |
| Delivery crews in El Salvador have been robbed and extorted | 5 | El Diario de Hoy, 23 Jul 2024 (cash robbed from a delivery-truck employee, one 2023 case); Brown, Montero, Schmidt-Padilla and Sviatschi, Review of Economic Studies ("Before making a delivery in gang-controlled territory, truck drivers will stop and meet with a gang representative", data 2012 to 2019); `facts.md` entries 7 and 40 | Not a number. Rohan to check the sources before submit; entry 40 is marked pending too. The robbery is one reported case. |
| four first-year students | 6 | Context header | True as of Nov 10. |
| Rohan studies FARM (Financial Analysis and Risk Management) | 6 | Yahya's review comment on #64 (Nov 10). Context says only "FARM". | Rohan to confirm the wording. |
| Three engineers (software, two computer) built and tested the contract and app | 6 | Yahya's review comment on #64; context header lists the programs | Yahya to confirm this fairly describes all three. |
| Contract `CAGCZ3I7…` and https://relay-sv.vercel.app | 6 | `config/testnet.json` (`contracts.routeLedger`) and the README table; the URL returned HTTP 200 on Nov 12 | New ID after the #139 redeploy (it replaces `CDHDZX7V…`, which replaced `CAPQ6ZDD…` in #90). Verified 12 Nov: the ID in answer 6 equals `contracts.routeLedger` in `config/testnet.json` (same on `origin/main`) and the README table; `curl -sI https://relay-sv.vercel.app` returned HTTP 200. `CANWPJKT…` in the same file is the test USDC token, not our contract. Re-check if the contract is redeployed again. |
| 2 advisor calls | 6 | `docs/research.md` "Advisor calls (Nov 9)" (merged in #72, #17) | Matches the log (two advisors, both calls Mon Nov 9); checked by Claude, 12 Nov, against the file on `main`. |
| emails to 4 banks and a supermarket chain in El Salvador | 6 | `docs/research.md` "Partner outreach", PR #89 (#10): five rows dated Nov 10 (Promerica, Abank, Integral, Davivienda, Súper Selectos) | Checked by Claude, 12 Nov. The Nov 11 email to a Davivienda colleague is not counted again. The log's own pitch line says "6 banks and cash-in companies", which counts that email as a sixth organisation; recount if Rohan sends more tonight. PR #89 is still open, so the log is not on `main` yet. |
| Cut: shop-owner and distributor conversations (#7), prototype walkthroughs (#30) | 6 | No count in issues #7, #30 or any `docs/research.md` | Removed Nov 12 because no number is logged. Add one back only if it is logged before submit. |

**After #139 (Nov 13).** The contract was redeployed: answer 6 now has the live ID, `CAGCZ3I7…` (`config/testnet.json`). A copy sent before #139 had `CDHDZX7V…`, the ID then. The credit fee is now **up to** 1.5%: 1.5% when the whole invoice goes on credit and lower, down to 1%, when the shop pays part up front. Answer 5 still says "1.5%" (true at full credit); say "up to 1.5%" if it's reused.

**Fee wording (resolved Nov 11).** Issue #8 said "0.1% of every invoice plus 0.25% of each pay-in-7-days sale". Context §5, the Nov 10 decision and the contract say credit sales pay **no** usage fee: the distributor pays one 1.5% fee ($98.50 per $100), and our 0.25% is inside it. Yahya confirmed the §5 wording, and answer 5 now states the 1.5% and where it goes, because "0.25%" alone left out who pays the lenders and the buffer. Claude checked the numbers against the contract constants on Nov 12; `facts.md` entry 29 says the same.

## Not in the answers (for the Thu 9 PM call)

Cut for length, still needed in the pitch and Q&A:
- **Go-to-market:** one mid-size distributor's routes first; a bank or cash-in company as the cash partner; a licensed lender or cooperative funding the pool.
- **Where next:** Ecuador and Panama (they also use US dollars), then Guatemala and Honduras, then Mexico and Peru. Use the expansion path in `docs/facts.md` (#51) once it lands.
- **"Why not BFA?":** the state bank BFA lends tiendas up to $10,000, approved within 72 hours (`facts.md` entry 20, which has a suggested answer). Not in the one-pager.
- **Why the shop-cash numbers aren't in answer 5:** "8 in 10 small businesses pay suppliers mainly in cash" (`facts.md` entry 11) covers four countries, not El Salvador alone, so it stays out of the one-pager. Say "regional" if asked.
- **Cut Nov 12:** "Shops pay trucks in cash, with no record of who collected what." The "no record" half had no source (it was our assumption; a study shows a major distributor keeps per-delivery sales data), and "shops pay in cash" is sourced only for four countries. Do not put it back as fact. If we say it, say "we think".
- **MoneyGram, Nov 12:** moneygram.com/stellar says "Cash-out is available in 170+ countries and territories and cash-in in 25+ countries". For El Salvador its coverage map appears to list cash-out but not cash-in, but that reading comes from the page HTML and no person has confirmed it. The one-pager says "as far as we found"; never say cash-in is missing as fact.

## Word counts

Counted with `<!-- qN -->` markers: `(Rohan to confirm)` markers excluded, `[placeholders]` counted as written.

| Answer | Target | As written | What changes at submit |
|---|---|---|---|
| 4. One-line summary | about 20 | 20 | Nothing. |
| 5. Problem and benefit | 120 to 150 | 149 | Nothing: no markers or placeholders left. Only 1 word of room, so cut something before adding anything. |
| 6. Why our team | 120 to 150 | 142 | Nothing: no placeholders left. 8 words of room. |

Re-count after every edit. The counting script is not in the repo; it splits on spaces and treats "$2" and "pay-in-7-days" as one word each.
