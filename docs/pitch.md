# Trifold and pitch script v1 (#37)

Draft for issue #37, written Wed Nov 11. The pitcher picked in #26 owns the script from v1 on. **Not final:** the open items below are things v1 could not fill, and every one is marked in the text with a `[bracket]`.

## Open items

Status as of Thu Nov 12, evening. Update the "Status" column when an input lands, and delete the row when the placeholder is gone from the text.

| # | What is missing | Who | Status | What v1 does meanwhile |
|---|---|---|---|---|
| 1 | Final wording of the worldwide number (#51), due Sat noon | Rohan | **Done.** #51 is closed and PR #73 is merged (Nov 12): entry 22 and the "Opening line" are in `docs/facts.md` on `main`. | The 0:00 segment is the #73 opening line ($5.7 trillion) with "says Conamype" added (entry 1 asks for the attribution) and without "alone" after "In El Salvador". Put "alone" back to match #73 word for word (+1 word, 0.4 s). |
| 2 | Team name (#26) | Everyone | **Done.** Yahya picked **Relay**, tagline **Paga tu ruta**, on Nov 12 (PR #100, merged: `lib/brand.ts` has both). The app is at **relay-sv.vercel.app**; the old tiendas-stellar address only redirects (PR #102). | Relay is in the script, the board and the answer bank. The board shows the tagline under the title and prints the address under the QR. Nothing is left to do here. |
| 3 | Pitcher (#26) | Everyone | **Open.** #26 is closed and records no pitcher either. | Written for one speaker, in first person. |
| 4 | "What we heard from N people" (#30). | Rohan | **Open.** `docs/research.md` is on `main` now (PR #72) but logs only the two advisor calls: no interviews or walkthroughs yet, and #30 is open. | `[N]` and `[what we changed]` in the script and on the board (yellow). If N is under 5, say the real number (context §13). |
| 5 | Three real phone screenshots. `docs/screenshots/mock-screens-nov10.png` is a mock, not for the board | Jack | **Open.** | Three yellow phone frames on the board. Files go in `docs/trifold/img/` as `shop-pay.png`, `shop-credit.png`, `driver-cash.png`: 360 px wide, device pixel ratio 3 (1080 px wide, 180 pixels per inch at 6 in), grey testnet banner in frame. |
| 6 | Demo QR `public/qr-demo.png` (#55, PR #70) | Yahya | **Merged** (PR #70, Nov 12). The file is `public/qr-demo.png` on `main` (1200 x 1200 px, well over 200 pixels per inch at its printed size). PR #102 (Nov 12) regenerated it for the new address. Decoded on Nov 12 evening with macOS CoreImage, from the file on `main`: it opens `https://relay-sv.vercel.app/demo`. `curl -sI https://relay-sv.vercel.app` answers 200. Scan the printed copy on 3 phones (#40). | The layout reads `public/qr-demo.png` and now renders it. |
| 7 | Board size: do the panels fold 12 + 24 + 12 in or 16 + 16 + 16 in? | Jack | **Open: measure the board** (see section 1). | Both layouts are built and pass the same checks. Pick one when measured. |
| 8 | Paper sketch agreed, print-ready file link in the group chat | Team | **Not done by this PR.** The layout builds a 48 x 36 in PDF in both versions (`node docs/trifold/render.mjs`), but it carries yellow placeholders until rows 4 and 5 close. These are two of the three "Done means" lines of #37. | The PDFs are not committed (`out/` is git-ignored); Jack builds the final one and shares it. |
| 9 | The one-minute demo video (#35) | Yahya | **Open.** The shot list is in `docs/demo-video.md`. | Rehearse with the full 60-second file from 0:00. Keep the same cut available offline for the showcase. |
| 10 | A sharper diagram: `docs/img/architecture.png` is 1920 x 1080 px, which is 113 pixels per inch on the 12 + 24 + 12 board and 132 on the 16 + 16 + 16 one | Owner of the slide renders (PR #85's scaffold), asked through Jack | **Not asked yet.** Request text is in section 1. | The layout uses the 1x file and prints a warning. It picks up `architecture@2x.png` by itself when it exists. |
| 11 | Copy the Nov 12 source-check edits from this file into `docs/trifold/trifold.html`: the left-panel crews and cash line (+12 words and a source line) and the right-panel "and sells more" cut (-3 words). Then run `node docs/trifold/render.mjs` and re-measure the word count and text share in section 1 | Jack | **Done Nov 12.** `trifold.html` has the new crews and cash line (+12 words), its source line (+35 words) and the "and sells more" cut (net -2 words, because "and" had to be added before "carries"). Re-rendered: the board was then 446 words (was 401; it is 456 now), text share 15.5% (A) and 15% (B) then (16.0% and 15.4% now), all panels fit. | None: the board copy and this file agree. The spoken script was not affected. |

**Fee fix needed.** Issue #37 and Rohan's assumptions draft (PR #74, closed without merging; #12 is still open) say the distributor gets **$98.40** on a $100 sale. The contract pays **$98.50**. $98.40 was the older version with a 0.10% usage fee on top of the 1.5% credit fee. That fee was dropped for credit sales on Nov 10 (context §16; `lib.rs:19` and `:580`). This file uses $98.50, as `docs/facts.md` entry 29 does (it lists $98.40 under "Never use"). Rohan should make sure the assumptions doc that replaces #74 says $98.50 before the finals.

## 1. Trifold

**The print file** is `docs/trifold/trifold.html`: the layout at the board's real size, 48 x 36 in open. `node docs/trifold/render.mjs` builds, for each fold layout below, a PDF of the whole board plus one PDF per panel (`-left`, `-centre`, `-right`, each at its own size, for a shop that prints panel by panel) in `docs/trifold/out/` (git-ignored: share the PDFs, don't commit them), and a small preview with the fold marks drawn on (`docs/trifold/preview-12-24-12.jpg`, `preview-16-16-16.jpg`). It needs Google Chrome and no npm packages. The call script and email for the print shop are in `docs/trifold/print-shop.md`. Anything still missing is yellow, and `node docs/trifold/render.mjs --final` refuses to build while yellow is left or a picture is under 100 pixels per inch. The copy in the panels below is the copy on the board; edit both together.

### Which fold? Measure the board first

Nobody has measured our board. Most 36 x 48 in tri-fold boards are 36 in tall and fold **12 + 24 + 12 in**: a wide centre and two narrow wings. The first draft of this file assumed **three 16 in panels**. The two layouts are very different, so both are built:

| | **A: 12 + 24 + 12 in** | **B: 16 + 16 + 16 in** |
|---|---|---|
| Preview | `preview-12-24-12.jpg` | `preview-16-16-16.jpg` |
| Left: the problem | 12 in wing | 16 in |
| Centre: name, two key points, phones, QR, diagram | 24 in | 16 in |
| Right: the business | 12 in wing | 16 in |
| Phones, each | 6 in wide | 3.95 in wide |
| Two key points | 50 pt | 40 pt |
| Diagram | 17 in wide: 113 pixels per inch at 1x | 14.5 in wide: 132 pixels per inch at 1x |
| Text share of the board | 16.0% | 15.4% |

**To measure:** open the board flat. With a tape measure, write down the height, then the distance from the left edge to the first crease, from the first crease to the second, and from the second to the right edge. If it reads about 12, 24, 12, use A. If it reads three equal panels, use B. If it is something else, the widths are two lines of CSS at the top of `trifold.html`; send me the numbers.

```
A: 12 + 24 + 12 in                                B: 16 + 16 + 16 in
+----------+--------------------+----------+     +--------------+--------------+--------------+
| THE      | Relay (96 pt)      | THE      |     | THE PROBLEM  | Relay        | THE BUSINESS |
| PROBLEM  | Paga tu ruta       | BUSINESS |     |              | Paga tu ruta |              |
|          | KEY POINT 1        |          |     | Rosa, 2 para | KEY POINT 1  | $100 delivery|
| Rosa     | KEY POINT 2        | $100     |     |              | KEY POINT 2  | Our plan     |
|          | HOW IT WORKS       | delivery |     | $5.7 tn      | HOW IT WORKS | Where next   |
| $5.7 tn  | [ph]  [ph]  [ph]   | Our plan |     | $2 bn a year | [ph][ph][ph] | Risk #1      |
| $2 bn    |                    | Next     |     | $35 per $100 | [QR] Scan    | What we heard|
| $35      | [QR]  [diagram   ] | Risk #1  |     |              | [diagram   ] |              |
| sources  |                    | Heard [N]|     | sources      |              |              |
+----------+--------------------+----------+     +--------------+--------------+--------------+
```

### What the layout checks (re-measured Nov 12 night, after Relay went in; both layouts pass)

- Nothing runs past the bottom or the sides of a panel, so nothing crosses a fold. Blocks are spread from top to bottom; the biggest gap between blocks is 9.0 in on the left wing in A (9.5 in on the left panel in B), so it still looks airy, not crowded.
- Text covers 16.0% (A) and 15.4% (B) of the board, against the 25% limit. The board carries **456 words** (452 before Relay, the tagline "Paga tu ruta" and the printed address went in: the name replaced one yellow `[NAME]`, so +3 for the tagline and +1 for `relay-sv.vercel.app`; 401 before the Nov 12 source-check edits; 446 before the facts entry 40 cite and the "(2019 survey)" added to the Rosa line and the first key point), 118 of them 16 pt source lines. (The first draft guessed "about 300 words" and 9%; this is the measured figure.)
- Type: body 32 pt (the top of Velocity's 24 to 32 pt), captions 28 pt, headings 38 to 40 pt, title 96 pt, source lines 16 pt. The three big numbers (104 pt) and the two key points (50 pt or 40 pt) are display type, on purpose larger than a heading.
- The QR is 5 in square with a white border (the assembly spec in PR #85, `docs/trifold-assembly.md`, asks for at least 4 in). The PDF is one page, 3456 x 2592 pt, with the fonts embedded and the text kept as text.

### To ask for, through Jack (the owner of PR #85, the Sunday scaffold)

> Please re-render `docs/img/architecture.png` at 2x (3840 x 2160 px) and save it as `docs/img/architecture@2x.png`. Keep the 1x file as it is, because the README, the slides and the deck use it. Change `--force-device-scale-factor=1` and the matching `--window-size` in `docs/slides/render.mjs`, as `docs/trifold-assembly.md` says, and keep the text crisp. It is the only picture from `docs/img/` on the board, because the code slide is not on it. At 2x it is 226 pixels per inch in layout A and 265 in layout B. 3x is not needed.

The layout picks up `architecture@2x.png` by itself when it exists, and `render.mjs` prints each picture's pixels per inch so we can see it worked.

### Two key points (proposal, the team agrees on the paper sketch)

> **Stock on credit at no interest, not about $35 per $100 (2019 survey).**
> **Distributors pay a small fee. Shops never do.**

### Centre: title

> **Relay**
> **Paga tu ruta**
> Pay the truck now, in cash, or in 7 days. No interest.

### Left panel: the problem

> **The problem**
> Rosa's truck is at the door and she is short on cash. A loan shark hands her the money today, at about $35 for every $100 (2019 survey).
> Delivery crews in El Salvador have been robbed and extorted, and in a four-country survey, 8 in 10 small businesses pay suppliers mainly in cash.
>
> **$5.7 trillion**
> in credit that small businesses in developing countries need and can't get
>
> **$2 billion a year**
> what distributors sell to El Salvador's 50,000+ neighbourhood shops (Conamype estimate)
>
> **$35 per $100**
> what a loan shark charges (2019 survey). 6 in 10 informal small businesses have borrowed from one.

Small print (14 pt):
- "Rosa is an example, not a real interview."
- $5.7 trillion: IFC and SME Finance Forum, "MSME Finance Gap", Mar 2025 (2019 data). Facts entry 22.
- $2 billion: Conamype estimate, via Diario El Salvador, 27 Feb 2026. Shop count: Distribución Dinámica, via Diario El Mundo, 1 Mar 2026. Entries 1 and 3.
- $35 per $100: CIOPS (UTEC) survey of 1,285 merchants, 2019, via Revista E&N. 6 in 10: FUSAI and ASOMI, via El Diario de Hoy, Jul 2026. Entries 9 and 10.
- Crews: robbed, El Diario de Hoy, 23 Jul 2024; extorted, Brown et al., Review of Economic Studies. Cash: El Salvador, Guatemala, Honduras and Mexico, 2022 survey, via Diario El Mundo, 10 Apr 2025. Entries 11 and 40.

Source check, Nov 12: the crew line is entry 40 in `docs/facts.md` (cash is entry 11). One robbery case (2023, reported 2024) and extortion data from 2012 to 2019 are all we have, so the line says "have been", not "are", as entry 40's safe wording does. We cut "nobody can easily see which driver collected what cash": it was our assumption, not a sourced fact. If we keep the idea, say it as our view ("we think...").

### Middle panel: how it works

> **How it works**
> Pay now: digital dollars
> Pay in 7 days: full price, no interest
> Cash: driver and shop confirm with two taps
> Scan to try it
> relay-sv.vercel.app
> Live on Stellar testnet with test dollars. Cash-in is simulated.

- **Three phone screenshots, left to right:** the shop's "Pagar ahora / Pagar en 7 días / Pagué en efectivo" screen; the shop's "Debe … vence …" screen after a credit payment; the driver's "Recibí efectivo" screen. The app is in Spanish, so the captions above are in English.
- **QR:** `public/qr-demo.png` from #55 (on `main` since PR #70 merged; regenerated for relay-sv.vercel.app in PR #102, Nov 12). The address is printed under "Scan to try it" so someone whose phone can't scan can type it.
- **Diagram:** `docs/img/architecture.png` (#62), titled "How it works on Stellar". It says "Amounts are public. Names are not."
- Leave the contract ID off the board. It changed at the Thursday redeploy (#52, #90) and may change again; `config/testnet.json` (`contracts.routeLedger`) and the README carry the current one. No contract ID appears in this file or in `docs/trifold/`.

### Right panel: the business

> **The business**
> **One $100 delivery, paid in 7 days**
> The lender pool pays the distributor now: **$98.50**
> The shop repays in 7 days: **$100**, no interest
> The fee, up to 1.5%: $0.75 buffer, $0.50 lenders, $0.25 us
> The distributor pays because it is paid at the door and carries no risk of the shop not paying.
>
> **Our plan**
> One distributor's routes first
> A bank or cash-in partner for the cash
> A licensed lender funds the pool
>
> **Where we go next**
> El Salvador, then Ecuador and Panama (they also use the US dollar), then Guatemala and Honduras, then Mexico and Peru
>
> **Risk #1: cash to digital dollars**
> Not solved yet. Our demo simulates it. Plan: shops repay weekly like a bill at a bank or payment point, and a licensed partner converts in bulk and does KYC and KYB.
>
> **What we heard**
> We talked to [N] people and [N] tried the prototype. Because of them we changed [what we changed].

"Our plan" is a plan, not a deal: no bank, cash-in company or lender has agreed to anything yet. Do not word it as if one had.

## 2. Pitch script v1 (3:00, one speaker, the 1-minute video included)

The draft has 259 spoken words. At 140 words a minute, the full one-minute video and two seconds on each side for playback put the pitch at about 2:55. Count the final wording after filling the placeholders and time it aloud in the first run-through (#39).

### 0:00 to 0:25

> Around the world, small businesses in developing countries can't get about $5.7 trillion in credit they need. In El Salvador, more than 50,000 neighbourhood shops buy about $2 billion a year from distributors, says Conamype. Picture Rosa, short when the truck arrives. A loan shark lends today: about $35 per $100 (2019 survey).

### 0:25 to 0:55

> So we built Relay. A shop pays in digital dollars, pays cash that driver and shop confirm with two taps, or pays in seven days at full price, no interest. The rules and fees sit in a public Stellar contract, and Stellar says payments are final in about five seconds. The US dollar has been El Salvador's legal tender since 2001. Watch.

### 0:55 to 1:55: the video (#35)

Play the full 60-second working-prototype video from 0:00. Keep the MP4 on the laptop and let the video play without live narration. Use the same file for rehearsals and the showcase. [Velocity's Devpost requirements](https://blockchain-stellar-ic.devpost.com/#requirements)

### 1:55 to 2:30

> Who pays? The distributor, never the shop. On a $100 sale paid in seven days, a lender pool pays the distributor $98.50 now. That 1.5% fee is 75 cents to a default buffer, 50 to lenders, 25 to us. The shop repays $100 and builds a record it never had. We start with one distributor's routes, a bank or cash-in partner, and a licensed lender. Then Ecuador and Panama, which also use the US dollar.

### 2:30 to 2:50

> Our biggest risk: turning a shop's cash into digital dollars isn't solved, and our demo simulates it. Our plan: shops repay weekly like a bill, and a licensed partner converts in bulk and does KYC and KYB. We spoke to [N] people; they made us change [one thing].

### 2:50 to 3:00

> Stock without the loan shark. Payment at the door. Relay: one record everyone can trust. Scan the code to try it.

### Timing at 140 words a minute

The headings above are the issue's windows. The table estimates the full run, including playback and the two handoffs.

| Part | Words | Seconds | Starts at | Ends at |
|---|---|---|---|---|
| 0:00 segment | 53 | 22.7 | 0:00.0 | 0:22.7 |
| 0:25 segment, ends on "Watch." | 62 | 26.6 | 0:22.7 | 0:49.3 |
| Start the video | | 2.0 | 0:49.3 | 0:51.3 |
| Full demo video (#35) | | 60.0 | 0:51.3 | 1:51.3 |
| Stop the video, step back to the mic | | 2.0 | 1:51.3 | 1:53.3 |
| 1:55 segment | 75 | 32.1 | 1:53.3 | 2:25.4 |
| 2:30 segment | 48 | 20.6 | 2:25.4 | 2:46.0 |
| Close | 21 | 9.0 | 2:46.0 | 2:55.0 |
| **Total** | **259** | | | **2:55.0** |

That leaves about **5 s** under the 3:00 limit. At 130 words a minute, the estimate is about 3:04. Use these cuts in order until a timed run comes in under 2:55:
1. 0:25 segment: "The US dollar has been El Salvador's legal tender since 2001." (11 words, 4.7 s). The 1:55 segment and the board still say Ecuador and Panama "also use the US dollar".
2. 1:55 segment: "That 1.5% fee is 75 cents to a default buffer, 50 to lenders, 25 to us." (16 words, 6.9 s). The board carries the split.
3. 1:55 segment: "and builds a record it never had" (7 words, 3.0 s). Keep it if there is time: it is the credit-record point.

Do not cut "says Conamype", "(2019 survey)", or "KYC and KYB". The fact sheet and our technical and finance advisor require them.

**Delivery notes**
- "Rosa" is made up. Say "picture", so nobody takes her for a real interview, and drop her if #30 gives us a real story we may tell.
- Keep "in a 2019 survey" and "says Conamype". The fact sheet's "say this, not that" table requires the year and the attribution.
- To answer "how do you make money" in 30 seconds, add: "And 10 cents per $100 on invoices paid now or in cash." That is the 0.1% usage fee (`USAGE_FEE_BPS = 10`). It is not in the script because it does not fit the 35 seconds.

## 3. Checked against the repo

| What the pitch or trifold says | Checked against | Result |
|---|---|---|
| The distributor gets $98.50 per $100 paid in 7 days | `lib.rs:19` ("$98.50 for every $100"), `:22` (`CREDIT_FEE_BPS` = 150), `:580` (payout = amount minus that fee); `lib/labels.ts` | Matches (facts entry 29). Issue #37 and PR #74 say $98.40, which is out of date. |
| The 1.5% splits $0.75 buffer, $0.50 lenders, $0.25 us | `fee_split` in `lib.rs` (#139): lenders always `LENDER_BPS` 50, the rest 3:1 buffer : us; at 150 bps that is 75 / 50 / 25 | Matches at full credit |
| The shop pays no fee and no interest | `lib.rs:385-388` (the usage fee comes out of the distributor's side, so the shop pays the invoice amount); `:605` (the shop owes only `amount`) | Matches |
| 0.1% on invoices paid now or in cash | `USAGE_FEE_BPS = 10` (`lib.rs:20`); context §5 | Matches. Credit sales pay no usage fee. |
| Repaying on time builds a record | The limit grows by $25 up to $500 (`LIMIT_STEP`, `LIMIT_CAP`, `lib.rs:32-34`, `:678`), only after a $40+ cycle and once per credit period (context §16, Nov 10) | Matches. The script says "builds a record" and no more. |
| Live on Stellar testnet with test dollars, cash-in simulated | Context §6; the diagram says "Stellar testnet" and "Test USDC" | Matches |
| Names stay off the public ledger | Context §8.4; the diagram | Matches. Amounts are public. |
| "Public contract", not "open source" | #48 removed the MIT licence; the code is all rights reserved | The repo is public and the contract is checkable on Stellar. Do not say "open source". |
| Ecuador and Panama use the US dollar | Context §7.6 (order); `docs/facts.md` entries 25 (IMF: "an officially dollarized economy since January 2000") and 26 (Cato Journal: "In 1904, the U. S. dollar became legal tender in Panama.") | Matches. The entries are on `main` since #73. |
| "The US dollar has been El Salvador's legal tender since 2001" (0:25 segment) | `docs/facts.md` entry 39: IMF Country Report 25/58, PDF p. 88, "As the U.S. dollar is the official legal tender since January 1st, 2001" (BCR as backup) | Sourced. Entry 39 says "Use in: deck / Q&A", so saying it in the 3-minute pitch is our choice (it is cut 1). It says nothing about digital dollars: never say or imply they are legal tender or widely held. |
| "Stellar says payments are final in about five seconds" (0:25 segment); "fees under a cent" (answer 6) | `docs/facts.md` entries 36 (developers.stellar.org: "Ledgers close in ~5 seconds, and their transactions are final when they do.") and 37 (stellar.org/solutions/cross-border-payments: "network fees under a cent") | Matches. Both are Stellar describing itself, and a teammate still has to open the links (entries 36 and 37 say so). Stellar's own pages give conflicting USD fee figures, so the script gives no dollar fee and attributes the claim. |
| Delivery crews in El Salvador have been robbed and extorted; 8 in 10 small businesses in four countries pay suppliers mainly in cash (left panel) | Crews: entry 40 (El Diario de Hoy, 23 Jul 2024, one 2023 case; Brown et al., Review of Economic Studies, data 2012 to 2019). Cash: entry 11 | Matches entry 40's safe wording and entry 11 (regional, four countries). A teammate still has to open entry 40's links. |
| MoneyGram lists cash-out in El Salvador, we found no cash-in (answer 3) | Entry 38: moneygram.com/stellar, "Cash-out is available in 170+ countries and territories and cash-in in 25+ countries"; its coverage data lists El Salvador as cash-out only | Matches entry 38's safe wording ("as far as we found"). "Cash-out only" is false in general. No person has looked at the map yet (entry 38). |
| The product is called Relay, tagline "Paga tu ruta" (script, board title) | `lib/brand.ts` on `main`: `APP_NAME = "Relay"`, `TAGLINE = "Paga tu ruta"`; PR #100 | Matches |
| The app is at relay-sv.vercel.app (board, under the QR) | `curl -sI https://relay-sv.vercel.app` answers 200 (Nov 12 night); the old tiendas-stellar address answers 307 to it. `public/qr-demo.png` decodes (macOS CoreImage) to `https://relay-sv.vercel.app/demo` | Matches |
| Fee sponsorship and passkeys | Not on `main`. The diagram says "Will pay the network fees". | **Not claimed** in either text. |

## 4. Never say

- $7 billion, "about 70,000 shops", $5 billion as our market, MoneyGram's 5%, the Chivo $30 bonus or fuel discounts.
- "$5.7 trillion" as our market or what we can earn. It is a finance gap.
- "85,265 neighbourhood shops" on its own (it counts eateries and street vendors), "85% owned by women" (say "most"), "62% of small businesses" (it is informal ones), "$35 per $100" without the year.
- "8 in 10 pay suppliers in cash" or "mostly in cash" for El Salvador alone. The 80% covers four countries.
- "Open source", "audited" (we did a contract safety review with tests, `docs/security.md`, not an outside audit), "fee sponsorship" or "passkeys" as built.
- That any bank, cash-in company or lender has agreed to anything.
- To shop owners: "blockchain", "wallet", "crypto". Say "dólares digitales". To judges, say Stellar.

## 5. Answer bank for the judge questions (#39)

The eight questions from #39, each with an answer that fits **20 seconds (46 words at 140 words a minute)**; the money answer gets 30 seconds (70 words). Written Nov 11, using only facts from `docs/facts.md`, the contract, `docs/credit-model.md` and `docs/context.md`. **Audited Nov 12 evening against #39:** all eight answers fit (35 to 46 words, 15.0 to 19.7 s; the money answer is 59 words, 25.3 s, inside its 30 s), and every follow-up is 41 words or fewer, so none was shortened. Where something is our own reasoning or a guess, the answer says so. A `[bracket]` is filled from `docs/research.md` (#7, #30); if a count is zero, say zero.

**How to grade a run-through answer** (for the asker, #39): 1) *Accurate:* every number matches its "Facts" line. 2) *Clear:* someone who has never heard of a tienda follows it. 3) *On time:* 20 seconds or less. 4) *Honest:* it says "plan" where nothing is signed, and "our guess" where it is one. Write what was weak under "Sunday fixes" at the end of this section, and rewrite the answer here.

### 1. How do you make money? (30 seconds)

> Distributors pay us; shops never do. On a pay-in-seven-days sale the distributor pays up to 1.5% to be paid at the door, less when the shop pays part up front. At most 25 cents of each $100 is ours; the rest goes to lenders and a loss buffer. Invoices paid now or in cash: 0.1%. Both fees are in a public contract anyone can check.

65 words, 27.9 s (at the old answer's pace).
- **Facts:** `docs/facts.md` entries 29 and 30, and the contract: `CREDIT_FEE_BPS` 150 (top) and `MIN_CREDIT_FEE_BPS` 100, split by `fee_split`: `LENDER_BPS` 50, the rest 3:1 buffer : us (75 / 25 at 150); `USAGE_FEE_BPS` 10. Credit sales pay no usage fee (context §16, Nov 10). For cash the 0.1% is recorded and billed later, not collected yet (`docs/security.md` limit 6).
- **Must include:** the distributor pays, the shop never does; both fee rates; the contract is public.
- **Never:** MoneyGram's 5%, or "we charge shops".
- **If they push, "how big could it get?" (20 s):** > As a scenario, not a forecast: if 10% of the $2 billion went through pay in 7 days, our 0.25% is about $500,000 a year, plus 0.1% on the rest, about $1.8 million. That is our guess; Rohan is checking it. (41 words; facts entry 30, context §5. Rohan's `docs/assumptions.md` (#12) replaces this when it lands.)

### 2. How do you get into El Salvador?

> We start with one mid-size distributor's routes: the driver's QR opens the app, nothing to install. For cash, a bank or cash-in partner. A licensed lender or cooperative funds the pool. That's a plan: nobody has agreed yet. We've emailed [N] partners.

42 words, 18.0 s.
- **Facts:** context §14; our startup advisor (§14, `docs/research.md` "Advisor 1"): partner with banks and cash-in companies that already have a reputation in El Salvador. The count of emails and replies comes from `docs/research.md`.
- **Must include:** one distributor first; a partner for cash; a licensed lender; that none of it is agreed.
- **Never:** that any bank, cash-in company or lender has agreed to anything.
- **If they push, "why would a distributor switch?":** > It is paid at the door instead of a week later, and carries less cash and less risk. (18 words; context §5. "Sells more" was cut Nov 12: it is our assumption, not a fact.)

### 3. How does a shop get digital dollars? (Risk #1)

> Our biggest risk, and not solved: cash-in. MoneyGram lists cash-out in El Salvador, but we found no cash-in. Our plan: shops repay weekly like a bill, at a bank or payment point, and a licensed partner converts the cash in bulk. Our demo simulates cash-in.

45 words, 19.3 s. ("No shop pre-loads money." was cut to fit 20 s after the MoneyGram hedge; say it if asked.)
- **Facts:** context §6: the Nov 7 finding (MoneyGram has cash-out points in El Salvador, cash-in is open; MoneyGram's own page, moneygram.com/stellar, says cash-out in 170+ countries and territories and cash-in in 25+, so "cash-out only" is false in general and we only say what we found here), ideas 1 (repay like a bill), 2 and 10 (one weekly trip, no deposit at sign-up) and 12 (partner, don't build). README "Risk #1". The demo labels cash-in as simulated on screen.
- **Must include:** say it first, say "not solved", then the plan.
- **Never:** that cash-in is solved, that a partner exists, that shops can already convert cash cheaply, or that MoneyGram covers "cash-out only".
- **If they push, "what does cash-in cost?":** > We don't know yet what cash-in costs per $100, or how far a typical shop is from a payment point. Finding that out is the next step with a partner. (30 words; context §6 "Still to find out".)

### 4. What if a shop doesn't pay?

> Limits start small and top out at $500. No new credit while anything is overdue. A buffer, 75 cents of each $100 fee, absorbs losses first. Four periods late, it repays the lenders what it can and the shop's credit is cut off.

43 words, 18.4 s.
- **Facts:** `docs/facts.md` entries 31 and 32, and the contract: `LIMIT_CAP` $500; the `Overdue` check in `pay_with_credit`; the buffer's share from `fee_split` (75 bps at full credit); `cover_default` after `DEFAULT_AFTER_PERIODS` = 4 credit periods. **`cover_default` is called by the admin; it does not run by itself.** Every shop starts at $200 (#134); matching it to one average delivery is a later step (`docs/credit-model.md`). `docs/security.md` limit 11: credit risk is real.
- **Must include:** small limits, nothing new while overdue, the buffer, the four-period rule.
- **Never:** "no risk", or that the contract writes off a debt automatically.
- **If they push, "what if losses beat the buffer?":** > Past about 0.75% of credit sales lost, the buffer is used up and the lenders take the loss. That's why limits start small and a licensed lender, not us, funds the pool. (32 words; context §5, "what could break it".)

### 5. Is it legal? (interest-rate cap, KYC/KYB)

> Shops pay no interest; distributors pay a fee to be paid early. Interest is capped by law, so a lawyer should confirm that fee isn't interest. A licensed partner lends and does KYC on shop owners and KYB on distributors. We aren't the lender.

44 words, 18.9 s.
- **Facts:** `docs/facts.md` entry 18 (Ley Contra la Usura; its caveat: "a lawyer should confirm that fee isn't treated as interest"); context §11 and §14 (a licensed lender; KYC and KYB done by the licensed partner; we are not the lender).
- **Must include:** no interest for shops; the lawyer check; KYC and KYB; "not the lender".
- **Never:** "it is legal" or "it is approved", or that we hold a licence. We have none.
- **If they push, "what is the cap?":** > The cap is 1.6 times the average rate for each type of loan, published by the central bank twice a year. We haven't found the exact microcredit cap, so we'd ask a lawyer. (33 words; entry 18, whose 1.6x and January and July details come from secondary sources: check Arts. 5 to 8 of the law before saying the article number.)

### 6. Why Stellar, and not Transfer365 plus a database?

> Transfer365 only moves money between bank accounts; fewer than half of adults have one. No credit, no invoice matching. A distributor's database isn't a record lenders trust. Our public contract enforces the rules. Stellar says payments are final in about five seconds, fees under a cent.

46 words, 19.7 s.
- **Facts:** entry 14 (Transfer365: free, between bank accounts, more than $4 billion a month; say "more than 9 in 10", not 93% or 95.3%); entries 12 and 13 ("fewer than half of adults"); context §14 for the reasoning.
- **Must include:** Transfer365 is free and good but needs an account; no credit or invoice records; a shared, checkable record; Stellar's own figures: final in about five seconds, fees "under a cent" (developers.stellar.org; stellar.org/solutions/cross-border-payments).
- **Never:** that cheaper transfers are our pitch, "open source" (say "public contract"), fee sponsorship and passkeys as built, or a dollar fee for Stellar (its own pages give conflicting USD figures; attribute it: "Stellar says ... fees under a cent").

### 7. What do El Salvador's credit bureaus already cover? Do tiendas have DUNS numbers?

> Three private bureaus: Equifax, TransUnion and INFORED. They see only formal credit, so a shop's supplier credit and loan-shark debt never show up; our payment record fills that gap. A DUNS number is a nine-digit business ID; I'd expect most tiendas don't have one.

44 words, 18.9 s.
- **Facts:** entry 15 (the three bureaus, licensed and supervised by the SSF; they only see formal credit), entry 16 (the SSF's public credit registry, also only supervised lenders), entry 17 (a DUNS number: nine digits, free to request, not required to operate).
- **Must include:** the three names; formal credit only; what a DUNS number is.
- **Never:** state "tiendas have no DUNS number" as a fact. It is our expectation (entry 17 labels it our reasoning), because Conamype says the state bank's tienda loans are open even to informal shops.

### 8. Have real users tried it?

> We spoke to [N] people and [N] tried the prototype. Walkthroughs with non-Salvadoran shop owners only show whether it's easy to use, not that the problem is real. Because of them we changed [one thing].

35 words, 15.0 s.
- **Facts:** `docs/research.md` (#7, #30; on `main` since PR #72, but it logs only the advisor calls so far, no interviews or walkthroughs). Context §13: tests with local corner-store owners count for "is it easy to use", not as proof of the El Salvador problem; if fewer than 5 conversations, say the real number.
- **Must include:** the real counts, the usability-only label, one thing we changed.
- **Never:** round up, count a walkthrough as an interview, or call the Rosa story a real interview.

### Extra: "Why not BFA?" (flagged on #8: judges may ask it)

> BFA, the state bank, lends tiendas up to $10,000, approved in 72 hours: a loan you apply for. Ours is seven-day stock credit at the truck, tied to each delivery, no interest, and it builds a payment record.

38 words, 16.3 s. **Facts:** entry 20 (BFA, backed by Conamype's guarantees; more than $1.4 million in 440 loans, so about $3,200 each by our maths).

### Sunday fixes (fill in during the run-throughs, #39)

`docs/run-throughs/` (PR #85) holds the timings and the full Q&A log. This table records only what was changed in this file.

| Run | Question | What was weak | The fix (new wording is above) |
|---|---|---|---|
| | | | |
