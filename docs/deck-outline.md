# Finals deck outline (#41)

Scaffold written Wed Nov 11; the slide text was added the same day. Refreshed Thu Nov 12 late evening against `main` at 9c1b0fe (#72, #73, #83, #84, #85, #86, #90, #100 and #102 are merged; #81 and #82 are still open). **The text to paste into the template is in `docs/deck-slides.md`.** This file keeps the plan: the time budget, the source and visual for each slide, what each still needs, the screenshot steps and the open questions. Every `[bracket]` is something we don't have yet.

## Rules

- Build it in Velocity's [template](https://docs.google.com/presentation/d/1RNYL7G9wOFROUY2XUyO6k37RBQuCF9kf/edit). PowerPoint, no animations. What the template contains is in "The organisers' template" below.
- Draft due **Sun Nov 15, 11:59 PM ET** (#41). Finalist prep is Tue Nov 17, 11 AM to 1 PM: bring the deck and a note-taker (#44). **Final upload Wed Nov 18, 10:00 AM** through the [upload form](https://airtable.com/apprwC5wqwb4We3jo/paghYqabHAh8pDtac/form) (#45, Jack). No changes after upload.
- Finals are Wed Nov 18, 5 to 7:30 PM: a 3-minute pitch plus 3 minutes of Q&A.
- Every number comes from `docs/facts.md`, in its "Say this, not that" wording. The speaker script lives in `docs/pitch.md` (#37), not here.
- Product slides say "digital dollars". The Stellar detail goes on slides 4 and 5.
- Each slide: a headline of 8 words or fewer and at most 3 lines of about 10 words, readable in 5 seconds.

## Time budget (a proposal, 3:00 in all)

| Slide | Seconds | Running total |
|---|---|---|
| 1. Name and pitch | 10 | 0:10 |
| 2. The problem | 30 | 0:40 |
| 3. The product | 25 | 1:05 |
| 4. How it works on Stellar | 20 | 1:25 |
| 5. The code | 15 | 1:40 |
| 6. Money and go-to-market | 30 | 2:10 |
| 7. Risk #1, our plan, what users told us | 30 | 2:40 |
| 8. Team and our ask | 20 | 3:00 |

If the 1-minute video plays at the finals, slide 3 stands in for it and this budget changes. Whether it plays is not stated anywhere in our notes (see "Open questions").

## The slides

The words for each slide are in `docs/deck-slides.md`, under the same number.

### 1. Name and one-line pitch
- **Message:** one idea the room can repeat.
- **Source:** the name is **Relay** with the tagline *Paga tu ruta* under it (PR #100, merged Nov 12; `lib/brand.ts`, `docs/context.md` §1). The repo doesn't record who pitches.
- **Visual:** "Relay" large with "Paga tu ruta" under it, no logo yet.
- **Needs:** nothing for the slide. The pitcher is still to be named (see "Before we can build it").

### 2. The problem
- **Message:** small shops can't get stock on credit, so they borrow from loan sharks.
- **Source:** facts entries 22, 1, 3 and 10, all on `main` (entry 22 merged in #73).
- **Wording rule:** say "85,265 shops and small retailers" or "more than 50,000 neighbourhood shops", never "85,265 neighbourhood shops" (facts, "Say this, not that"). Issue #41 says "85,265 tiendas"; use the safe wording instead.
- **Visual:** three big numbers, no chart.

### 3. The product
- **Message:** one shop screen, three ways to pay.
- **Visual:** 3 phone screenshots of the live app, captured at 360 px wide with the testnet banner in frame: the shop's pay screen, the shop's "Debe ... vence ..." screen after a credit payment, the driver's "Recibí efectivo" screen. Steps are in "Capturing the three phone screenshots" below. `docs/screenshots/mock-screens-nov10.png` is a mock, so don't use it.
- **Needs:** a check, and probably a recapture. PR #119 (Fri Nov 13) put the three captures in `docs/trifold/img/` (`shop-pay.png`, `shop-credit.png`, `driver-cash.png`), taken from https://relay-sv.vercel.app (the old tiendas-stellar.vercel.app answers 307 and redirects there, so the deck shows the new one). #126 and #125 merged after that (7:26 and 7:27 PM ET) and changed the shop's pay screen (#125 also the driver's route screen). Compare the three images with the live app; if they differ, recapture with the steps below and check the page header reads "Relay" with "Paga tu ruta" under it. We have not compared them. The URL goes in the slide's small print.

### 4. How it works on Stellar
- **Message:** the rules live in a public contract, and names stay off it.
- **Visual:** `docs/img/architecture.png` (from #56, re-rendered in #119). Its server box says "Pays the network fees (fee sponsorship)", which has been true since #113 (evidence: `docs/pitch.md` section 3), so no change is needed. If you edit that line, re-render with `node docs/slides/render.mjs`.

### 5. The code
- **Message:** the credit rules are real contract code, not a mock-up.
- **Visual:** `docs/img/code-slide.png` (from #56). **Not ready on `main` until PR #163 merges.** PR #82 gave it the ID from the #90 redeploy (`CDHDZX7V...`), but #139 (merged Fri Nov 13, 7:36 PM ET) redeployed again: `contracts.routeLedger` in `config/testnet.json` is now `CAGCZ3I7...`, and the image on `main` still shows the old one. PR #163 re-renders it with `CAGCZ3I7...` (read by eye). The three code blocks on it are still in `lib.rs`. `SCALE=3 node docs/slides/render.mjs` makes print-size images.
- **Needs:** PR #163 merged, then a character-by-character check of the ID on the image against `config/testnet.json`, then Yahya's confirmation that the code on the slide is what's deployed. `git log` shows #139 as the last change under `contracts/`; its PR says Yahya redeployed from it, and that ID is the one in `config/testnet.json`.

### 6. Money in 30 seconds, and go-to-market
- **Message:** distributors pay, shops never do.
- **Source:** facts entry 29 (#84) for the fees; entries 25 and 26 (#73) for Ecuador and Panama; context §14 for "one distributor first". All on `main`.
- **Never say:** "$98.40", "$0.35 per credit sale", or a "$2.5 million" revenue figure (facts, "Never use"). Fee wording: "$98.50 per $100", with the 1.5% paid by the distributor.
- **Visual:** the $100 example as 3 rows.

### 7. Risk #1, our plan, what users told us
- **Message:** we name the hard part before a judge does.
- **Source:** context §6 and §13; `docs/security.md` section 3 (demo versus real).
- **Rule:** our plan is a plan, not a deal. No bank, cash-in company or lender has agreed to anything, so don't word it as if one had.
- **Needs:** the real count and the one change, from #30 (still open). `docs/research.md` is on `main` (#72) but logs only the two advisor calls; advisors aren't users, so they don't count toward "[N] people".
- **MoneyGram:** say "as far as we found". Entry 38 (pending a person's check) says MoneyGram Ramps offers cash-out in 170+ countries and cash-in in about 25, and its coverage data lists El Salvador as cash-out only. Look at the coverage map by eye before the line goes on a slide.

### 8. Team and our ask
- **Message:** who we are and what we want next.
- **Source:** the roles are in context §3.1.
- **Open decision:** our notes never say what we ask for. Candidates to choose from: introductions to a distributor, a cash-in partner and a licensed lender (the advisors' advice was to partner with banks and cash-in companies, context §14). The team picks one line.

## Capturing the three phone screenshots

For slide 3 and the trifold's middle panel. They have to come from the live app at 360 px wide, with the banner "Demo en testnet · dinero de prueba · cash-in simulado" at the top of each. (It is the first line of every page, not a sticky bar, so capture with the page scrolled to the top.) They are taken by hand: it needs clicks, and shot 2 changes the shared demo.

**When:** now that the redeploy has landed (#90, Thu Nov 12; #52 is closed), because the redeploy gave a new contract and new demo invoices. Best in the same sitting as Yahya's video (#35), so the demo is only changed once, and with the header reading "Relay" and "Paga tu ruta" (the name is set, #100). Shot 2 makes a real testnet payment with test dollars and changes what the video shows (see "Side effects").

**Setup (Chrome on a Mac)**
1. Open https://relay-sv.vercel.app. Check the testnet banner is at the top and the page isn't an old preview.
2. Open Chrome DevTools (Cmd+Opt+I), then the device toolbar (Cmd+Shift+M). In the toolbar choose "Responsive" and type width **360** and height **740**. Click the toolbar's three dots, choose "Add device pixel ratio", and set it to **3**.
3. To capture: three dots in the device toolbar, "Capture screenshot" (not "full size"). It saves only the 360 px phone view, without DevTools or the browser bar, as a PNG in Downloads about 1080 px wide.

**Shots**
1. **Shop pay screen.** Open the Tienda Rosa invoice: `/ruta/motorista-1`, tap Tienda Rosa's row, then open the link the QR points to (`/tienda/<invoice id>`), or go to it directly. Scroll to the top. You should see the invoice as a paper receipt with the amount, the list **Pagar en 7 días**, **Pagar otro monto**, **Pagué en efectivo**, and the **Pagar ahora** button at the bottom. Capture before tapping anything. Save as `live-1-pay.png`.
2. **Shop debt screen.** Open a different shop's unpaid invoice (Tienda Don Luis, `/ruta/motorista-1`). Tap **Pagar en 7 días**, then **Confirmo**, and wait for the green check ("Listo. Tiene hasta el ... para pagar ..."). Tap **Mi cuenta**. The page shows **Debe $...**, the due date and the limit. Capture it. Save as `live-2-debt.png`. Then tap **Pagar deuda** to clear it (see "Side effects").
3. **Driver cash screen.** Go to `/ruta/motorista-1`, tap a stop so its QR opens. The screen shows the QR and the **Recibí efectivo** button. Capture it **without tapping the button** (tapping starts a cash claim). Save as `live-3-cash.png`.

**Check each file before using it**
- The banner text is readable at the top.
- The layout is the 360 px phone layout (nothing cut off at the sides), with no browser bar or DevTools in the frame.
- Nothing secret on screen: no key (starts with S), no `.env` text, no personal phone number.
- Save the three files in `docs/screenshots/` and commit them in a small PR.

**Side effects.** Shot 2 moves test dollars and uses up an invoice. Repaying (**Pagar deuda**) clears the debt, but a repayment after a loan of $40 or more raises that shop's limit by $25, once per credit period, so that shop's limit is then $225, not $200. Tell Yahya which shop and invoice you used, before he records the video. The video's own script wants Tienda Don Luis at $0 owed (`docs/demo-video.md`, #77).

## Before we can build it (as of Thu Nov 12, evening)

| Input | Where it comes from | Status |
|---|---|---|
| Name and tagline | PR #100 | decided: Relay, tagline *Paga tu ruta* |
| Pitcher | the team | not recorded in the repo; ask the group chat |
| Pitch script v1 | #37, PR #83 | merged Nov 12 (`docs/pitch.md`; `[NAME]` became Relay in PR #107, the `[N]` placeholders are still open) |
| Worldwide number and expansion path | #51, #73 | merged (entries 22 to 28 on `main`) |
| Our fees, limits, safety numbers | facts entries 29 to 35, #84 | merged |
| "What we heard from N people" | #30; `docs/research.md` (#72) | open; no shop-owner or distributor conversation is logged (outreach only: #89 merged, #152 open) |
| Slide text for the 8 slides | `docs/deck-slides.md` | refreshed Nov 12 (brackets still open) |
| Real phone screenshots | live app; steps above | captured in PR #119 (`docs/trifold/img/`); #125 and #126 merged after, so compare with the live app and recapture if they differ |
| Code slide with the real contract ID | #56 follow-up, PR #82, PR #163 | PR #82 merged, but #139 changed the ID again (`CAGCZ3I7...`); the image on `main` shows the previous one until #163 (re-render) merges |
| Print-size slide images | `SCALE=3 node docs/slides/render.mjs` (PR #82) | merged; the option is in `docs/slides/render.mjs` |
| Architecture picture with the fee-sponsorship line | #119 put it back after #113 turned sponsorship on | done, on `main` |
| Our ask | team decision | open |

## The organisers' template (opened Nov 12)

The public export of the template downloads without a login. It is 20 x 11.25 in (16:9), a plain white deck with the Office theme (Calibri) and Canva fonts embedded, and no animations or transitions. It has 9 prompt slides, each a bold black title on a blank layout:

| Template slide | Our slide |
|---|---|
| Team Name/Logo/Tagline | 1. Name and one-line pitch |
| (Specific) Problem | 2. The problem |
| Your Solution | 3. The product |
| How it's used/integrated with existing systems | 4. How it works on Stellar |
| Your Evidence (who you talked to, what you read) | 7. Risk #1, our plan, what users told us (partly) |
| Your Impact (how many people you are helping x how much you are helping them) | none |
| Your team (who you are and why you are the right people to do this) | 8. Team and our ask |
| Optional: how you would use the prize money to actually get this started | none (it could be our ask) |
| Summary (your team name, tagline and top points) | none |

Our slides 5 (the code) and 6 (money and go-to-market) have no template slot, and the template asks for Impact, prize money and a Summary that we don't have. Slide 4 in the template is about fitting into existing systems (banks, cash-in companies, distributors' ordering systems; context §1), which our Stellar diagram only partly answers. Nothing here changes the 8 slides; it is for the team to decide (open question 5).

## Backup lines for Q&A (not on a slide)

- **Why Stellar:** "Stellar says payments finalize in about five seconds, and Stellar describes its fees as under a cent." Entries 36 and 37 are pending a teammate's check. Don't promise 5 seconds for our own screens, and don't state a dollar fee.
- **MoneyGram:** "MoneyGram Ramps offers cash-out in 170+ countries and cash-in in about 25. For El Salvador, its coverage data lists cash-out but, as far as we found, not cash-in." Entry 38.
- **Why not the state bank (BFA):** entry 20 has the answer. Not on a slide.
- **Delivery crews:** "have been robbed and extorted" (entry 40, one reported case plus a study of 2012 to 2019 data). Don't say "no record of who collected what" as a fact (it has no source).

## How to build it

1. Open the template and make a copy. Keep its layouts and fonts.
2. Paste the slide text from `docs/deck-slides.md`, replacing every `[bracket]`.
3. Insert the images and the three screenshots. Our PNGs are 1920 x 1080 and the template is 16:9, so they fit. Use `docs/img/architecture.png` as it is on `main` (its fee-sponsorship line has been true since #113), and `docs/img/code-slide.png` only after PR #82 is merged.
4. Check there are no animations or transitions on any slide.
5. Download as PowerPoint (.pptx) and open it in PowerPoint itself, not only in Google Slides, to check fonts and layout.
6. Save it where all four of us can open it, and post the link in the group chat.

## Open questions (ask Velocity, or decide as a team)

1. Does the 1-minute video play at the finals, or is it a showcase-only item?
2. ~~Is the template 16:9?~~ Answered Nov 12: yes, 20 x 11.25 in (see "The organisers' template" above).
3. May the uploaded deck include backup slides after slide 8 (for Q&A), or is it exactly the pitch?
4. What is our ask (slide 8)?
5. The template prompts 9 slides, and ours are 8 (see "The organisers' template" above). Do the finals judges expect the template's order and titles, or is it a starting point?

## Done means (from #41)

- [ ] Draft saved and shared in the group chat. Link: `[add the link here]`
