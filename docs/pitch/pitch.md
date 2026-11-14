# Trifold and pitch script v1 (#37)

Draft for issue #37, written Wed Nov 11. The pitcher picked in #26 owns the script from v1 on. **Not final:** the open items below are things v1 could not fill, and every one is marked in the text with a `[bracket]`.

## Open items

Status as of Thu Nov 12, evening. Update the "Status" column when an input lands, and delete the row when the placeholder is gone from the text.

| # | What is missing | Who | Status | What v1 does meanwhile |
|---|---|---|---|---|
| 1 | Final wording of the worldwide number (#51), due Sat noon | Rohan | **Done.** #51 is closed and PR #73 is merged (Nov 12): entry 22 and the "Opening line" are in `docs/facts.md` on `main`. | The 0:00 segment is the #73 opening line ($5.7 trillion) with "says Conamype" added (entry 1 asks for the attribution) and without "alone" after "In El Salvador". Put "alone" back to match #73 word for word (+1 word, 0.4 s). |
| 2 | Team name (#26) | Everyone | **Done.** Yahya picked **Relay**, tagline **Del efectivo al crédito**, on Nov 12 (PR #100, merged: `lib/brand.ts` has both). The app is at **relay-sv.vercel.app**; the old tiendas-stellar address only redirects (PR #102). | Relay is in the script, the board and the answer bank. The board shows the tagline under the title and prints the address under the QR. Nothing is left to do here. |
| 3 | Pitcher (#26) | Everyone | **Open.** #26 is closed and records no pitcher either. | Written for one speaker, in first person. |
| 4 | "What we heard from N people" (#30). | Rohan | **Cut from the board on Sat Nov 14 (#40).** The team has spoken to 0 people: PR #152 logs messages sent (7 requests to shops and distributors, 5 advice emails to nonprofits), not conversations, and the team rule (#61) is that a zero means the line is cut, not "0". The two advisor calls are advisors, not users. `docs/research.md` still logs only those calls. | The board has no "what we heard" panel and no yellow. Add one back only with a real count. The script and the deck already say messages sent and 0 conversations. |
| 5 | Three real phone screenshots. `docs/screenshots/mock-screens-nov10.png` is a mock, not for the board | Jack | **Done Sat Nov 14 (#40).** The Nov 13 captures were from before #125 and #126 (the ES / EN switch, the paper-slip screens and the sticky pay buttons), so they were retaken from `main` in mock mode: `docs/pitch/trifold/img/shop-pay.png`, `shop-credit.png`, `driver-cash.png`, 360 x 760 px at device pixel ratio 3 (1080 x 2280 px; 241 pixels per inch at 4.5 in on the board, measured by the reviewer of PR #173 at `b256501`), with the testnet banner in frame (the driver one is scrolled so its QR and the "Recibí efectivo" button both show). | Three real screens on the board, but they are pre-redesign and show old numbers (7 days, $200 limit). Retake all three on the final deploy Sunday, after the team agrees the product. |
| 6 | Demo QR `public/qr-demo.png` (#55, PR #70) | Yahya | **Merged** (PR #70, Nov 12). The file is `public/qr-demo.png` on `main` (1200 x 1200 px, well over 200 pixels per inch at its printed size). PR #102 (Nov 12) regenerated it for the new address. Decoded on Nov 12 evening with macOS CoreImage, from the file on `main`: it opens `https://relay-sv.vercel.app/demo`. `curl -sI https://relay-sv.vercel.app` answers 200. Scan the printed copy on 3 phones (#40). | The layout reads `public/qr-demo.png` and now renders it. |
| 7 | Board size | Yahya | **Done Nov 14:** measured 27 in tall, 9 + 19 + 9 in. | `trifold.html` is built at that size; layouts A and B are gone. |
| 8 | Paper sketch agreed, print-ready file link in the group chat | Yahya | **Open.** The layout builds a 37 x 27 in PDF (`node docs/pitch/trifold/render.mjs`). Product numbers are yellow until the team agrees the final product (Sun afternoon). | The PDFs are not committed (`out/` is git-ignored); Yahya builds the final one and shares it. |
| 9 | The one-minute demo video (#35) | Yahya | **Open.** The shot list is in `docs/pitch/demo-video.md`. | Rehearse with the full 60-second file from 0:00. Keep the same cut available offline for the showcase. |
| 10 | A sharper diagram: `docs/img/architecture.png` is 1920 x 1080 px, which is 149 pixels per inch at the 12.9 in it has on the board (measured by the reviewer of PR #173 at `b256501`; `render.mjs` says "below 150") | Whoever builds the final board (Yahya, Jack) | **Nobody needs to be asked: `docs/pitch/slides/render.mjs` already takes `SCALE`.** `architecture@2x.png` is git-ignored (`.gitignore` line 174), so a fresh checkout does not have it: run `SCALE=2 node docs/pitch/slides/render.mjs` before the final render. Not measured at 2x yet (3840 px over 12.9 in would be about 298 pixels per inch). Details are in section 1. | Without the 2x file the layout uses the 1x file (149) and prints a warning. It picks up `architecture@2x.png` by itself when it exists. |
| 11 | Copy the Nov 12 source-check edits from this file into `docs/pitch/trifold/trifold.html`: the left-panel crews and cash line (+12 words and a source line) and the right-panel "and sells more" cut (-3 words). Then run `node docs/pitch/trifold/render.mjs` and re-measure the word count and text share in section 1 | Jack | **Done Nov 12.** `trifold.html` has the new crews and cash line (+12 words), its source line (+35 words) and the "and sells more" cut (net -2 words, because "and" had to be added before "carries"). Re-rendered: the board was then 446 words (was 401; it is 456 now), text share 15.5% (A) and 15% (B) then (16.0% and 15.4% now), all panels fit. | None: the board copy and this file agree. The spoken script was not affected. |

**Fee fix needed.** Issue #37 and Rohan's assumptions draft (PR #74, closed without merging; #12 is still open) say the distributor gets **$98.40** on a $100 sale. The contract pays **$98.50**. $98.40 was the older version with a 0.10% usage fee on top of the 1.5% credit fee. That fee was dropped for credit sales on Nov 10 (context §16; `lib.rs:17-19` and `:613-618`). This file uses $98.50, as `docs/facts.md` entry 29 does (it lists $98.40 under "Never use"). Rohan should make sure the assumptions doc that replaces #74 says $98.50 before the finals.

## 1. Trifold

**The print file** is `docs/pitch/trifold/trifold.html`: the layout at the board's real size, 9 + 19 + 9 in wide and 27 in tall (about 37 x 27 in open). `node docs/pitch/trifold/render.mjs` builds a PDF of the whole board plus one PDF per panel (`-left`, `-centre`, `-right`, each at its own size, for a shop that prints panel by panel) in `docs/pitch/trifold/out/` (git-ignored: share the PDFs, don't commit them), and a small preview with the fold marks drawn on (`docs/pitch/trifold/preview-9-19-9.jpg`). It needs Google Chrome and no npm packages. The call script and email for the print shop are in `docs/pitch/trifold/print-shop.md`. Anything still missing is yellow, and `node docs/pitch/trifold/render.mjs --final` refuses to build while yellow is left or a picture is under 100 pixels per inch. The copy in the panels below is the copy on the board; edit both together.

### The board (measured Nov 14)

Velocity's board is 27 in tall and folds **9 + 19 + 9 in** (about 37 x 27 in open). Layouts A (12 + 24 + 12) and B (16 + 16 + 16) are gone. Preview: `docs/pitch/trifold/preview-9-19-9.jpg`.

**No final product numbers yet (Yahya, Nov 14).** Days to pay, payout, fee and its split, and the starting limit are yellow `[ ]` boxes on the board and in the copy below, until the team agrees the final product (Sunday afternoon). `render.mjs --final` fails until they are filled, on purpose.

### What the layout checks (Nov 14, 9 + 19 + 9 in)

- All three panels fit; nothing crosses a fold.
- Text covers about 15% of the board (limit 25%).
- Type: body 24 pt (the bottom of Velocity's 24 to 32 pt), captions 24 pt, headings 28 to 30 pt, title 72 pt, source lines 12 pt. The three big numbers (76 pt) and the two key points (36 pt) are display type.
- The QR, measured at `b256501` (reviewer of PR #173): the picture, with its white border, is 4.36 in square; the code itself is about 3.5 in. The assembly spec's "at least 4 in" is met by the picture, not by the code. The test decides: scan the printed board from about 1 m on 3 phones.
- Pictures, measured at `b256501`: phone screens 241 pixels per inch at 4.5 in, QR picture 275 at 4.36 in, diagram 149 at 12.9 in with the 1x file (the 2x file below is not in a fresh checkout: run `SCALE=2 node docs/pitch/slides/render.mjs` first).

### To ask for, through Jack (the owner of PR #85, the Sunday scaffold)

Nothing is left to ask for: the script already takes `SCALE`. Run this before the final render:

> `SCALE=2 node docs/pitch/slides/render.mjs` re-renders the diagram at 2x (3840 x 2160 px) and saves it as `docs/img/architecture@2x.png`. The 1x file stays as it is, because the README, the slides and the deck use it. The diagram is the only picture from `docs/img/` on the board, because the code slide is not on it. The 1x file is 149 pixels per inch at the 12.9 in it has on the board (measured by the reviewer of PR #173 at `b256501`); 3840 px over 12.9 in would be about 298, not measured yet. 3x is not needed.

The layout picks up `architecture@2x.png` by itself when it exists, and `render.mjs` prints each picture's pixels per inch so we can see it worked.

### Two key points (proposal, the team agrees on the paper sketch)

> **Stock on credit at no interest, not about $35 per $100 (2019 survey).**
> **Distributors pay a small fee. Shops never do.**

### Centre: title

> **Relay**
> **Del efectivo al crédito**
> Pay the truck now, in cash, or in [N] days. No interest.

### Left panel: the problem

> **The problem**
> Rosa's truck is at the door and she is short on cash. A loan shark hands her the money today, at about $35 for every $100 (2019 survey).
> In a four-country survey, 8 in 10 small businesses pay suppliers mainly in cash.
>
> **$5.7 trillion**
> in credit that small businesses in developing countries need and can't get
>
> **$2 billion a year**
> what distributors sell to El Salvador's 50,000+ neighbourhood shops (Conamype estimate)
>
> **About $35 per $100**
> what a loan shark charges (2019 survey). 6 in 10 informal small businesses have borrowed from one.

Small print (12 pt):
- "Rosa is an example, not a real interview."
- $5.7 trillion: IFC and SME Finance Forum, "MSME Finance Gap", Mar 2025 (2019 data). Facts entry 22.
- $2 billion: Conamype estimate, via Diario El Salvador, 27 Feb 2026. Shop count: Distribución Dinámica, via Diario El Mundo, 1 Mar 2026. Entries 1 and 3.
- $35 per $100: CIOPS (UTEC) survey of 1,285 merchants, 2019, via Revista E&N. 6 in 10: FUSAI and ASOMI, via El Diario de Hoy, Jul 2026. Entries 9 and 10.
- Cash: El Salvador, Guatemala, Honduras and Mexico, 2022 survey, via Diario El Mundo, 10 Apr 2025. Entry 11.

Source check, Nov 14: the crews line ("Delivery crews in El Salvador have been robbed and extorted", entry 40 in `docs/facts.md`) is **cut from the board** because entry 40 is still marked pending ("a teammate must open the link and confirm the quote") and rests on one reported accusation. To put it back, a teammate opens entry 40's two links and signs the entry, then the sentence and the source line `Crews: robbed, El Diario de Hoy, 23 Jul 2024; extorted, Brown et al., Review of Economic Studies. Entry 40.` go back in `trifold.html` and this file. Source check, Nov 12 (before the cut): the crew line is entry 40 (cash is entry 11). One robbery case (2023, reported 2024) and extortion data from 2012 to 2019 are all we have, so the line says "have been", not "are", as entry 40's safe wording does. We cut "nobody can easily see which driver collected what cash": it was our assumption, not a sourced fact. If we keep the idea, say it as our view ("we think...").

### Middle panel: how it works

> **How it works**
> Pay now: digital dollars
> Pay in [N] days: full price, no interest
> Cash: driver and shop confirm with two taps
> Scan to try it
> relay-sv.vercel.app
> Live on Stellar testnet with test dollars. Cash-in is simulated.

- **Three phone screenshots, left to right:** the shop's "Pagar ahora / Pagar en 7 días / Pagué en efectivo" screen; the shop's "Debe … vence …" screen after a credit payment; the driver's "Recibí efectivo" screen. The app is in Spanish, so the captions above are in English.
- **QR:** `public/qr-demo.png` from #55 (on `main` since PR #70 merged; regenerated for relay-sv.vercel.app in PR #102, Nov 12). The address is printed under "Scan to try it" so someone whose phone can't scan can type it.
- **Diagram:** `docs/img/architecture.png` (#62), titled "How it works on Stellar". It says "Amounts are public. Names are not."
- Leave the contract ID off the board. It changed at the Thursday redeploy (#52, #90) and may change again; `config/testnet.json` (`contracts.routeLedger`) and the README carry the current one. No contract ID appears in this file or in `docs/pitch/trifold/`.

### Right panel: the business

> **The business**
> **One $100 delivery, paid in [N] days**
> The lender pool pays the distributor now: **[payout]**
> The shop repays in [N] days: **$100**, no interest
> The fee, up to [X]%: [buffer] buffer, [lenders] lenders, [our cut] us
> Every shop starts at a [$ limit] credit limit
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

There is no "what we heard" panel (cut Nov 14: 0 conversations, see open item 4).

"Our plan" is a plan, not a deal: no bank, cash-in company or lender has agreed to anything yet. Do not word it as if one had.

## 2. Pitch script v1 (3:00, one speaker, the 1-minute video included)

The draft has 259 words by a plain word count. At 140 words a minute, the full one-minute video and two seconds on each side for playback put the pitch at about 2:55. That count treats "$5.7", "50,000", "$98.50" and "1.5%" as one word each; said aloud they are about 18 more words, which puts the run at about 3:03 (see "Said aloud" under the table). Count the final wording after filling the placeholders and time it aloud in the first run-through (#39).

### 0:00 to 0:25

> Around the world, small businesses in developing countries can't get about $5.7 trillion in credit they need. In El Salvador, more than 50,000 neighbourhood shops buy about $2 billion a year from distributors, says Conamype. Picture Rosa, short when the truck arrives. A loan shark lends today: about $35 per $100 (2019 survey).

### 0:25 to 0:55

> So we built Relay. A shop pays in digital dollars, pays cash that driver and shop confirm with two taps, or pays in seven days at full price, no interest. The rules and fees sit in a public Stellar contract, and Stellar says payments are final in about five seconds. The US dollar has been El Salvador's legal tender since 2001. Watch.

### 0:55 to 1:55: the video (#35)

Play the full 60-second working-prototype video from 0:00. Keep the MP4 on the laptop and let the video play without live narration. Use the same file for rehearsals and the showcase. [Velocity's Devpost requirements](https://blockchain-stellar-ic.devpost.com/#requirements)

### 1:55 to 2:30

> Who pays? The distributor, never the shop. On a $100 sale paid in seven days, a lender pool pays the distributor $98.50 now. That 1.5% fee is 75 cents to a default buffer, 50 to lenders, 25 to us. The shop repays $100 and builds a record it never had. We start with one distributor's routes, a bank or cash-in partner, and a licensed lender. Then Ecuador and Panama, which also use the US dollar.

### 2:30 to 2:50

> Our biggest risk: turning a shop's cash into digital dollars isn't solved, and our demo simulates it. Our plan: shops repay weekly like a bill, and a licensed partner converts in bulk and does KYC and KYB. We've asked [7] grocers and distributors to talk; zero conversations yet.

Written to match the research log as of Nov 13 (PR #152, still open): 7 interview requests sent, 0 conversations. Fill `[7]` from `docs/research.md` before each run. If a real conversation is logged by then, use the old line instead: "We spoke to [N] people; they made us change [one thing]." Never say "we spoke to" for a request that got no answer.

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

**Said aloud (checked Nov 13).** The table counts "$98.50" as one word. Spoken, the numbers add words: "$5.7 trillion", "50,000", "$2 billion", "$35 per $100" and "2019" add 9 in the 0:00 segment, "2001" adds 2 in the 0:25 segment, and "$100 sale", "$98.50", "1.5%" and "$100" add 7 in the 1:55 segment. That is about 18 more, so about 277 spoken words. At 140 words a minute the run is about 3:03 (over), at 145 about 2:59, at 150 about 2:55. Plan on cut 1 from the first run (about 2:57 at 140) and add cut 2 if it still runs long (about 2:49). The first timed run decides.

**Delivery notes**
- "Rosa" is made up. Say "picture", so nobody takes her for a real interview, and drop her if #30 gives us a real story we may tell.
- Keep "in a 2019 survey" and "says Conamype". The fact sheet's "say this, not that" table requires the year and the attribution.
- To answer "how do you make money" in 30 seconds, add: "And 10 cents per $100 on invoices paid now or in cash." That is the 0.1% usage fee (`USAGE_FEE_BPS = 10`). It is not in the script because it does not fit the 35 seconds.

## 3. Checked against the repo

| What the pitch or trifold says | Checked against | Result |
|---|---|---|
| The distributor gets $98.50 per $100 paid in 7 days | `lib.rs:17-19` ("$98.50 for every $100"), `:24` (`CREDIT_FEE_BPS` = 150), `:616-618` (payout = amount minus the rate from `credit_fee_bps`, `:837`); `lib/labels.ts` | Matches for a fully credited invoice (facts entry 29). Since #139 the fee slides down to 1.00% when the shop pays part up front, so $98.50 is the lowest payout. Issue #37 and PR #74 say $98.40, which is out of date. |
| At the full 1.5%: $0.75 buffer, $0.50 lenders, $0.25 us | `lib.rs:21-30` and `fee_split` (`:852`): the lenders always get 0.50%, the rest splits 3:1 buffer to us. The compile-time check of the three constants is gone | Matches at 1.5%. At 1.00% it is 0.38 / 0.50 / 0.12. "Up to 75 cents" for the buffer and "at most 25 cents" for us are the safe words. |
| The shop pays no fee and no interest | `lib.rs:420-423` (the usage fee comes out of the distributor's side, so the shop pays the invoice amount); `:608` and `:649` (the shop owes only the unpaid `amount`) | Matches |
| 0.1% on invoices paid now or in cash | `USAGE_FEE_BPS = 10` (`lib.rs:20`); context §5 | Matches. Credit sales pay no usage fee. |
| Repaying on time builds a record | The limit grows by $25 up to $500 (`LIMIT_STEP`, `LIMIT_CAP`, `lib.rs:33-35`, `:718-732`), only after a $40+ cycle (or $10 with half of every credited invoice paid up front, `MIN_BORROW_WITH_HALF`, `:42`) and once per credit period (context §16, Nov 10; #139) | Matches. The script says "builds a record" and no more. |
| A shop that pays late loses limit (answer 4) | Up to 1 day late (`GRACE_DAYS`, `:49`) counts as on time; 2 to 7 days late drops the limit $25; 8 or more days drops $50 and blocks raises for 4 credit periods (`:51-55`, `:733-745`). No new credit while overdue (`:604-606`) | Matches (#139, #137). The answer says "paying late cuts the limit" and no more. |
| If a shop never pays, the buffer repays the lenders first (answer 4) | `cover_default` (`:758`): only the admin can call it, only 4 credit periods (`DEFAULT_AFTER_PERIODS`, `:59`) after the due date; the buffer pays `owed.min(buffer)` (`:772`) and the shop's limit goes to $0 | Matches. It is not automatic, so the answer says "we write it off". Losses past the buffer fall on the lenders (`docs/product/security.md` limit 11). |
| Live on Stellar testnet with test dollars, cash-in simulated | Context §6; the diagram says "Stellar testnet" and "Test USDC" | Matches |
| Names stay off the public ledger | Context §8.4; the diagram | Matches. Amounts are public. |
| "Public contract", not "open source" | #48 removed the MIT licence; the code is all rights reserved | The repo is public and the contract is checkable on Stellar. Do not say "open source". |
| Ecuador and Panama use the US dollar | Context §7.6 (order); `docs/facts.md` entries 25 (IMF: "an officially dollarized economy since January 2000") and 26 (Cato Journal: "In 1904, the U. S. dollar became legal tender in Panama.") | Matches. The entries are on `main` since #73. |
| "The US dollar has been El Salvador's legal tender since 2001" (0:25 segment) | `docs/facts.md` entry 39: IMF Country Report 25/58, PDF p. 88, "As the U.S. dollar is the official legal tender since January 1st, 2001" (BCR as backup) | Sourced. Entry 39 says "Use in: deck / Q&A", so saying it in the 3-minute pitch is our choice (it is cut 1). It says nothing about digital dollars: never say or imply they are legal tender or widely held. |
| "Stellar says payments are final in about five seconds" (0:25 segment); "fees under a cent" (answer 6) | `docs/facts.md` entries 36 (developers.stellar.org: "Ledgers close in ~5 seconds, and their transactions are final when they do.") and 37 (stellar.org/solutions/cross-border-payments: "network fees under a cent") | Matches. Both are Stellar describing itself, and a teammate still has to open the links (entries 36 and 37 say so). Stellar's own pages give conflicting USD fee figures, so the script gives no dollar fee and attributes the claim. |
| 8 in 10 small businesses in four countries pay suppliers mainly in cash (left panel) | Entry 11. The crews sentence that shared this line (entry 40, pending) was cut from the board on Nov 14. | Matches entry 11 (regional, four countries). |
| MoneyGram lists cash-out in El Salvador, we found no cash-in (answer 3) | Entry 38: moneygram.com/stellar, "Cash-out is available in 170+ countries and territories and cash-in in 25+ countries"; its coverage data lists El Salvador as cash-out only | Matches entry 38's safe wording ("as far as we found"). "Cash-out only" is false in general. No person has looked at the map yet (entry 38). |
| The product is called Relay, tagline "Del efectivo al crédito" (script, board title) | `lib/brand.ts` on `main`: `APP_NAME = "Relay"`, `TAGLINE = "Del efectivo al crédito"`; PR #100 | Matches |
| The app is at relay-sv.vercel.app (board, under the QR) | `curl -sI https://relay-sv.vercel.app` answers 200 (Nov 12 night); the old tiendas-stellar address answers 307 to it. `public/qr-demo.png` decodes (macOS CoreImage) to `https://relay-sv.vercel.app/demo` | Matches |
| Fee sponsorship (the diagram says "Pays the network fees (fee sponsorship)") | Built in #113 (merged Nov 13): when the sponsor key is set, every app transaction goes out inside a fee bump that the sponsor pays. #113 says the key is set in Vercel; we did not look at Vercel's settings. Checked Nov 13 on Horizon testnet (public): the test transaction in #113, `1491673f…`, has `fee_account` `GA4Q52…` (the sponsor) and source Tienda Rosa `GD2HWN…`; the sponsor's 8 most recent transactions (19:41 to 19:51 UTC) came from 6 different accounts, all successful. | **Claimable**, worded: "our sponsor account pays the network fees". Not "gasless" and not "users never need XLM": the demo accounts hold test XLM. |
| Passkeys | Not on `main`. | **Not claimed** in either text. |

## 4. Never say

- $7 billion, "about 70,000 shops", $5 billion as our market, MoneyGram's 5%, the Chivo $30 bonus or fuel discounts.
- "$5.7 trillion" as our market or what we can earn. It is a finance gap.
- "85,265 neighbourhood shops" on its own (it counts eateries and street vendors), "85% owned by women" (say "most"), "62% of small businesses" (it is informal ones), "$35 per $100" without the year.
- "8 in 10 pay suppliers in cash" or "mostly in cash" for El Salvador alone. The 80% covers four countries.
- "Open source", "audited" (we did a contract safety review with tests, `docs/product/security.md`, not an outside audit) or "passkeys" as built. Fee sponsorship is built (#113, section 3): say "our sponsor account pays the network fees", not "gasless" or "users never need XLM".
- That any bank, cash-in company or lender has agreed to anything.
- To shop owners: "blockchain", "wallet", "crypto". Say "dólares digitales". To judges, say Stellar.

## 5. Answer bank for the judge questions (#39)

The eight questions from #39, each with an answer that fits **20 seconds (46 words at 140 words a minute)**; the money answer gets 30 seconds (70 words). Written Nov 11, using only facts from `docs/facts.md`, the contract, `docs/product/credit-model.md` and `docs/context.md`. **Audited Nov 12 evening against #39:** all eight answers fit (35 to 46 words, 15.0 to 19.7 s; the money answer is 59 words, 25.3 s, inside its 30 s), and every follow-up is 41 words or fewer, so none was shortened. **Re-audited Nov 13 night, after #139 (sliding fee, graded lateness) and the outreach logs:** all eight still fit (31 to 46 words, 13.3 to 19.7 s) and every follow-up is 45 words or fewer. Changed: answer 2 (the email count is now filled in, and the distributor-first line is shorter), answer 4 (late payment cuts the limit; the buffer is "up to" 75 cents; "we write it off", because the admin does it by hand) and its follow-up, answer 5 ("Our plan:" before the licensed partner, which does not exist yet), answer 8 (zero conversations, said plainly) and the money follow-up (our share is "at most" 0.25%). Answer 1's own wording is PR #163's job; with it the money answer is 65 words, about 28 s at 140 a minute, still inside 30. Where something is our own reasoning or a guess, the answer says so. A `[bracket]` is filled from `docs/research.md` (#7, #30); if a count is zero, say zero.

**How to grade a run-through answer** (for the asker, #39): 1) *Accurate:* every number matches its "Facts" line. 2) *Clear:* someone who has never heard of a tienda follows it. 3) *On time:* 20 seconds or less. 4) *Honest:* it says "plan" where nothing is signed, and "our guess" where it is one. Write what was weak under "Sunday fixes" at the end of this section, and rewrite the answer here.

### 1. How do you make money? (30 seconds)

> Distributors pay us; shops never do. On a pay-in-seven-days sale the distributor pays up to 1.5% to be paid at the door, less when the shop pays part up front. At most 25 cents of each $100 is ours; the rest goes to lenders and a loss buffer. Invoices paid now or in cash: 0.1%. Both fees are in a public contract anyone can check.

65 words, 27.9 s (at the old answer's pace).
- **Facts:** `docs/facts.md` entries 29 and 30, and the contract: `CREDIT_FEE_BPS` 150 (top) and `MIN_CREDIT_FEE_BPS` 100, split by `fee_split`: `LENDER_BPS` 50, the rest 3:1 buffer : us (75 / 25 at 150); `USAGE_FEE_BPS` 10. Credit sales pay no usage fee (context §16, Nov 10). For cash the 0.1% is recorded and billed later, not collected yet (`docs/product/security.md` limit 6).
- **Must include:** the distributor pays, the shop never does; both fee rates; the contract is public.
- **Never:** MoneyGram's 5%, or "we charge shops".
- **If they push, "how big could it get?" (20 s):** > A scenario, not a forecast: if 10% of the $2 billion used pay in 7 days, our share (at most 0.25%) is up to $500,000 a year, plus 0.1% on the rest, about $1.8 million. It's our guess; the maths is in our assumptions doc. (45 words; facts entry 30, context §5, `docs/product/assumptions.md` (merged, #144). "At most" and "up to" because the credit fee slides below 1.5% when a shop pays part up front, #139.)

### 2. How do you get into El Salvador?

> We start with one distributor's routes: the driver's QR opens the app, nothing to install. For cash, a bank or cash-in partner. A licensed lender funds the pool. None of it is agreed. We've emailed four banks and a supermarket chain; one auto-reply so far.

45 words, 19.3 s.
- **Facts:** context §14; our startup advisor (§14, `docs/research.md` "Advisor 1"): partner with banks and cash-in companies that already have a reputation in El Salvador. The email count is the `docs/research.md` "Pitch line (so far)": 5 organisations emailed on Nov 10 (Promerica, Abank, Integral, Davivienda, Súper Selectos), no replies beyond Davivienda's out-of-office auto-reply. The Nov 12 round of 16 is not counted until each email is confirmed sent. If the log shows more confirmed sends by the run, change the count; never say "talked to" for an email.
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

> Limits start small, capped at $500. Paying late cuts the limit; nothing new is lent while anything is overdue. A buffer, up to 75 cents per $100 lent, absorbs losses first. Four periods late, we write it off and the buffer repays lenders what it can.

46 words, 19.7 s.
- **Facts:** `docs/facts.md` entries 31 and 32, and the contract: `LIMIT_CAP` $500; the `Overdue` check in `pay_with_credit`; the buffer share from `fee_split` (0.75% of a credit sale at the full 1.5% fee, 0.38% at the lowest 1.00%, #139); late repayment cuts the limit $25 (2 to 7 days late) or $50 and blocks raises for 4 periods (8 or more days; #137, `docs/product/credit-model.md`); `cover_default` after `DEFAULT_AFTER_PERIODS` = 4 credit periods. **`cover_default` is called by the admin; it does not run by itself.** Every shop starts at $200 (#134); matching it to one average delivery is a later step (`docs/product/credit-model.md`). `docs/product/security.md` limit 11: credit risk is real.
- **Must include:** small limits, late payment cuts the limit, nothing new while overdue, the buffer, the four-period rule.
- **Never:** "no risk", or that the contract writes off a debt automatically.
- **If they push, "what if losses beat the buffer?":** > The buffer fills with up to 0.75% of each credit sale: less when shops pay part up front. Losses beyond it fall on the lenders. That's why limits start small and a licensed lender, not us, funds the pool. (39 words; context §5, "what could break it"; fee split #139.)

### 5. Is it legal? (interest-rate cap, KYC/KYB)

> Shops pay no interest; distributors pay a fee to be paid early. Interest is capped by law, so a lawyer should confirm that fee isn't interest. Our plan: a licensed partner lends and does KYC on shop owners and KYB on distributors. We aren't the lender.

46 words, 19.7 s.
- **Facts:** `docs/facts.md` entry 18 (Ley Contra la Usura; its caveat: "a lawyer should confirm that fee isn't treated as interest"); context §11 and §14 (a licensed lender; KYC and KYB done by the licensed partner; we are not the lender).
- **Must include:** no interest for shops; the lawyer check; KYC and KYB; "not the lender".
- **Never:** "it is legal" or "it is approved", or that we hold a licence. We have none.
- **If they push, "what is the cap?":** > The cap is 1.6 times the average rate for each type of loan, published by the central bank twice a year. We haven't found the exact microcredit cap, so we'd ask a lawyer. (33 words; entry 18, whose 1.6x and January and July details come from secondary sources: check Arts. 5 to 8 of the law before saying the article number.)

### 6. Why Stellar, and not Transfer365 plus a database?

> Transfer365 only moves money between bank accounts; fewer than half of adults have one. No credit, no invoice matching. A distributor's database isn't a record lenders trust. Our public contract enforces the rules. Stellar says payments are final in about five seconds, fees under a cent.

46 words, 19.7 s.
- **Facts:** entry 14 (Transfer365: free, between bank accounts, more than $4 billion a month; say "more than 9 in 10", not 93% or 95.3%); entries 12 and 13 ("fewer than half of adults"); context §14 for the reasoning.
- **Must include:** Transfer365 is free and good but needs an account; no credit or invoice records; a shared, checkable record; Stellar's own figures: final in about five seconds, fees "under a cent" (developers.stellar.org; stellar.org/solutions/cross-border-payments).
- **Never:** that cheaper transfers are our pitch, "open source" (say "public contract"), passkeys as built, "gasless" or "users never need XLM" (say "our sponsor account pays the network fees"), or a dollar fee for Stellar (its own pages give conflicting USD figures; attribute it: "Stellar says ... fees under a cent").

### 7. What do El Salvador's credit bureaus already cover? Do tiendas have DUNS numbers?

> Three private bureaus: Equifax, TransUnion and INFORED. They see only formal credit, so a shop's supplier credit and loan-shark debt never show up; our payment record fills that gap. A DUNS number is a nine-digit business ID; I'd expect most tiendas don't have one.

44 words, 18.9 s.
- **Facts:** entry 15 (the three bureaus, licensed and supervised by the SSF; they only see formal credit), entry 16 (the SSF's public credit registry, also only supervised lenders), entry 17 (a DUNS number: nine digits, free to request, not required to operate).
- **Must include:** the three names; formal credit only; what a DUNS number is.
- **Never:** state "tiendas have no DUNS number" as a fact. It is our expectation (entry 17 labels it our reasoning), because Conamype says the state bank's tienda loans are open even to informal shops.

### 8. Have real users tried it?

> Not yet. We've sent [7] interview requests to grocers and distributors and have had zero conversations. Two advisors reviewed the idea, but they aren't users. Next: walkthroughs with real shop owners.

31 words, 13.3 s. Written Nov 13 to match the log, which says zero. If real conversations are logged by the run, use the older wording, which still fits: "We spoke to [N] people and [N] tried the prototype. Walkthroughs with non-Salvadoran shop owners only show whether it's easy to use, not that the problem is real. Because of them we changed [one thing]." (35 words, 15.0 s.)
- **Facts:** `docs/research.md` (#7, #30). On `main` it logs only the two advisor calls and the partner emails: no interviews or walkthroughs. PR #152 (open; its Nov 13 review checked the arithmetic) adds the shop and distributor outreach: 7 interview requests by WhatsApp (4 to grocery retailers, 3 to distributors; as of Nov 13, 2 acknowledgments, 4 automated replies, 1 awaiting, none answering the interview questions) and 5 emails to nonprofits asking for advice, 0 conversations. "12 messages sent" is true; "12 interviews" and "we spoke to 12" are not. The team's own test session (`docs/testing/test-session.md`) tested usability, not users: context §13 says only real shop owners and distributors count for #30.
- **Must include:** "not yet", the real count (zero), that advisors are not users.
- **Never:** round up, count an advisor, a request or a nonprofit email as an interview, count a walkthrough as an interview, or call the Rosa story a real interview.

### Extra: "Why not BFA?" (flagged on #8: judges may ask it)

> BFA, the state bank, lends tiendas up to $10,000, approved in 72 hours: a loan you apply for. Ours is seven-day stock credit at the truck, tied to each delivery, no interest, and it builds a payment record.

38 words, 16.3 s. **Facts:** entry 20 (BFA, backed by Conamype's guarantees; more than $1.4 million in 440 loans, so about $3,200 each by our maths).

### Sunday fixes (fill in during the run-throughs, #39)

`docs/testing/run-throughs/` (PR #85) holds the timings and the full Q&A log. This table records only what was changed in this file.

| Run | Question | What was weak | The fix (new wording is above) |
|---|---|---|---|
| | | | |
