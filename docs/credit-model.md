# Credit model (proposal)

> **Status: proposal by Rohan, updated Nov 10 to match the contract merged in #58. Waiting for Yahya's approval.** Nothing here changes the contract or the plan until this PR is approved and merged. Numbers marked **(guess)** are placeholders until interviews (#7) give real ones.

How "pay in 7 days" decides who gets credit, how much, and what happens when someone pays late. Think of it as a level system: everyone starts small, levels up by paying on time, and drops levels for paying late.

## 1. Goals
- Losses stay below the **default buffer (0.75% at full credit; less when shops pay part up front, #139)** per 7-day cycle.
- Rules are simple enough to put in the contract and explain to a shop owner in one sentence.
- A fake or dishonest shop can only ever take a little.

## 2. Who gets credit on day one
All of these:
- On a distributor's route for **3+ months, with 8+ deliveries** (the distributor already has this history) **(guess)**.
- Owner's DUI checked by the licensed partner (KYC). **One credit line per DUI.**
- Not overdue anywhere on the system.
- Optional: the distributor vouches and shares the loss (option 2 in context §5).

## 3. Starting limit
**Every shop starts at $200** (built: #134 sets it when a shop signs up). Next step, not built: once a distributor shares a shop's delivery history, start at the lower of $200 and one average delivery, so a shop that usually buys $120 a week starts at $120.

## 4. Levelling up
- **+$25 per on-time repayment, up to $500** (built in #58).
- **Built in #58 (Nov 10), widened in #139:** a repayment only counts if the shop borrowed **$40 or more** in that cycle (or **$10 or more** when it paid half of every credited invoice up front), and the limit rises **at most once per credit period** (once a week for real). This stops a shop from borrowing $1 and repaying it over and over to reach $500 in minutes.
- Later, only with real data: the cap rises to $750 after 6 months with no late payments **(guess)**.

## 5. Late-payment ladder

| Days late | What happens |
|---|---|
| Day 8 | Overdue: no new credit (**built**) |
| Paid 1 day late | Still on time: a grace day (**built**, #137) |
| Paid 2–7 days late | Unfrozen, but the limit drops $25 (**built**, #137) |
| Paid 8+ days late | The limit drops $50 and can't grow for 4 credit periods (**built**, #137) |
| ~~4–14 days late: limit resets to the start~~ | Replaced by the built 2–7 and 8+ day rows above (#137) |
| ~~15–28 days late: credit off, every distributor sees it~~ | Replaced: after 4 credit periods the admin can `cover_default` (built) |
| 28+ days (4 credit periods) | Default: the admin calls `cover_default`. The buffer pays the lenders back what it can, credit goes to $0, and the debt stays on the shop's record. Any later payment goes back into the buffer (**built**) |

## 6. Fraud controls
- Only shops the truck actually visits can get credit.
- Cash payments need two taps (driver and shop).
- One DUI, one credit line, shared across distributors.
- Alarm: a burst of new shops on one route in one week gets reviewed.
- Only distributors the admin approves can create invoices (**built**, `approve_distributor`). Without this, a shop could invoice itself from a fake "distributor" address and take pool money as cash.
- With that in place, credit pays for stock delivered by a known distributor, not cash, so there is less to steal.
- No cheap levelling up: $40+ per cycle (or $10+ with half up front) and one raise per week (§4).

## 7. Exposure caps
- One distributor's shops: at most **25%** of the pool **(guess)**.
- Shops in their first 2 months: at most **20%** of credit outstanding **(guess)**.
- A hard cap on the total pool until we have 3 months of data.

## 8. The buffer as a dial
- **Buffer rate = observed loss rate × 1.5**, reviewed quarterly. Losses at 0.3% → buffer could drop to 0.45%; losses at 1% → it rises.
- The lender seeds the buffer at launch so it isn't empty on day one (**built**: `fund_buffer`; the demo seeds $50).

## 9. Stress test
1,000 shops × about $150 outstanding = **$150K** outstanding **(guess)**. Buffer in per week, at full credit: 0.75% × $150K = **$1,125** (less if shops pay part up front). This assumes every shop repays and borrows again each week, because the buffer grows with each credit sale, not with the amount outstanding.

| Scenario | Loss | Weeks of buffer |
|---|---|---|
| 1% of shops default the same week | $1,500 | ~1.3 |
| 5% default (remittance drop, storm) | $7,500 | ~7 |
| 20 fake shops at $200 | $4,000 | ~3.5 |
| A 200-shop distributor closes, half don't pay | $15,000 | ~13 |

Normal weeks are fine; a big shock needs **about $10–15K of seed money** at launch, which is why the caps in §7 exist.

## 10. What to track weekly
On-time rate; roll rates (how many 1–7 days late slide to 8–30); loss rate vs. the buffer (up to 0.75%); how much of a default is eventually recovered; how much of the pool is actually lent out.

## 11. Demo vs. real
- **Built in the contract (#58, merged Nov 10):** $200 start; +$25 per on-time repayment, only after a $40+ cycle (or $10+ with half up front, #139) and once per credit period; $500 cap; frozen while overdue; a late repayment drops the limit $25 (2–7 days late) or $50 with no raises for 4 periods (8+ days late, #137); `cover_default` after 4 credit periods late (the buffer repays lenders, credit off, debt kept on record); `fund_buffer`; approved distributors only.
- **Pitch only, not built:** eligibility checks, every distributor seeing a default, exposure caps, the buffer dial, the stress test.

## 12. Questions for interviews (#7)
- How many shops on a route never pay their *fiado* today, and how much gets recovered?
- How often do shops pay late, and by how many days?
- How big is a typical delivery?
