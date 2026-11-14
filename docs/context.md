# Team context: shop payments and credit in El Salvador

**Velocity x Stellar Blockchain Innovation Challenge** · Space 1 (savings, credit, inflation resilience)
Team: Yahya (Software Eng), Jack (Computer Eng), Ruhaan (Computer Eng), Rohan (FARM). UW first-years, new to finance and blockchain.
Last updated: Mon Nov 9, 2026, evening (re-planned after the advisor calls). All times are Eastern (ET).

**How to use this file**
- It's our one source of truth. Put it in the repo as `docs/context.md`.
- Start every Claude or ChatGPT chat by attaching it and saying which section you're working on.
- When something changes, edit this file in a pull request and add a line to the [Decisions log](#16-decisions-log). Don't start a new doc.
- Numbers marked **(guess)** are placeholders until interviews give us real ones.

## Index

**Primary**
- [1. The idea in one paragraph](#1-the-idea-in-one-paragraph)
- [2. Key dates](#2-key-dates)
- [3. Build plan](#3-build-plan)
  - [3.1 Hours we actually have](#31-hours-we-actually-have)
  - [3.2 Rules that stop zero days](#32-rules-that-stop-zero-days)
  - [3.3 What we're building: must, should, stretch](#33-what-were-building-must-should-stretch)
  - [3.4 Day by day](#34-day-by-day)
  - [3.5 Ruhaan's task cards](#35-ruhaans-task-cards)
  - [3.6 If we fall behind](#36-if-we-fall-behind)
  - [3.7 Demo video script](#37-demo-video-script)
  - [3.8 Showcase and pitch checklist](#38-showcase-and-pitch-checklist)
- [4. What to learn first](#4-what-to-learn-first)
- [5. How we make our cut](#5-how-we-make-our-cut)
- [6. Risk #1: cash to digital dollars](#6-risk-1-cash-to-digital-dollars)

**Reference**
- [7. How the product works](#7-how-the-product-works)
- [8. Tech design](#8-tech-design)
- [9. The problem and the evidence](#9-the-problem-and-the-evidence)
- [10. Competitors and precedents](#10-competitors-and-precedents)
- [11. Other risks](#11-other-risks)
- [12. How we're judged](#12-how-were-judged)
- [13. Outreach and interview kit](#13-outreach-and-interview-kit)
- [14. Advisor questions and judge questions](#14-advisor-questions-and-judge-questions)
- [15. How we work](#15-how-we-work)
- [16. Decisions log](#16-decisions-log)
- [17. Rejected ideas](#17-rejected-ideas)
- [18. Glossary](#18-glossary)
- [19. Sources](#19-sources)
- [20. Notes for Claude sessions](#20-notes-for-claude-sessions)

---

## 1. The idea in one paragraph

Neighbourhood shops (tiendas) in El Salvador pay the trucks that restock them in cash. When they're short, many borrow from loan sharks, often the same day, at around 1,869% a year. Distributors pay staff to collect, carry and count that cash, and the owner can't easily see which driver collected what. We give the shop, the driver and the distributor one payment record they all trust, built on Stellar. At each delivery the shop pays in digital dollars (USDC), or pays cash and both sides confirm it with two taps, or, once it has a good record, picks "pay in 7 days" at full price with no interest. A lender pool pays the distributor at delivery, and the distributor pays a small fee for being paid right away. Paying on time grows the shop's limit.

- **Space 1 fit:** fair, cheap credit for stock, and a payment record, for people whose only option today is a loan shark.
- **Not doing:** cross-border or diaspora money, Bitcoin, more than one country (others go on a "future" slide).
- **Form (decided Nov 9):** a mobile web app (a website that works like a phone app, opened from the driver's QR code or a WhatsApp link, nothing to install) on our own open Soroban contract. In the pitch, the contract is the engine that partners (banks, cash-in companies, distributors' ordering systems) plug into. Not a native app, and not a feature inside someone else's wallet.
- **Name: Relay**, with the tagline *Paga tu ruta* ("pay your route") shown under it (decided Nov 12). URLs, the repo (`yahyahashme/relay`) and code use "relay" only; the tagline never appears in a URL.

## 2. Key dates

| When (ET) | What | Who |
|---|---|---|
| Fri Nov 6, 12:00 PM | Devpost opens. Register, then write its submission deadline into this table. | Yahya |
| Mon Nov 9 | Advisor calls done: our startup advisor and our technical and finance advisor. What they said is in §14. | Yahya |
| Tue Nov 10, 5 to 6 PM | Technical Workshop (virtual). Bring a real bug. | Yahya, Jack |
| Wed Nov 11, 5 to 7 PM | Working Session #2, then the Pitch Prep Workshop. 1st floor IDEAs Clinic, PSE. | Everyone |
| **Fri Nov 13, 8:30 AM** | **One-page solution form. Decides the Top 16.** We submit Thu night. [Form](https://airtable.com/apprwC5wqwb4We3jo/pageD4iVuMUuoOvFs/form) | Jack |
| Devpost deadline: TBD | Repo link, live testnet link with contract IDs, 1-minute video. We aim for Sat Nov 14. | Yahya |
| **Mon Nov 16, 4:00 PM** | **Project Showcase.** Setup 4:00, judging 4:30 to 7:00. Innovation Arena, 280 Joseph St, Kitchener. Trifold plus a 3-minute pitch by one person that includes the 1-minute video. | All four (required) |
| Tue Nov 17, 11 AM to 1 PM | Finalist pitch prep, Top 8 only. Same place. Bring the PowerPoint deck and a note-taker. | All four (required) |
| **Wed Nov 18, 10:00 AM** | Final deck upload. [Template](https://docs.google.com/presentation/d/1RNYL7G9wOFROUY2XUyO6k37RBQuCF9kf/edit), PPT, no animations, no changes after. [Upload form](https://airtable.com/apprwC5wqwb4We3jo/paghYqabHAh8pDtac/form) | Jack |
| Wed Nov 18, 5 to 7:30 PM | Finals: 3-minute pitch plus 3 minutes of Q&A. $15K in prizes; three teams can win $5,000. | All four (required) |

- Check class conflicts for Nov 16 to 18 now. Every member must attend the showcase, the finalist prep and the finals if we advance.
- Help: [Stellar Dev Discord](https://discord.gg/stellardev) for tech. velocity.events@uwaterloo.ca for everything else (subject "Blockchain Innovation Challenge Powered by Stellar"), including a trifold board if we didn't get one at kickoff.

---

## 3. Build plan

> **Re-planned Mon Nov 9.** Nothing got built over the weekend, so the plan now lives in the GitHub issues: each one has an owner, a due time and a "Done means", written so an AI can follow it. §3.1 has the new roles. §3.4 and §3.5 below are the original Nov 6 plan, kept for reference; where they differ from the issues, the issues win.

Built for real weeks: classes, quizzes, the datathon, and days where nothing happens. The riskiest part (the contract) goes first. A rough payment works end to end by Tue Nov 10, and everything after that makes it better. The hours below are guesses; if yours are different, say so and we move cards, not deadlines.

### 3.1 Hours we actually have

| | Fri 6 | Sat 7 | Sun 8 | Mon 9 | Tue 10 | Wed 11 | Thu 12 | Fri 13 | Sat 14 | Sun 15 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Yahya | 3 | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 5 | 5 | 28 |
| Jack | 3 | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 26 |
| Rohan | 1.5 | 2 | 2 | 1 | 1 | 2 | 2 | 1 | 3 | 3 | 18.5 |
| Ruhaan | 1 | 2 | 2 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 8 |

- Yahya and Jack are at the Sheridan datathon on Sat Nov 7 and Sun Nov 8.
- About 80 hours in total **(guess)**. The plan fills about 70% of them on purpose, because first-time Rust and Stellar steps usually take two to three times longer than expected.
- **Roles (changed Nov 9)**
  - Yahya: all the code-heavy work and all UI/UX. The contract (`route_ledger`) and its deploy script, every screen, wiring the app to the contract, Vercel, the README, Devpost and the video.
  - Jack: important backend work that isn't heavy. The setup script, the contract safety review and failure tests, fee sponsorship. Also the one-pager, the code and architecture slides, the trifold and the finals deck.
  - Ruhaan: about 3 hours in total. Small, self-contained helper code that Codex can write (money and date helpers, the CSV parser, the WhatsApp link), with tests. No screens.
  - Rohan: outreach and facts. Emails to banks and cash-in companies, interviews, prototype walkthroughs, and every number we use, with its source in `docs/facts.md`.
  - If a card slips a day, Yahya (code) or Jack (scripts) takes it over.
  - The pitcher is picked by Wed Nov 11 and rehearses the most.

### 3.2 Rules that stop zero days

1. **Every task is a GitHub issue with one owner, a due day and a "Done means" line.** If you can't write the "Done means", the task is too big. Split it.
2. **45-minute minimum.** On any planned day, even a bad one, do one 45-minute block on your top issue and push something: a commit, a message sent, a paragraph.
3. **9 PM check-in** in the group chat, three lines: *Done / Next / Blocked.* A slow day is fine. Two missed check-ins in a row means the plan is wrong for that person, so we move their cards.
4. **No choosing.** Open the board and take the top card in your *This week* column.
5. **Stuck for 30 minutes?** Post the exact error in the group chat and give it to Claude. **Stuck for 2 hours?** Ask in the Stellar Dev Discord or bring it to the Tue Nov 10 workshop.
6. **Fixed pair time.** Yahya and Jack on a call Mon to Thu at the same time each night (8 to 10 PM, or whatever works). A fixed slot removes the "should I start?" decision.
7. **Main always works.** Small pull requests, merged daily. Vercel redeploys main, so there's always something to show.
8. **Checkpoints, not hope.** Tue Nov 10: first payment end to end. Wed Nov 11: all three ways to pay work. Fri Nov 13, 11:59 PM: feature freeze. Missing a checkpoint means using the cut list (§3.6) that same night.
9. **Lost a day? Don't double up tomorrow.** Drop the lowest card on the cut list instead.

### 3.3 What we're building: must, should, stretch

**Must** (the demo fails without these)
1. Invoices for one route loaded (CSV import or a seed script).
2. Pay now in test digital dollars, through our contract.
3. Cash at delivery, recorded when the driver and the shop both confirm.
4. Pay in 7 days: the lender pool pays the distributor at delivery (minus the fee), the shop repays, and its limit grows.
5. Distributor dashboard: paid, part-paid and due invoices; cash held by each driver; credit owed and overdue.
6. Live on testnet: a public app URL, and contract IDs in the README.
7. The 1-minute demo video.

**Should** (judges reward these; start only when every Must works)
- Fee sponsorship, so users never hold XLM (the server wraps each transaction in a fee-bump).
- The three risk options per shop (§5).
- Lower the amount at delivery when items are missing (part payment).
- The driver hands cash in at the warehouse, and the dashboard updates.
- A WhatsApp reminder button (a prefilled `wa.me` link, no API).

**Stretch** (only if every Should is done by Fri Nov 13)
- Auto-pay on the due date with a token allowance (SEP-41 `approve` and `transfer_from`).
- A shop "emergency jar" of savings in a stand-in bond token, and paying an invoice from it with a path payment.
- The pool's idle money in a stand-in Treasury token.

**Pitch only, not built:** real cash-in and cash-out, real KYC, real lenders, a basic-phone SMS flow, other countries.

### 3.4 Day by day

> Original Nov 6 plan, kept for reference. Since Nov 9 the GitHub issues are the plan.

**Tonight or Fri morning (20 min)**
- Yahya: create the public GitHub repo (a working name is fine; GitHub redirects after a rename). Add this file as `docs/context.md`, add `.env.local` to `.gitignore`, invite the team, post the link.

**Fri Nov 6: set up and learn**
- Everyone (1 h): the *Everyone* block in §4. Check your class conflicts for Nov 16 to 18.
- Yahya (2 h)
  - At 12:00 PM, register on Devpost and write its deadline into §2.
  - Find out if we booked a Nov 9 advisor slot. If not, email velocity.events@uwaterloo.ca for any open or cancelled slot (and ask for a trifold if we don't have one).
  - Set up the board, labels and issues from this plan.
  - Done means: Devpost done, issues exist through Wednesday, advisor status known.
- Jack (2 h): install Rust and the Stellar CLI, then build and deploy the hello-world contract to testnet. Done means: a testnet contract ID in the group chat that you've called from the CLI.
- Rohan (30 min): send the first 10 outreach messages (§13) and log them in `docs/research.md`. Open the one-page form and copy its questions into `docs/one-pager.md`.
- Ruhaan (1 h): start card R1.

**Sat Nov 7 and Sun Nov 8: Yahya and Jack at the datathon**
- Yahya, Jack: nothing planned. Optional 10 minutes at night to answer questions.
- Rohan (2 h a day)
  - 10 new messages a day in new places (§13). Follow up on Friday's. Book calls for Mon to Thu.
  - Read the Tienda Pago story and the FUSAI study (§4).
  - Write one-pager v0 in `docs/one-pager.md`: problem, who, what we're building, our cut, Risk #1.
  - Pressure-test §5. Would a distributor really pay $1.50 per $100? What would make them say no?
- Ruhaan: R1 pull request by Sunday night. Start R2 if there's time.
- Done means by Sun 9 PM: 25+ messages sent, 2+ calls booked, one-pager v0 in the repo, R1 PR open.

**Mon Nov 9: first contract (advisor day)**
- Advisor meeting, if booked: at least one person goes, with the §14 questions. Write the answers into §6 and §11.
- Jack (3 h): contract v1, the invoice part. `create_invoice`, `pay` (moves test dollars from shop to distributor), part-pay, block double payment, `get_invoice`, unit tests, deploy to testnet. Ask Claude for a first version from §8.2, then make sure you can explain each function. Done means: tests pass and a payment works from the CLI on testnet.
- Yahya (3 h): `scripts/setup`. Create and fund the demo accounts (distributor, 2 drivers, 3 shops, lender, us), issue the test dollar token, give everyone a balance, write public keys to `config/testnet.json` and secret keys only to `.env.local`. Review and merge R1. Done means: one command sets up a fresh demo and prints balances.
- Rohan (1 h): calls if booked; update `docs/research.md`.
- Ruhaan (1 h): R2.

**Tue Nov 10: first payment end to end (Technical Workshop 5 to 6 PM)**
- Jack (3 h): cash records (driver claims, shop confirms) and the pool's `deposit` and `pay_with_credit`. Tests. Deploy v2.
- Yahya (3 h): generate the TypeScript bindings. Wire the shop page: the QR link opens `/tienda/[invoiceId]`, "Pagar ahora" calls the contract, and the driver's screen shows "Pagada".
- Yahya and Jack: join the workshop with the worst bug so far.
- Rohan (1 h): 1 or 2 calls; one-pager v1 with what you heard.
- **Checkpoint: one real digital payment from the phone screen on testnet.** If the contract is still stuck tonight, switch to the fallback in §3.6.

**Wed Nov 11: all three ways to pay (in person, 5 to 7 PM)**
- Jack (2 h, before 5 PM): `repay`, limit growth, no new credit while overdue. Deploy v3.
- Yahya (2 h, before 5 PM): wire cash two-tap and pay-in-7-days into the screens. Merge R3.
- 5 to 6 PM, everyone: run all three flows on testnet together, on real phones. Every bug becomes an issue.
- 6 to 7 PM, Pitch Prep Workshop: pick the pitcher and the name.
- **Checkpoint: pay now, cash and pay in 7 days all work end to end, even if ugly.**

**Thu Nov 12: deploy and one-pager**
- Yahya (3 h): deploy to Vercel. README v1: what it is, how to run it, contract IDs, demo accounts, Risk #1. Fix the worst bugs.
- Jack (3 h): safety pass (who can call what, bad inputs, tests for the failure cases) and dashboard numbers from the contract. Then the first Should item, fee sponsorship.
- Rohan (2 h): final one-pager with 2 or 3 screenshots. First prototype walkthrough with a real person (§13).
- 9 PM, everyone (20-minute call): read the one-pager together. Rohan submits the form. Done means: a confirmation screenshot in the group chat.

**Fri Nov 13: user tests and feature freeze** (form due 8:30 AM, already sent)
- Yahya, Jack (3 h each): Should items, then polish. Fix whatever Thursday's walkthrough showed.
- Rohan (1 h): 1 or 2 more walkthroughs. Write "what we heard, what we changed" in `docs/research.md`.
- **11:59 PM: feature freeze.** After this, only bug fixes, the video, the trifold and the pitch.

**Sat Nov 14: video and Devpost**
- Yahya, Jack (2 h): record the video (§3.7). Upload it publicly to YouTube or Loom.
- Yahya (1 h): submit on Devpost: repo, live app URL, contract IDs, video.
- Rohan, Yahya (3 h): trifold layout on paper (§3.8) and pitch script v1.
- Done means: Devpost submitted, trifold sketch agreed, script v1 written.

**Sun Nov 15: rehearse and build the board**
- Pitcher: five timed run-throughs with the video. The others fire §14 questions.
- Two people: print and assemble the trifold (check print-shop hours on Saturday).
- Rohan: first PowerPoint draft from the template, 6 to 8 slides, no animations, ready in case we make the Top 8.
- Bug fixes only. Final README.

**Mon Nov 16:** showcase. Arrive by 4:00 PM. Checklist in §3.8.
**Tue Nov 17 (if Top 8):** finalist prep, 11 AM to 1 PM. Bring the deck, a laptop and a note-taker. Update the deck that night.
**Wed Nov 18:** upload the final deck by 10:00 AM. Finals 5 to 7:30 PM.

### 3.5 Ruhaan's task cards

> Replaced Nov 9: these screens moved to Yahya. Ruhaan's cards are now small non-UI helpers ("Card R1 to R3" issues). The data shapes below are a starting point; the issues have the current ones.

Give Codex the shared rules plus one card at a time, and ask for the whole card in one pull request.

**Shared rules**
- Next.js (App Router), TypeScript, Tailwind. Every word on screen in Spanish. Mobile first: test at 360 px wide.
- All data goes through `lib/api.ts`, which returns mock data for now. Yahya will later swap the mocks for contract calls without touching the pages.
- Main screens say "dólares digitales", never blockchain, wallet or crypto. Each receipt has a small "Ver detalles" link that shows it's USDC on Stellar (friendly, not hidden).
- Done means, for every card: pull request open, the Vercel preview works on a phone, screenshots in the PR.

Data shapes for `lib/types.ts`:

```ts
export type InvoiceStatus = "due" | "part_paid" | "paid";   // Pendiente, Parcial, Pagada
export type PayMethod = "digital" | "cash" | "credit";       // Digital, Efectivo, Crédito
export type Invoice = {
  id: string;          // "INV-0001"
  shopId: string;      // "tienda-1"
  driverId: string;    // "motorista-1"
  amount: number;      // dollars, e.g. 150
  paid: number;        // dollars paid so far
  dueDate: string;     // "2026-11-20"
  status: InvoiceStatus;
  method?: PayMethod;
};
export type Shop = {
  id: string; name: string; owner: string;
  creditLimit: number; creditOwed: number; creditDue?: string; overdue: boolean;
};
export type Driver = { id: string; name: string; cashHeld: number };
```

**R1. App skeleton** (due Sun Nov 8)
- Pages: `/` (pick a demo role: Distribuidor, Motorista, Tienda), `/distribuidor`, `/ruta/[driverId]`, `/tienda/[invoiceId]`, `/tienda/cuenta/[shopId]`.
- `/tienda/[invoiceId]`: the invoice drawn as a paper receipt (shop name, amount, due date), one main button "Pagar ahora" at the bottom of the screen, and a list of the other ways to pay: "Pagar en 7 días" (greyed out with the reason when not allowed, e.g. "Tiene un pago vencido"; it opens one line of terms and a "Confirmo" button), "Pagar otro monto", "Pagué en efectivo" (opens by itself once the driver has registered cash). A paid invoice gets a "PAGADA" stamp. (Nov 13: was three big buttons.)
- `/tienda/cuenta/[shopId]`: the account drawn as the same paper slip: what the shop owes and the due date, then the sum "Límite de crédito" minus the debt = "Disponible". "Pagar deuda" is the one main button at the bottom of the screen. Below the slip: the unpaid invoices (each opens its pay screen; one with driver cash waiting says "Efectivo por confirmar") and how the limit grows. A late debt shows "Disponible: En pausa" instead of a dollar figure. After paying, a grey "Deuda pagada" holds the button's place, so a repeat tap hits nothing. On both shop screens the main pay button ignores taps for about half a second after it appears, so a double tap on the screen before can't pay.
- `lib/api.ts` mock functions: `getInvoices`, `getInvoice`, `payNow`, `payLater`, `claimCash`, `confirmCash`, `repay`, `getShop`, `getDrivers`. Each waits one second, like a real network call.
- Mock data: 1 distributor, 2 drivers, 3 shops, 8 invoices.

**R2. CSV import** (due Mon Nov 9)
- On `/distribuidor`, an "Importar facturas (CSV)" button. Columns: `invoice_id, shop_id, driver_id, amount, due_date`.
- Check each row: nothing missing, amount above 0, date as YYYY-MM-DD, shop and driver exist, no duplicate IDs. Show a preview table with bad rows in red and the reason.
- "Crear facturas" calls `createInvoices(rows)` in `lib/api.ts`.
- Add `public/sample-invoices.csv` with 8 good rows and 2 bad ones.

**R3. Route list, QR and dashboard** (due Wed Nov 11, morning)
- `/ruta/[driverId]`: today's stops with status chips. Tap a stop to show a big QR code (`qrcode.react`) linking to `/tienda/[invoiceId]`, plus a "Recibí efectivo" button.
- `/distribuidor`: totals at the top (cobrado digital, efectivo por motorista, en crédito, vencido), then the invoice table with filters. Refresh every 5 seconds.

### 3.6 If we fall behind

**Cut in this order** (the top one goes first)
1. Emergency jar and path payment
2. The pool's idle money in a Treasury stand-in
3. Auto-pay
4. Options 2 and 3 in code (keep them on the trifold and in the pitch)
5. Fee sponsorship (explain how it would work instead)
6. CSV import (use the seed script)

**Never cut:** pay now, cash two-tap, pay in 7 days and repay, the basic dashboard, the live testnet deploy with contract IDs, the video.

**If the contract is stuck on Tue Nov 10 night**
- Make payments plain Stellar payments with the invoice ID in the memo, matched by the app. No contract needed for that part.
- Keep only the lender pool in Soroban, as a smaller contract.
- Post the blocker in the Stellar Dev Discord that night, and give Claude or Codex the spec in §8.2.

**If the screens are late on Wed Nov 11:** demo from one plain page with a button per role. Ugly is fine; broken isn't.

### 3.7 Demo video script

> Nov 9: the video issue has the updated script (worldwide number first, then 85,265 shops and small retailers and $2B a year; see docs/facts.md).

60 seconds, screen recording, with the shop and driver screens in a phone-size window. On screen the whole time: "Testnet · dólares de prueba · cash-in simulado".

| Time | Show | Say |
|---|---|---|
| 0:00 to 0:08 | Title card: the opening line from `docs/facts.md` (#73) | "Around the world, small businesses in developing countries can't get about $5.7 trillion in credit they need. In El Salvador alone, more than 50,000 neighbourhood shops buy about $2 billion a year from distributors." (Conamype estimate) |
| 0:08 to 0:20 | Driver's route, Tienda Rosa, QR code; the shop pays $150; the driver's screen turns "Pagada" | "The shop pays in digital dollars at the door. The driver sees it in seconds." |
| 0:20 to 0:35 | Tienda Don Luis picks "Pagar en 7 días"; the distributor gets $147.75 (1.5% credit fee); the shop sees "Debe $150, vence 20 nov" | "Short on cash? Pay in 7 days, no interest. Our lender pool pays the distributor now." |
| 0:35 to 0:45 | Driver taps "Recibí efectivo", shop taps "Confirmo"; the dashboard shows the driver's cash | "Cash still works. Both sides confirm it, so the owner knows who's holding what." |
| 0:45 to 0:55 | Dashboard, then the contract call on a Stellar explorer | "Every payment and every fee split is on a public Stellar record." |
| 0:55 to 1:00 | App URL and contract ID | "Shops never pay fees. Live on Stellar testnet." |

### 3.8 Showcase and pitch checklist

**Trifold** (Velocity's tips: two key points; title about 96 pt, headings 30 to 40 pt, text 24 to 32 pt; text on no more than 25% of the board; sketch it on paper and have someone outside the team read it first)
- Left: the problem. One shop owner's morning in two lines, and three numbers.
- Middle: how it works. Three phone screenshots (pay now, pay in 7 days, cash) and a QR code to the live app.
- Right: who pays and why (the $100 example), Risk #1 and our plan, and "what we heard from N people and what we changed".

**Pitch** (3 minutes, one speaker, the 1-minute video included)
- 0:00 to 0:25: the problem, told as one shop owner's morning.
- 0:25 to 0:55: what we built, and why Stellar.
- 0:55 to 1:55: the video.
- 1:55 to 2:30: who pays, and why they'd want to.
- 2:30 to 2:50: Risk #1, said plainly, and what users told us.
- 2:50 to 3:00: close.

**Bring on Nov 16:** laptop and charger, a phone with the shop page open, the trifold, the video downloaded (in case the Wi-Fi fails), a phone hotspot, a printed QR code to the app.

---

## 4. What to learn first

Learn only what your next task needs. Each item has a "done means" so you know when to stop.

**Everyone, before Mon Nov 9 (about 1 hour)**
1. **Core concepts** (20 min): https://developers.stellar.org/docs/learn/fundamentals. Read about accounts, assets and trustlines, transactions, memos and fees. Skip the rest.
2. **Try it in Stellar Lab** (25 min): https://lab.stellar.org. Make two testnet accounts, fund them with Friendbot, and send a payment between them with the memo `INV-0001`. Done means: you can find the payment on a testnet explorer and say what the memo is for.
3. **Anchors** (15 min): https://developers.stellar.org/docs/learn/fundamentals/anchors. How cash becomes digital dollars and back, which is our Risk #1. Done means: you can explain what an anchor does in two sentences.

**Yahya and Jack (builders), by Mon Nov 9**
4. **Setup and a first contract** (1.5 to 2 h): https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup, then the hello-world steps after it, then deploy to testnet. Done means: a testnet contract ID you've called from the CLI.
5. **Three example contracts** (1 h): https://developers.stellar.org/docs/build/smart-contracts/example-contracts
   - *Token:* how moving money and permissions (`require_auth`) work.
   - *Timelock:* checking the time, like our 7-day due date.
   - *Liquidity Pool:* a contract that holds pooled money, like our lender pool.
6. **Yahya, by Wed:** generating the TypeScript client (`npx @stellar/stellar-sdk generate --help`; the CLI's `bindings typescript` command is deprecated) and calling a contract with `@stellar/stellar-sdk`.
7. **Stretch only** (15 min): path payments, https://developers.stellar.org/docs/build/guides/transactions/path-payments

**Rohan, by Mon Nov 9**
- Tienda Pago, the closest precedent (Spanish; use browser translate): https://emprendedor.com/no-necesitas-usar-efectivo-esta-fintech-ayuda-a-los-minoristas-a-comprar-su-mercancia/
- The 2026 FUSAI study on loan sharks (Spanish): https://www.eldiariodehoy.com/negocios/microempresas-el-salvador-dependen-prestamos-usureros/86923/2026/
- §5 of this file. Done means: you can explain the $100 example without notes, and you've listed what would make a distributor say no.

**Ruhaan:** §7.1 (the flow) and your cards in §3.5. The Soroban setup page is optional.

**Five finance words** (the rest are in §18)
- *Trade credit:* a supplier lets you take goods now and pay later.
- *With recourse:* if the buyer doesn't pay, the seller has to pay the lender back. *Without recourse:* the lender takes the loss.
- *Default buffer:* money set aside from fees to cover people who never pay.
- *Yield:* what money earns while it sits somewhere, like interest.
- *Treasury bill:* a short loan to the US government. Very safe, small yield.

**Learning fast with Claude:** attach this file and ask "explain X with an everyday example, in five lines". Ask for code only once you can say what it should do.

---

## 5. How we make our cut

**In short**
- Distributors pay us. Shops never pay a fee, and we never take a cut of anyone's savings.
- Two small fees, both written into the contract so anyone can check them:
  1. **Usage fee:** 0.05% to 0.1% of every invoice paid in cash or digitally. Credit sales don't pay it, because our cut is already inside the 1.5% credit fee (Nov 10). The demo contract uses 0.1%; for cash, the fee is recorded and billed later, since no digital money moves. The rate is the same for cash and digital, so it doesn't push anyone back to cash. (This replaced the earlier monthly per-truck fee.)
  2. **A share of the credit fee** when a shop uses "pay in 7 days".
- Later: lenders and banks pay to see a shop's payment record, only with the shop's permission.

**The $100 example** (made-up numbers; Rohan pressure-tests them)
A shop buys $100 of stock and picks "pay in 7 days".
1. At delivery, the lender pool pays the distributor $98.50. The distributor pays one 1.5% fee to be paid now, with no risk. No usage fee on top, so there is one number to remember.
2. Within 7 days, the shop pays the pool $100. No interest.
3. The contract splits the $1.50: $0.75 to the default buffer, $0.50 to lenders, $0.25 to us.
4. If a shop is about 4 weeks late (4 credit periods), the admin calls `cover_default`: the buffer pays the lenders back what it can, the shop's credit goes to $0, and the debt stays on its record. Anything the shop pays later refills the buffer.

**Three options, chosen per shop** (whoever covers a late payer sets the price)

| Option | Who covers a shop that doesn't pay | Fee per $100, paid by the distributor | Split |
|---|---|---|---|
| 1. Pool covers | The lender pool | $1.00 to $1.50 (less when the shop pays part up front, #135) | $0.50 lenders; the rest 3:1 buffer : us ($0.75 / $0.25 at $1.50) |
| 2. Distributor covers ("with recourse") | The distributor | about $0.25 | $0.15 lenders (about 8% a year, close to the 7.6% average for loans under a year, facts 51), $0.10 us |
| 3. Distributor's own money | The distributor | $0 | No credit fee; we earn only the usage fee |

- Option 2: if a shop is more than 7 days late, the distributor pays the pool and collects from the shop itself. The distributor keeps a small deposit in the pool that the contract can use for this.
- Whoever carries the risk sets the shop's limit.
- Typical use (plan): option 2 for long-time customers (cheap), option 1 for new shops.
- **Built so far (Nov 13, #112): option 1 only.** The contract has one credit fee, 1.5% (`CREDIT_FEE_BPS = 150`), and every "pay in 7 days" sale is paid from the pool. Options 2 and 3 are ideas, not in the contract. PR #139 proposes a fee that slides from 1.00% to 1.50% depending on how much the shop pays up front.

**The usage fee in numbers (guess):** a route with 60 shops buying $150 a week each moves about $39,000 a month. At 0.05% that's about $20 a month for that route; at 0.1%, about $39. That's tiny per route, so we need many routes, and the credit fee share matters.

**Why the distributor pays, not the shop**
- It gets paid at the door instead of a week later, sells more because shops can buy more than their cash allows, and carries less risk and less cash.
- It keeps our promise to shops: full price, no interest.
- A fee charged to shops could count as interest. El Salvador caps interest at 1.6 times the central bank's average rate for each loan type (FLACSO, Oct 2025). We didn't find the exact microcredit cap; confirm with an advisor or lawyer.

**What lenders earn:** $0.50 per $100 per week is about 26% a year (facts 56) if the pool's money is always lent out (it won't be). Idle money could sit in tokenized US Treasuries at about 3.6% a year (stretch).

**The 1.5% in yearly terms (Nov 12, #93; our maths in facts 56)**
- A finance judge may annualize it, so have the number ready for Q&A (facts 56: Q&A only, never a headline): being paid 7 days early for 1.5% is about 79% a year simple, or about 120% compounded.
- The shop pays 0%. The distributor chooses to pay the fee, and it buys two things: cash at the door, and no default risk (the buffer).
- For comparison: suppliers that offer "2/10 net 30" give up about 37% a year just to be paid sooner (facts 52). A bank loan under a year averages about 7.6% a year for those who qualify (51); most tiendas don't (§9).
- A cheaper choice for shops the distributor knows is still an idea: option 2 (0.25%, about 13% to 14% a year, facts 56) isn't built; the contract has one 1.5% fee. PR #139's sliding fee (1.00% to 1.50%) would be the first cheaper path.
- Legal check: if the 1.5% were ever treated as interest, about 120% a year is above the highest legal maximum, 96.88% (facts 49). It has to stay a fee the distributor pays to be paid early, not interest on the shop's debt, and a lawyer confirms it (§11).
- Precedent: a Salvadoran fintech already turns small businesses' invoices into cash within 24 hours, on a US$50 million credit line from a US fund (53).

**Costs (early thinking):** Stellar describes its network fees as under a cent per transaction (facts 36 and 37; they exist to stop spam; they aren't revenue for the Stellar Development Foundation, which is a non-profit), and hosting is nearly free. The real costs are signing up distributors and training drivers, partner fees for cash-in and cash-out, the licensed lender's share, and support.

**What could break it**
- Defaults above about 0.75% of credit sales use up the buffer under option 1.
- Our share per sale is tiny, so we need volume.
- If turning cash into digital dollars costs shops much, nobody switches (Risk #1, §6).
- Distributors may say 1.5% is too much. Ask them (§13).

**Market size (sourced Nov 9):** distributors sell about **$2 billion a year** to El Salvador's **85,265 neighbourhood shops and small retailers** (about 50,133 of them are tiendas proper). The $2B is a Conamype estimate: its president, Paul Steiner, citing unnamed market studies, via Diario El Salvador, 27 Feb 2026. The shop count is Distribución Dinámica's. Details and caveats: `docs/facts.md` entries 1 to 3. Ceiling, not a forecast: if 10% of it went through "pay in 7 days", our 0.25% share of that is $500K a year, and the 0.1% usage fee on the other 90% is $1.8M (credit sales don't pay the usage fee), so about $2.3M in total. Lead with a worldwide number first, then this one (our technical and finance advisor); Rohan is finding and sourcing it. Never use the unsourced $7B.

---

## 6. Risk #1: cash to digital dollars

This section goes in every doc we make: the README, the one-pager, the pitch, `docs/risks.md`. Add new ideas to the log with the date.

**The risk:** shops earn cash from customers. To pay or repay in digital dollars, they need a cheap, nearby way to turn cash into USDC (cash-in). Distributors also need to move USDC into their bank (cash-out). Neither is solved. If cash-in costs a shop more than paying the truck in cash, nobody switches. Crypto companies in El Salvador also struggle to get bank accounts (Cointelegraph, Feb 2025), so we'd need a licensed partner that already has banking.

**What the demo does:** test dollars, with cash-in simulated and labelled on screen. We say it in the pitch before anyone asks. One finals judge works with Stellar's payment partners, so expect the question.

**Ideas log**

| # | Idea | Added | Status |
|---|---|---|---|
| 1 | **Repay like a bill.** The shop pays cash at a bank agent or bill-payment point with a reference number. A licensed partner converts in bulk, and it counts as a digital repayment. Tienda Pago uses 33,000 such points. | Nov 6 | Most promising |
| 2 | **One trip a week, not one per delivery.** Credit lets the shop sell first, then settle everything with one weekly deposit. | Nov 6 | Built into the design |
| 3 | **Fallback:** the shop repays the driver in cash at the next delivery (recorded with two taps), and the distributor settles with the pool in one bulk transfer. It keeps cash on routes, so it's the last resort. | Nov 6 | Fallback |
| 4 | **Customers pay the shop by QR**, so the shop's money starts out digital. | Nov 6 | Later |
| 5 | **Ask advisors** which Stellar anchors serve El Salvador and what cash-in costs. | Nov 6 | Mon Nov 9 |
| 6 | **Banked shops repay by Transfer365**, which is free: a bank transfer to the partner's account with the reference number. No cash trip at all. | Nov 6 | New |
| 7 | **Cash-out in one batch:** the licensed partner pays distributors into their bank account once a day, so they never have to handle USDC unless they want to. | Nov 6 | New, ask advisors |
| 8 | **Ask** whether a mobile-money provider with cash agents in El Salvador could be the cash-in network. | Nov 6 | Question |
| 9 | **Cash-out via MoneyGram.** Distributors can collect cash from their digital dollars at MoneyGram Ramps points (banks, Super Selectos), as a stand-in until a partner pays them into their bank (idea 7). | Nov 7 | Found, check fees |
| 10 | **No big deposit at sign-up.** Because of credit, a shop never pre-loads money: it takes stock on credit, sells it, then turns cash into digital dollars once a week, only for what it owes. Shops can't afford to lock up money they need for stock. | Nov 7 | Built into the design |
| 11 | **Ask the banks that already work with MoneyGram** (Cuscatlán, Davivienda, Promerica) whether they could also take cash in, so the same counters handle both directions. | Nov 7 | Question |
| 12 | **Partner instead of building cash points.** Work with a bank or cash-in/cash-out company that already has a reputation in El Salvador (our startup advisor, Nov 9). Secure ATMs (about $5k each) came up and were rejected: cash rules and safety. Rohan is emailing banks and cash-in companies. | Nov 9 | In progress |
| 13 | **Use the counters that already exist.** Banks run 8,900 correspondent points inside small businesses (facts 41). One bank's customers deposit at PuntoXpress at no extra cost (42), and a wallet tops up at 748+ Punto Express points without surcharge (43). A banked shop deposits there and pays from its account; Transfer365 is free (14). | Nov 12 | Most promising for banked shops |
| 14 | **Idea 1 already works for loans.** CrediCampo borrowers repay through Tigo Money's 2,500+ agents, and Banco Integral's through AKÍ Pago's about 1,000 points (facts 44). We need a partner that does the same and credits digital dollars. | Nov 12 | Precedent found |
| 15 | **Ask partners that already hold the licences.** A bank that is also registered as a digital asset provider (Banco Atlántida El Salvador, facts 46) has banking and a digital asset registration; a licensed e-money company (Tigo Money, 45) has the cash agents. Contact them first. | Nov 12 | To contact |

**Finding, Nov 7 (Yahya, MoneyGram Ramps locator):** MoneyGram has **cash-out** points in El Salvador (USDC to cash), in San Salvador and other cities. The locator shows the nearest 10 at a time, so we don't have a full count. Examples in central San Salvador: Banco Cuscatlán, Super Selectos, Banco Promerica, Banco Integral, Banco Davivienda, Banco Abank and a DLC road market. What it means for us: cash-out has a real answer today, so a distributor can turn digital dollars into cash at a bank or supermarket. **Cash-in (cash to USDC) is still unsolved,** and that's the half shops need.

**Source check, Nov 12 (not confirmed by a person):** moneygram.com/stellar says "Cash-out is available in 170+ countries and territories and cash-in in 25+ countries", so "MoneyGram covers cash-out only" is false in general. For El Salvador the page's coverage map appears to list cash-out but not cash-in; that comes from the page HTML, and nobody has checked it by eye. The one-pager and the README (Risk #1) now say "as far as we found". Check the map by hand before we say cash-in is missing.

**Built, Nov 10 (#25):** the cash two-tap now runs on testnet: the driver records the cash, the shop confirms, and the contract counts it as cash held by that driver (`get_driver_cash`). No digital dollars move, so this records cash; it does not convert it. It is the mechanism behind idea 3 and does not solve cash-in. The distributor's "Marcar efectivo entregado" (#32) lowers that count when the driver hands the cash in at the warehouse; still no digital dollars move.

**Found, Nov 12 (#91, facts 41 to 46):** the counters exist. The missing piece is a partner that turns a cash deposit into digital dollars.
- **Cost to the shop:** account holders pay $0 at the counters we found (BAC customers and Nequi users, facts 42, 43); whether a shop's deposit for us would be free is unknown. A banked shop paying by Transfer365 pays $0 (14). What a network charges its partner per deposit isn't published.
- **How close:** we have network sizes, not distances: 8,900 bank correspondents (41), about 2,500 Tigo Money agents (45), about 1,000 AKÍ Pago points (44) and 748+ Punto Express points (43). They overlap, so never add them up. Many tiendas are themselves service points (55).
- **Partner:** first call, a bank that is also registered with the CNAD as a digital asset provider (46). Our reading of the law (47), for a lawyer to confirm: the digital-dollar step needs a registered provider.

**Still to find out:** what a partner pays per deposit, whether a partner will credit digital dollars rather than a bank account, and how far the nearest counter is for a typical shop (ask it in interviews, §13 question 6).

---

## 7. How the product works

### 7.1 One delivery
1. The distributor loads the day's invoices (invoice, shop, driver, amount, due date).
2. The truck arrives. The shop checks the goods and confirms the amount, lowering it if items are missing.
3. The driver shows a QR code. The shop picks one:
   - **Pagar ahora:** pays in digital dollars now.
   - **Pagué en efectivo:** pays cash. The driver taps "Recibí efectivo" and the shop taps "Confirmo".
   - **Pagar en 7 días:** only for shops with a good record and nothing overdue.
4. Our contract marks the invoice paid, part-paid or due, and blocks paying twice.
5. The owner's dashboard shows totals, how much cash each driver is holding, and who owes what.
6. Paying digitally and on time grows the shop's limit.

### 7.2 Cash rules
- Cash is allowed at delivery only, and it's always recorded. That's how the owner keeps track of drivers.
- Cash doesn't build credit. Only digital payments and on-time repayments do. That's the only way cash is "worse"; there's no penalty.
- No discount for paying digitally (we can't count on distributors paying for it).

### 7.3 Credit rules ("pay in 7 days")
- Full price, no interest. It's time to pay, not free goods.
- Due by the next delivery, and never later than 7 days. (Weekly visits are a guess; ask in interviews.)
- Limits start small and grow with every on-time repayment. Tienda Pago's average was about $250 to $300.
- No new credit while anything is overdue. The truck keeps coming back, which is our leverage.
- The driver's app shows what the shop owes at each stop.
- WhatsApp reminders, and auto-pay with the shop's permission (stretch).
- One record shared across distributors, so a good payer is trusted by all of them.
- It replaces only the stock part of loan-shark borrowing, not emergencies.

### 7.4 Savings and yield (stretch)
- **Shop emergency jar:** 43.5% of loan-shark borrowing is for family emergencies. Savings help more than the interest does: $500 at about 3.6% earns about $18 a year. With the shop's permission, savings can raise its credit limit.
- **Idle money:** the pool's spare money and the distributor's deposit could sit in tokenized US Treasuries. Etherfuse's USTRY tracks US Treasuries, and trackers also list Ondo's USDY and Franklin Templeton's BENJI on Stellar. They averaged about 3.6% a year in Oct 2026. They're only sold to certain non-US people in certain countries, and El Salvador isn't confirmed (ask advisors).
- Paying an invoice from bond-token savings uses a path payment.
- In the demo it's a stand-in token, labelled simulated.

### 7.5 Principles
- Friendly but not deceptive: "dólares digitales" on main screens, and one tap shows it's USDC on Stellar.
- Spanish first, big buttons, works on a cheap Android phone and a slow connection.
- Shops never pay fees.
- We're not the lender. For real, a licensed microfinance institution or cooperative funds the pool.
- Personal data stays off the public ledger.

### 7.6 Scaling (a "future" slide, not built)
- Inside El Salvador first: more supplier types (bread, dairy, snacks, gas), then pupuserías and market stalls, then microfinance institutions and cooperatives lending on a shop's record with permission.
- Savers funding the pool (Space 1 "fair financial assets"; needs licences).
- Then other countries: Ecuador and Panama (they also use the US dollar), then Guatemala and Honduras, then Mexico and Peru.

### 7.7 First customer and pilot (proposal, Nov 12, #94: waiting for team approval)

**Who we'd ask first** (every number is in `docs/facts.md`)

| Who | Why them | How we reach them |
|---|---|---|
| Distribuidora Zablah (DISZASA) | Its rating agency calls it the leading consumer-goods distributor; 24,000 active clients, 14% of sales by route (facts 54) | Through people who already know it: its rating agencies (our email to Zumma Ratings isn't sent yet; Ruhaan sends it, #120) and ADES |
| DISNA (same group) | 9,500 active clients, some of them served by route (54) | Same |
| Members of ADES, the distributors' association | ADES already works with Conamype and the state bank BFA on tiendas (55) | ADES directly, and Distribución Dinámica, the firm behind the shop count (facts 2) |

The target is still a mid-size distributor with a few routes (§9). The big group is on the list because we can check its numbers and reach it; its route channel is only a slice of its sales.

**Pilot plan: one route, about 8 weeks (guess)**
1. **Phase 1: one route, the distributor's own money.** Invoices, the cash two-tap and digital payments on one route of about 60 shops (the §5 route, guess). The distributor funds the pool itself (anyone can call `deposit`), so no outside lender is needed. As built, each "pay in 7 days" sale still pays the 1.5% credit fee from the pool: the lenders' $0.50 goes back to the pool the distributor funded, $0.75 to the buffer and $0.25 to us; invoices paid at delivery pay the 0.1% usage fee. Whether a distributor funding its own shops' credit counts as lending is for a lawyer (§11).
2. **Phase 2: add the pool and the cash-in partner.** A licensed lender adds money to the pool (§5), and a partner registered with the CNAD handles digital dollars (§6).
3. **Phase 3: a second distributor on the same shops.** A shared record is what one distributor's database can't give (§14).

**What the pilot measures** (from §9): the share of invoices paid digitally, driver cash gaps caught, on-time repayments, shops whose limit grew, and defaults as a share of credit sales.

**Go or no-go after phase 1 (guess):** the distributor keeps using it without us pushing, and defaults stay under 0.75% of credit sales, the most option 1's buffer can absorb (§5).

---

## 8. Tech design

### 8.1 Stack
- **Contract:** one Soroban contract in Rust, `contracts/route_ledger`, for invoices, cash records and the lender pool. One contract means one deploy and one contract ID; we can split it later. (We first talked about two contracts; one is simpler for a first build.) Build it with `stellar contract build` (soroban-sdk 29 refuses a plain `cargo build` for wasm); `cargo test` runs the tests without the CLI.
- **Money:** a test dollar token we issue on testnet, used through its Stellar Asset Contract (SAC). Circle's testnet USDC is optional later.
- **App:** a mobile web app: Next.js (at the repo root), TypeScript, Tailwind. Spanish, mobile-first, on Vercel. No native app.
- **Talking to Stellar:** `@stellar/stellar-sdk` (v17) with a TypeScript client generated by `npx @stellar/stellar-sdk generate` (the CLI's `bindings typescript` command is deprecated). Testnet RPC `https://soroban-testnet.stellar.org`, Horizon `https://horizon-testnet.stellar.org`.
- **Names, phone numbers, items:** off-chain, in a JSON config for the demo (a database later).

### 8.2 Contract functions (spec for Jack)

> Nov 9: Yahya now writes the contract and Jack reviews and tests it. The exact v1 to v3 spec (constructor, fee constants and math, error codes, tests) is in the contract issues and wins over this table. Changes: `init` became `__constructor(admin, token, treasury, credit_period_secs)`; fees are a 0.1% usage fee on every invoice plus 1.5% for credit (0.75 buffer, 0.50 lenders, 0.25 us); `set_terms(shop, limit)` has no option (options 2 and 3 are pitch-only); limits start at $200 and grow $25 per on-time repayment, up to $500.

> Nov 13 (#135, #137, one redeploy): the credit fee slides with the share of the invoice on credit, f clamped to 0.10..1.00: rate = 100 + 50 × (f − 0.10) / 0.90 bps, rounded down (all on credit 1.50%, half 1.22%, a tenth or less 1.00%). Lenders always get 0.50%; the rest splits 3:1 buffer : us, the odd bps to the buffer (75/25 at 1.50%, 38/12 at 1.00%). Each invoice stores its `credit_fee`. If every invoice credited in a cycle had half or more paid up front, the $40 minimum to grow is waived (once a week and the $500 cap stay). `repay` grades lateness in days past `due_at` (a day = credit period / 7): ≤1 on time (grace day), 2-7 `late_minor` and −$25, 8+ `late_major`, −$50 and no raise for 4 periods; `cover_default` unchanged. `ShopView` adds `late_minor`, `late_major`, `max_days_late`, `first_credit_at`.

> Nov 10 (review of #58): no usage fee on credit sales (payout $98.50 per $100). A limit only grows if the shop borrowed $40+ in that cycle, and at most once per credit period. A late repayment drops the limit $25. New functions: `approve_distributor(distributor)` and `is_distributor` (only approved distributors can create invoices, so pool money can't go to a fake one); `cover_default(shop)` (admin, once a shop is 4 credit periods late: the buffer repays the lenders what it can, the shop's limit goes to 0, the debt stays as `written_off`, and later repayments refill the buffer); `fund_buffer(from, amount)` (seeds the buffer; `deploy.sh` adds $50).

| Function | Signed by | What it does |
|---|---|---|
| `init(admin, token, credit_period_secs)` | admin | One-time setup. A short credit period (say 2 minutes) lets the demo show "overdue" live; 7 days for real. |
| `create_invoice(distributor, id, shop, driver, amount, due)` | distributor | Stores an invoice. Rejects duplicate IDs and amounts of 0 or less. |
| `pay(shop, id, amount)` | shop | Moves test dollars from shop to distributor. Part payments are allowed; paying more than what's left is rejected. |
| `cash_claim(driver, id, amount)` | driver | The driver says they received cash. |
| `cash_confirm(shop, id, amount)` | shop | The shop agrees to exactly the amount it was shown (if the driver changed the claim since, it fails). The invoice is marked paid in cash and the driver's cash total goes up. No tokens move. |
| `cash_handed_in(distributor, driver, amount)` | distributor | The driver handed cash in at the warehouse. (Should) |
| `deposit(lender, amount)` | lender | Puts money in the pool. |
| `set_terms(admin, shop, limit)` | admin (the distributor, for real) | Sets a shop's credit limit. (Options were planned; the contract has none.) |
| `pay_with_credit(shop, id)` | shop | Checks that nothing is overdue, the limit isn't exceeded and the pool has money. The pool pays the distributor the amount minus the fee, and the shop's debt and due date are recorded. |
| `repay(shop, amount)` | shop | Moves test dollars from the shop to the pool and splits the fee into buffer, lenders and us. If it's on time, the limit grows (demo rule: +$25 per on-time repayment, up to a cap). |
| `get_invoice`, `list_invoices`, `get_shop`, `get_pool`, `get_driver_cash` | anyone | Read-only, for the dashboard. |
| `invoice_count`, `list_invoices_page(before, limit)`, `get_totals` | anyone | Read-only: the full history a page at a time (30 per call, newest first), and running totals by payment method. |

- Every "pay in 7 days" sale is paid from the pool. Options 2 and 3 (§5) aren't built.
- Each role sends its own transaction, so `require_auth` is met by whoever signs. Avoid transactions that need two signers; that's why cash is two steps.
- Amounts are integers with 7 decimals ($1.00 = 10,000,000). Use `i128`.
- Emit an event for every change, for the dashboard and so judges can verify.
- Test the failure cases: paying twice, overpaying, credit while overdue, credit over the limit, the wrong signer.

### 8.3 Keys and accounts
- **Demo:** the app's server holds the testnet secret keys for each demo role, in Vercel environment variables only. Never in the repo, the browser or a chat.
- **Real product:** shops sign in with a passkey (fingerprint or face, no seed phrase) through a smart wallet. Fees are sponsored, so nobody needs XLM. The licensed partner does KYC.

### 8.4 On-chain and off-chain

| On Stellar | Off-chain |
|---|---|
| Invoice amounts, status, due dates | Shop and owner names, phone numbers |
| Payments, cash confirmations, credit, repayments | What's on each invoice |
| Fee splits, pool balances, limits | CSV files, WhatsApp reminders |

Amounts are visible on a public ledger even without names. Later: keep invoice details off-chain with only a fingerprint (hash) on-chain, and settle in batches.

### 8.5 Repo layout

```
app/                      Next.js App Router pages and server code (the Next.js app lives at the repo root)
components/, lib/         UI components; shared TypeScript (lib/stellar/ is server-only)
contracts/route_ledger/   Rust contract and tests (Cargo workspace at the repo root)
packages/route_ledger/    generated TypeScript client for the contract
scripts/                  setup.sh (accounts, test USDC, balances), deploy.sh (contract, terms, pool, demo invoices)
config/testnet.json       public keys and contract IDs, no secrets
docs/                     context.md (this file), facts.md, research.md, assumptions.md, security.md, one-pager.md, pitch.md
README.md                 what it is, how to run it, contract IDs, demo accounts, Risk #1
```

---

## 9. The problem and the evidence

**Who:** neighbourhood shops in El Salvador and the distributors whose trucks restock them. First customer **(guess, confirm in interviews)**: one mid-size distributor of snacks, drinks or dairy with a few routes. Shortlist and pilot plan: §7.7.

**Numbers we can use** (say "regional" when it is)
- **85,265 neighbourhood shops and small retailers (2025), about 50,133 of them tiendas proper, up 23% in a decade** (Distribución Dinámica study, via Diario El Mundo, 24 Feb and 1 Mar 2026). The total also counts eateries, street vendors and tortilla shops. This replaces the older "about 70,000 (USDA)".
- **Distributors sell them about $2B a year, and they sell about $3B a year to customers** (Conamype estimate, Paul Steiner citing market studies, via Diario El Salvador, 27 Feb 2026). Never use the $5B sum.
- **Most are run by women.** Distribución Dinámica says 85% (via Diario El Salvador); another report says about 70%, so say "most". **Extortion used to close shops and delivery routes** (same article; GI-TOC, Feb 2022).
- 80% of 1,200 small-business owners in Mexico, El Salvador, Honduras and Guatemala mainly pay suppliers in cash (a 2022 PCMI survey, quoted in a Mastercard white paper reported in Apr 2025; `docs/facts.md` entry 11). Regional, not El Salvador alone.
- 62.2% of informal and semi-informal micro and small businesses have borrowed from loan sharks at some point, at about 1,869% a year on average, and 68% get the money the same day. Reasons: 43.5% family emergencies, 41.7% keeping the business running (FUSAI and ASOMI, via El Diario de Hoy, Jul 2026). The 1,869% matches a March 2022 CIOPS measurement, so it may be older data.
- In a 2019 survey of 1,285 merchants, 75% used loan-shark money for stock, 96% repaid daily, and each $100 cost about $35 in interest (CIOPS, 2019).
- 51.5% of micro and small businesses have no formal financial relationship (FLACSO and FUSAI, cited in our first draft).
- 46.9% of adults have a savings account (central bank survey, 2025); the World Bank's Global Findex says 43% (2024). Say "fewer than half".
- Transfer365, the central bank's instant transfer system, is free for users and moves over $4B a month (BCR data via El Diario de Hoy, Jan 2026); outlets put its share at 93% to 95.3%, so say "more than 9 in 10". So "cheaper transfers" is not our pitch.
- El Salvador uses the US dollar, so USDC is simply "digital dollars": no exchange rate, and no inflation story.
- Bitcoin became optional in Jan 2025, as part of a $1.4B IMF deal, and only 8.1% used the government's Chivo wallet in 2024. Say "digital dollars", never "crypto".
- Remittances ($10.0B in 2025, about 24% of GDP) are background only. We're domestic.

**Still to prove in interviews:** how often trucks visit, how much shops buy per visit, what cash handling costs a distributor, whether distributors would pay 1.5%, and whether shops would try paying by phone.

**How we'd measure impact**
- The share of a route's invoices paid digitally.
- Cash-handling hours and trips saved per route each week.
- Shops buying stock with "pay in 7 days" instead of from a loan shark, and the interest they avoid (about $35 per $100, CIOPS 2019).
- Driver cash differences caught.
- Shops whose limit grew: a credit record they never had before.

---

## 10. Competitors and precedents

| Who | What they do | Lesson for us | How we're different |
|---|---|---|---|
| **Rocket** (El Salvador; GlobalPay Solutions with Mastercard and Microsoft) | A shop app: card payments, bills, phone top-ups, a marketplace to order stock; microcredit planned. In 2022: over 2,000 shops signed up, about 400 actually using it. | Shops sign up; keeping them active is the hard part. | We live inside the distributor's route: driver cash records, invoice matching, and credit on a record shared across distributors. |
| **Tienda Pago** (Mexico and Peru) | Pays big brands' distributors for a shop's stock. The shop approves with an SMS or WhatsApp code when the truck arrives and repays within 7 days at a bank or one of 33,000 payment points. Works on basic phones. Raised $7.5M (2018). | Seven-day stock credit at the truck works. | El Salvador; rules and fee splits in a public contract; a pool many lenders can fund; cash tracking for distributors. |
| **Transfer365** | Free instant bank transfers. | Moving money between bank accounts is already free. | No credit, no invoice matching, no driver cash records; about half of small businesses have no bank relationship. |
| **BFA tienda credit line** (state bank, with Conamype guarantees; since late 2025) | Loans to tiendas up to $10,000, approved within 72 hours; over $1.4M lent in 440 loans by Feb 2026. | Government already sees stock credit as the problem. | A loan you apply for (average about $3,200) versus 7-day, no-interest stock credit at the truck, per delivery, that builds a record. See `docs/facts.md` entry 20. |
| **Loan sharks** | Cash the same day, no paperwork. | Speed and no paperwork matter. | The same speed for stock, with no interest. |
| **Cash** | Works everywhere. | Cash has to stay allowed. | We record cash instead of fighting it. |

---

## 11. Other risks

| Risk | What we do about it |
|---|---|
| Cash-out: distributors turning USDC into bank dollars, and crypto firms' trouble getting bank accounts | A licensed partner with banking; daily batch payouts (§6, idea 7) |
| Adoption: shops and drivers don't change habits | Start inside one distributor's routes; cash still works; credit is the reason to switch |
| Defaults and fraud | Small limits that grow, no new credit while overdue, and the default buffer |
| Regulation: lending and digital assets need licences | A licensed lender funds the pool; a partner registered with the CNAD handles digital dollars; distributors pay the fee, not shops, because of the interest cap. Law by law: §11.1 |
| Privacy on a public ledger | No names on-chain; details off-chain; batching later |
| Basic phones and weak signal | The shop side opens from a WhatsApp or SMS link; light pages; later, a code-based approval like Tienda Pago's |
| Nobody on the team has lived this | Interviews and prototype tests (§13); say it honestly |

### 11.1 Laws we touch (Nov 12, #92)

Every number and quote is in `docs/facts.md`. The two right-hand columns are our reading, for a lawyer to confirm before launch.

| Area | Law and who enforces it | What it means for us | Who holds the licence |
|---|---|---|---|
| Digital dollars | Digital asset law (2023); the CNAD keeps a public registry of providers (facts 47) | Turning cash into digital dollars, holding them for shops and lending them all look like services that must register (47). 60+ providers are registered, including a bank (46) | A registered partner for now; we'd register only if we did those parts ourselves |
| Cash agents and e-money | Financial inclusion law (2015), supervised by the SSF; the central bank's rules for bank correspondents (48, 41) | The cash-in counters already run under these rules (41, 45) | The bank or e-money company we partner with (§6) |
| Interest | Usury law: the central bank sets caps twice a year; the highest is 96.88% a year for Jul to Dec 2026 (18, 49) | Shops pay no interest. The distributor's 1.5% must count as a fee it pays to be paid early, not interest: per year it would be above every cap (56) | No licence; the caps bind whoever lends to the pool |
| Lending | Banks, cooperatives and savings-and-loan companies are supervised by the SSF; other regular lenders register with the central bank (18) | We're not the lender (§7.5) | A licensed microfinance institution, cooperative or bank funds the pool |
| Personal data | Personal data protection law (2024) (50) | Names and phone numbers stay off the public ledger (§8.4); we likely need consent text and a person responsible for data | Us |

---

## 12. How we're judged

**Business impact, 37.5%**

| They look for | Our answer | Owner |
|---|---|---|
| A real problem with evidence, and how we'd measure impact | §9 numbers and impact measures | Rohan |
| Why we're better than the alternatives, including Stellar's benefits | §10, and "Why Stellar?" in §14 | Yahya |
| A specific, reachable first customer, and market size | One distributor's route first, with a named shortlist and a pilot plan (§7.7); worldwide number first, then 85,265 shops and small retailers and $2B a year from distributors | Rohan (facts), Jack (one-pager) |
| A revenue model, affordable pricing, costs | §5 and `docs/assumptions.md` | Rohan (numbers), Jack (one-pager) |
| A prototype tested with real users, and what we changed | §13 walkthroughs; "what we heard, what we changed" | Rohan, Yahya |

**Technology and implementation, 37.5%**

| They look for | Our answer | Owner |
|---|---|---|
| Meaningful Stellar use (Soroban, assets, path payments, anchors and SEPs) | A Soroban contract for invoices and the pool; a Stellar asset; anchors for Risk #1 in the pitch; a path payment as a stretch | Yahya |
| A sensible on-chain and off-chain split, RPC or Horizon, a path to production | §8 | Yahya |
| A build judges can verify: testnet deploy, public repo, docs, contract IDs | README with contract IDs and run steps | Yahya |
| Security: contract safety, keys, sign-in, KYC awareness | Tests for the failure cases; keys server-side only; the licensed partner does KYC | Jack |
| UX that hides blockchain: onboarding, fee sponsorship, mobile, low connectivity | Spanish, phone-first, "dólares digitales", fee sponsorship | Yahya, Jack (fee sponsorship) |

**Presentation, 25%:** at the showcase, 15% delivery and 10% trifold effort and quality (§3.8).

**The brief's main test:** don't ask funders to subsidize serving these users; make serving them structurally cheaper, so it works at market prices. Our answer: no subsidies. Distributors pay because they save money, and Stellar makes each invoice almost free to process.

**Judges**
- Showcase: Shaun Johnson (SDF, Ecosystem); Alex Wu (SDF, Strategic Initiatives and Policy; expect regulation questions).
- Finals: Wlademyr Mendes (SDF, Senior Developer Advocate; expect contract questions); Shubh Brar "Boxy" (Stellar ecosystem, founder of Stellarlight.xyz); Magdiela Rivas (SDF, Payment Partners; expect Risk #1 questions); De-Ann Abraham (Stellar, Ecosystem Impact; expect impact questions).

---

## 13. Outreach and interview kit

**Goal by Sat Nov 14:** at least 5 conversations (2 or 3 people who run a shop, 1 or 2 from a distributor or route, 1 expert) and at least 3 prototype walkthroughs. If we get fewer, say the real number in the pitch. Log everything in `docs/research.md`: date, role (not full name), where we found them, what they said, one quote, what we changed.

**Where to find people**
- Salvadoran restaurants (pupuserías) and shops in Toronto, Waterloo and Kitchener. Owners often ran or know a tienda back home. Visit or call.
- Facebook and WhatsApp groups: search "emprendedores El Salvador", "tiendas El Salvador", "tenderos El Salvador".
- LinkedIn: route, sales and credit managers at Salvadoran distributors of drinks, snacks or dairy.
- Researchers: FUSAI Observatorio MYPE, FLACSO El Salvador, CONAMYPE.
- UW Latin American student groups. (Only Yahya contacts the challenge advisors: #17.)
- Ask everyone for two more names.
- Reddit only for leads (it skews middle class).
- Tests with local corner-store owners count for "is it easy to use", not as proof of the El Salvador problem. Label them that way.

**First message (Spanish)**
> ¡Hola! Somos cuatro estudiantes de la Universidad de Waterloo, en Canadá. Estamos diseñando una aplicación para que las tiendas de barrio en El Salvador puedan pagarles a sus proveedores sin manejar tanto efectivo, y comprar mercadería a crédito sin tener que recurrir a prestamistas. ¿Tendría 15 minutos para una llamada por WhatsApp y contarnos cómo funciona su tienda o su ruta de reparto? No vendemos nada, solo queremos aprender de su experiencia. ¡Muchas gracias!

*English:* Hi! We're four students at the University of Waterloo in Canada. We're designing an app so neighbourhood shops in El Salvador can pay their suppliers without handling so much cash, and buy stock on credit without turning to loan sharks. Would you have 15 minutes for a WhatsApp call to tell us how your shop or delivery route works? We're not selling anything; we just want to learn from your experience. Thank you!

**Questions for people who run a shop**
1. ¿Cómo les paga a los camiones o repartidores que le traen mercadería? *How do you pay the trucks that bring your stock?*
2. ¿Cada cuánto le visita cada proveedor, y más o menos cuánto le compra por visita? *How often does each supplier come, and roughly how much do you buy each time?*
3. ¿Algún proveedor le da crédito o le fía? ¿Por cuántos días? *Does any supplier give you credit? For how many days?*
4. ¿Alguna vez ha pedido prestado para comprar mercadería? ¿A quién, y cuánto le costó? *Have you ever borrowed to buy stock? From whom, and what did it cost?*
5. ¿Tiene cuenta de banco o billetera en el celular? ¿Dónde deposita o paga sus recibos? *Do you have a bank account or a phone wallet? Where do you deposit money or pay bills?*
6. Si pudiera pagar su deuda en un punto de pago, como cuando paga la luz, con un número de referencia, ¿tiene uno cerca? ¿Cuál? *If you could repay at a payment point, like paying the power bill, with a reference number, is there one near you? Which one?* (tests Risk #1, idea 1)
7. ¿Qué le haría probar pagar desde el celular? ¿Qué le preocuparía? *What would make you try paying from your phone? What would worry you?*

**Questions for distributors and route staff (motoristas o repartidores)**
1. ¿Cuántas rutas tienen, cuántas tiendas por ruta, y cada cuánto las visitan? *How many routes, how many shops per route, and how often do you visit?*
2. ¿Cómo entregan los motoristas el efectivo al final del día, y cuánto les cuesta en tiempo, transporte de valores o faltantes? *How do drivers hand in cash at the end of the day, and what does it cost in time, cash transport or shortfalls?*
3. ¿Les dan crédito a las tiendas? ¿Qué pasa cuando una paga tarde? *Do you give shops credit? What happens when one pays late?*
4. Si le pagaran al momento de la entrega, sin riesgo de que la tienda no pague, ¿pagaría 1.5% de la venta? ¿Y 0.25% si ustedes asumen el riesgo? *If you were paid at delivery with no risk of the shop not paying, would you pay 1.5% of the sale? And 0.25% if you carried the risk?*
5. ¿Podrían recibir dólares digitales y pasarlos a su cuenta de banco? ¿Qué les preocuparía? *Could you receive digital dollars and move them to your bank account? What would worry you?*

**Prototype walkthrough (5 minutes, video call or in person)**
1. Say: "Es una versión de prueba con dinero falso. Estamos probando la aplicación, no a usted." *This is a test version with fake money. We're testing the app, not you.*
2. Send the link. Give one task at a time and stay quiet while they try:
   - "El camión acaba de entregar. Pague su pedido." *The truck just delivered. Pay for your order.*
   - "Esta semana le falta efectivo. Compre a crédito." *You're short on cash this week. Buy on credit.*
   - "Le pagó al motorista en efectivo. Regístrelo." *You paid the driver in cash. Record it.*
3. Ask: What was confusing? Would you trust it? What would stop you from using it? What would you change?
4. Write down where they hesitated, one quote, and what we'll change.

---

## 14. Advisor questions and judge questions

**For advisors (Mon Nov 9) and the Technical Workshop (Tue Nov 10)**
1. Which Stellar anchors or partners do cash-in and cash-out in El Salvador, and what do they charge per $100?
2. Can people or businesses in El Salvador hold tokenized Treasuries (Etherfuse USTRY, Ondo USDY, Franklin BENJI)?
3. Who could be our licensed partner for the lender pool and for paying distributors into a bank?
4. Is our contract design sensible: one contract, each role signing its own transactions, a short credit period for the demo?
5. What's the best wallet setup for shop owners on cheap phones: passkeys, SMS links, something else?

**What the advisors said (Mon Nov 9)**
- **Our startup advisor** (a startup founder): the tech is believable; judges will ask about go-to-market. Partner with banks and cash-in/cash-out companies that already have a reputation in El Salvador, and cold-email them about Stellar (a real reply would stand out). State assumptions clearly and argue for them. Lead with market size, backed by transaction counts times our fee. Show it's a real business.
- **Our technical and finance advisor** (finance): pick a name; build our own credit record and know what El Salvador's credit bureaus are called; know what a DUNS number is in case asked (most tiendas won't have one); lead with the worldwide number, then El Salvador's; have a 30-second answer to "how do you make money?"; say KYC/KYB; show one slide of real contract code; delivery decides it.
- **Our corrections:** don't compare to MoneyGram's 5% (that's a cross-border fee, and Transfer365 is free); compare to loan sharks (about $35 per $100) versus $0 for shops. The $0.75 buffer is our own number. The $30 wallet bonus and fuel discounts our startup advisor mentioned were Chivo perks from 2021: don't use them.

**What judges will probably ask** (practise 20-second answers)
- *How do you make money (30 seconds)?* Distributors pay us, shops never do: 0.1% of every invoice paid in cash or digitally, plus 0.25% of each "pay in 7 days" sale (inside the 1.5% credit fee, so the distributor gets $98.50 per $100), built into a public contract.
- *How do you get into El Salvador?* One distributor's route first, with the distributor funding the pool itself, so the first phase needs no outside lender. Then a licensed lender for the pool and a registered partner for digital dollars, then a second distributor on the same shops (§7.7). The leading distributor alone serves 24,000 clients (facts 54), and the distributors' association already works with the government on tiendas (55).
- *Why not just Transfer365 and a database?* Transfer365 only moves money between bank accounts, and about half of small businesses don't have a bank relationship. It doesn't do credit, invoice matching or driver cash records. One distributor's database isn't a record other distributors and lenders can trust. Our contract enforces the credit rules and fee split in the open, settles in seconds, and Stellar describes its fees as under a cent, and lets lenders fund a pool directly.
- *How does a shop get digital dollars?* Risk #1, said first. The counters already exist: banks run 8,900 correspondent points, and lenders like CrediCampo already take loan payments through Tigo Money's agents (facts 41, 44). The shop pays cash there with a reference number, and a licensed partner credits it in digital dollars (§6 ideas 1, 13 and 14). Banked shops pay by Transfer365, which is free (idea 6). Not solved yet: signing that partner (idea 15).
- *Who are the lenders?* A test account in the demo. For real, a licensed microfinance institution or cooperative. We're not the lender.
- *What if a shop doesn't pay?* Small limits that grow, no new credit while overdue, a truck that keeps coming back, and a default buffer.
- *Isn't 1.5% a week expensive?* Per year it's about 79%, and the shop pays none of it. The distributor chooses it to be paid at the door with no risk of default, so it's factoring plus insurance. A cheaper fee for shops it trusts is planned (PR #139), not built yet. Suppliers already give up about 37% a year with standard early-payment discounts (facts 52, 56).
- *How are you different from Rocket and Tienda Pago?* §10.
- *Have real users tried it?* The exact numbers from `docs/research.md`, and one thing we changed because of them.
- *Is it legal?* Shops pay no interest. The distributor pays a fee to be paid early. A licensed lender funds the pool and does KYC, and a partner registered with the CNAD handles the digital dollars; one Salvadoran bank already is registered (facts 46, 47). We know the interest caps (highest 96.88% a year, entry 49) and the 2024 data law (50), and a lawyer confirms the structure before launch (§11.1).
- *Why Stellar?* USDC is native, and El Salvador already uses dollars. Payments settle in seconds, and Stellar describes its fees as under a cent. Anchors connect to cash. Soroban enforces the credit rules. Fee sponsorship and passkeys hide the crypto.
- *What about privacy?* No names on-chain, details off-chain, batching later. The off-chain data follows El Salvador's 2024 data protection law (facts 50).

---

## 15. How we work

- **Repo:** public from day one (judges need it). Board columns: Backlog, This week, In progress, In review, Done. Labels: contract, app, setup, business, research, pitch, team, learning, bug, risk-1, blocked.
- **Issues:** one task each, one owner, a due time, a "Done means" list. Since Nov 9 the issues are the plan, written so an AI can follow them: paste the whole issue into your AI with this file.
- **Branches and pull requests:** one branch per issue (like `12-cash-confirm`); the PR says "Closes #12"; PRs stay small and get merged daily. **Reviews:** Yahya reviews every PR; Jack reviews Yahya's. Since Nov 10, Yahya's PRs wait for Jack's approval: the admin bypass is a rare exception, not the habit. Docs-only work can be done on github.com: open the file, click the pencil, then "Create a new branch for this commit and start a pull request".
- **AI chats:** one per workstream. Contract, app and deploy (Yahya, Claude Code); scripts, safety review and pitch documents (Jack); small helper cards (Ruhaan, Codex); outreach and facts (Rohan). Start each one by pasting the issue and attaching this file. When a chat leads to a decision, add it to §16 in a PR. Never paste secret keys into a chat.
- **Check-ins:** a 9 PM text every day (Done / Next / Blocked); in person Wed Nov 11, 5 to 7 PM; a 20-minute call Thu Nov 12 at 9 PM for the one-pager.
- **Notion:** skipped. GitHub covers it.

---

## 16. Decisions log

| Date | Decision |
|---|---|
| Nov 3 | Space 1 (savings, credit, inflation resilience). Space 2 ruled out. |
| Nov 5 | Payments between El Salvador's neighbourhood shops and their distributors (the team's own idea; it replaced the Mexico tanda). |
| Nov 5 | Work in GitHub (repo, board, docs) with one AI chat per workstream. Skip Notion. No long generated reports. |
| Nov 6 | Domestic only, El Salvador first. No cross-border or diaspora money. Other countries only on a "future" slide. |
| Nov 6 | "RUTA" was a placeholder name; we won't use it. |
| Nov 12 | Name: **Relay**, tagline *Paga tu ruta* under it (Yahya). Repo renamed to `yahyahashme/relay`; URLs say "relay" only. |
| Nov 13 | English version of every screen, with an ES / EN switch in the top banner (Yahya). Spanish stays the default; the choice is saved per phone, and `?lang=en` opens a link in English. Write new screen text as `t("español", "English")` (`lib/i18n.tsx`); server and contract messages stay Spanish and are translated on screen by `lib/translate.ts`, whose test fails if a message has no English. The WhatsApp reminder stays in Spanish, because it goes to the shop. |
| Nov 13 | Mi cuenta (#127): money, credit, suppliers, details, security, notifications and help, with "how it will work" screens for sign-in backup, devices and trusted contacts. Payment history per shop (#136) from contract events (about a week back) plus invoices. Relay score (#137, `lib/credit.ts`): 0-100 from on-time record (50%), limit use (20%), length (20%) and suppliers (10%), shown with its top reasons; "Compartir mi historial" makes a read-only link (anyone with it can see it; signing it is a later step), nothing is shared without it. Past-due or written-off debt caps the score. Starting limit from a trade reference waits for distributor-added shops (#132/#134). |
| Nov 6 | Design: invoices with due dates; pay now, cash recorded with two taps, or pay in 7 days; the contract tracks paid, part-paid and due, and blocks double payment. |
| Nov 6 | Cash allowed at delivery only, always recorded, doesn't build credit. No discount for paying digitally. |
| Nov 6 | Credit: full price, no interest, due by the next delivery (7 days at most), limits that grow, nothing new while overdue. |
| Nov 6 | A lender pool pays the distributor at delivery; the shop repays the pool. |
| Nov 6 | Three options per shop: pool covers ($1.50 per $100), distributor covers (about $0.25), distributor's own money ($0). |
| Nov 6 | Our cut: a 0.05% to 0.1% usage fee on every invoice, paid by distributors, the same for cash and digital, plus a share of credit fees. It replaces the per-truck fee. Shops never pay; no cut of savings. |
| Nov 6 | Risk #1 (cash to digital dollars) goes in every doc, with the ideas log. |
| Nov 6 | Savings and Treasury yield are stretch goals, with a simulated token in the demo. |
| Nov 6 | This file is our single context doc. Build plan adopted. One contract recommended (Jack can split it if needed). |
| Nov 9 | Product form: a mobile web app on our own public contract, not a native app or a feature in someone else's wallet. |
| Nov 9 | New roles: Yahya all code-heavy work and all UI; Jack light backend plus the one-pager, slides, trifold and deck; Ruhaan about 3 h of small non-UI helpers; Rohan outreach and sourced facts only. The plan moved into the GitHub issues. |
| Nov 9 | Market size: $2B a year from distributors to El Salvador's neighbourhood shops (Conamype estimate, via Diario El Salvador; see the fact-sheet row below). Never use the unsourced $7B. Lead with a worldwide number first. |
| Nov 9 | Fact sheet (#50): every number now lives in `docs/facts.md`. Corrections: 85,265 is "shops and small retailers" (about 50,133 tiendas proper); the $2B is a Conamype estimate, not the Distribución Dinámica study; 62.2% is informal small businesses; say "most" women-owned, not 85%. |
| Nov 9 | Compare our cost to loan sharks (about $35 per $100), never to MoneyGram's 5%. |
| Nov 9 | Contract fees: 0.1% usage fee on every invoice; 1.5% credit fee paid by the distributor (0.75 buffer, 0.50 lenders, 0.25 us). Limits start at $200 and grow $25 per on-time repayment, up to $500: our own credit record. |
| Nov 9 | MIT licence removed; the code is all rights reserved (#48). |
| Nov 9 | Reviews: Yahya reviews every PR; Jack reviews Yahya's. |
| Nov 9 | The deploy script moved from Jack to Yahya, so Yahya's work waits only on Jack's setup script (#15). |
| Nov 10 | Credit sales pay no usage fee: the distributor gets $98.50 per $100 (one 1.5% fee; our 0.25% is inside it). The limit grows only after a $40+ cycle, once per credit period; late repayment drops it $25. The buffer covers defaults 4 credit periods late (`cover_default`), and only approved distributors can invoice. |
| Nov 10 | Only Yahya contacts the advisors (our startup advisor and our technical and finance advisor), with at most two follow-ups each (#17). |
| Nov 10 | Yahya's PRs wait for Jack's review before they merge; the admin bypass is a rare exception, not the habit. |

---

## 17. Rejected ideas

| Idea | Why not |
|---|---|
| Mexico "fair tanda" savings circle | Replaced by the El Salvador idea |
| Space 3 framing, cross-border, diaspora funding ("Proxy Vault", "Vostro-as-a-Service") | We're Space 1 and domestic; the buzzwords didn't hold up |
| Philippines | No confirmed Stellar PHP anchor; GCash already offers USDC and bonds |
| India, Pakistan | No rupee anchor on Stellar |
| A discount for paying digitally | We can't count on distributors funding it; margins are thin |
| A fee on each payment | It would push people back to cash |
| Charging shops interest or fees | Breaks the no-interest promise; interest-cap risk |
| A monthly per-truck fee | Replaced by the usage fee, which grows with use |
| An inflation-protection angle | El Salvador uses the US dollar |
| A Bitcoin or Chivo angle | Bitcoin became optional, Chivo reached 8.1% of people, and "crypto" puts people off |
| "Cheaper transfers" as the pitch | Transfer365 is already free |
| Our own secure cash ATMs | About $5k each, plus cash rules and safety; partner with banks and cash-in companies instead (Nov 9) |
| A native app, or a feature inside another wallet | Install friction and no time; we can't change other companies' wallets (Nov 9) |
| Comparing our fee to MoneyGram's 5% | That's a cross-border fee; we're domestic and Transfer365 is free (Nov 9) |
| The name "RUTA" | Placeholder only |
| Notion | Nobody knows it well; GitHub covers it |
| Long generated reports | Not useful; keep docs short and practical |

---

## 18. Glossary

**Stellar**
- *Account and keypair:* an address (public key, starts with G) and a secret key that signs. Whoever has the secret key controls the money.
- *XLM:* Stellar's own coin, used for tiny network fees and to keep accounts open.
- *Testnet:* Stellar's practice network with fake money. *Friendbot* gives out free test XLM.
- *Asset or token:* anything issued on Stellar, like USDC (digital US dollars issued by Circle).
- *Trustline:* an account's "yes, I accept this asset" setting, needed before it can hold the asset.
- *Memo:* a short note on a payment, like an invoice number.
- *Soroban:* Stellar's smart contracts, written in Rust. A contract is a program on the network that holds rules and money.
- *Contract ID:* the address of a deployed contract (starts with C). Judges use it to check our build.
- *SAC (Stellar Asset Contract):* lets contracts move a normal Stellar asset.
- *SEP:* a Stellar standard. SEP-41 is the token interface (`approve`, `transfer_from`, used for auto-pay). SEP-24 is how apps talk to anchors for deposits and withdrawals. SEP-7 is payment links.
- *Anchor:* a licensed business that swaps cash or bank money for tokens on Stellar and back.
- *Path payment:* a payment that converts one asset into another on the way, in one step.
- *Fee sponsorship (fee bump):* someone else pays the network fee, so users don't need XLM.
- *Passkey wallet:* a wallet you unlock with your fingerprint or face, with no seed phrase.
- *RPC and Horizon:* the servers apps use to read from and send to Stellar. RPC is the one for contracts.
- *Event:* a log entry a contract writes when something happens; the dashboard can read it.

**Finance**
- *Trade credit:* take goods now, pay the supplier later.
- *With recourse / without recourse:* whether the seller must repay the lender when the buyer doesn't pay.
- *Factoring:* a business sells its unpaid invoices to get cash now, for a small fee. Our pool works like this.
- *Default:* a borrower never pays. *Default buffer:* fee money set aside to cover defaults.
- *Credit limit:* the most a shop can owe at once.
- *Yield:* what money earns while it sits somewhere.
- *Treasury bill:* a short loan to the US government; very safe, small yield. *Tokenized Treasuries* are tokens that track them.
- *Interest cap (usury law):* the legal maximum interest rate.
- *KYC:* "know your customer", checking someone's ID before giving financial services.
- *Cash-in and cash-out (on-ramp and off-ramp):* turning cash into digital dollars, and back.

**Spanish we use**
- *Tienda (de barrio):* neighbourhood shop. *Tendero:* shopkeeper.
- *Motorista, repartidor:* driver, delivery person. *Ruta:* delivery route.
- *Fiado / fiar:* sold on credit / to sell on credit. *Prestamista, usurero:* loan shark.
- *MYPE:* micro y pequeña empresa, a micro or small business.

---

## 19. Sources

**Problem and market**
- Market size: 85,265 shops and small retailers and about $2B a year from distributors (Conamype's Paul Steiner and the Distribución Dinámica study, Diario El Salvador, Feb 27, 2026): https://diarioelsalvador.com/dedinero/la-seguridad-impulso-el-crecimiento-de-las-tiendas-de-barrio-en-un-23/763705
- FUSAI and ASOMI loan-shark study (El Diario de Hoy, Jul 24, 2026): https://www.eldiariodehoy.com/negocios/microempresas-el-salvador-dependen-prestamos-usureros/86923/2026/
- CIOPS 2019 survey of 1,285 merchants (Revista E&N, Sep 9, 2019): https://www.revistaeyn.com/finanzas/el-salvador-mipymes-pagan-hasta-2628-de-interes-por-usura-HAEN1317303
- Mastercard and PCMI cash survey (El Mundo, Apr 10, 2025): https://diario.elmundo.sv/ampArticle/el-efectivo-es-principal-metodo-de-pago-para-80-de-las-pequenas-empresas-de-el-salvador?amp=1
- 46.9% with a savings account (BCR survey, via Revista E&N, Jan 7, 2026): https://www.revistaeyn.com/finanzas/inclusion-financiera-de-la-poblacion-de-el-salvador-es-casi-del-47-OG28841852
- Transfer365 moves over $4B a month (BCR data, El Diario de Hoy, Jan 12, 2026): https://www.elsalvador.com/dinero-y-negocios/entorno-economico/transfer365-servicio-transferencias-el-salvador/1258080/2026/
- Shop count split, 50,133 tiendas and 35,142 other retailers (Diario El Mundo, Mar 1, 2026): https://diario.elmundo.sv/economia/en-el-salvador-hay-mas-de-300-pupuserias-que-tambien-funcionan-como-tiendas
- Every other source, with exact quotes: `docs/facts.md`
- Interest-cap law and the 1.6× rule (FLACSO opinion piece, El Mundo, Oct 21, 2025): https://diario.elmundo.sv/opinion/la-ley-contra-la-usura-en-el-salvador-entre-la-proteccion-formal-y-la-exclusion-real-del-credito-mype
- Average loan rates in April 2026 (El Mundo, May 19, 2026): https://diario.elmundo.sv/economia/tasas-de-intereses-de-prestamos-en-el-salvador-mostraron-reduccion-en-abril
- Bitcoin law change (Jan 30, 2025): https://www.centralamerica.com/news/el-salvador-bitcoin-law-changes
- Remittances in 2025: https://elsalvadorinfo.net/northern-triangle-remittances-jump-20-in-2025-to-nearly-48-billion/ and as a share of GDP: https://dinero.com.sv/en/economy/remittances-equivalent-to-24-of-gdp-confirm-el-salvadors-high-economic-dependence/
- About 70,000 shops (USDA El Salvador Retail Foods Annual; replaced by the 85,265 figure above). 51.5% of small businesses with no formal financial relationship: FLACSO El Salvador and FUSAI. Both were cited in our first draft; find the exact links before putting them on the one-pager.

**Competitors and precedents**
- Rocket (Microsoft, 2022): https://news.microsoft.com/es-xl/rocket-pos-la-app-que-impulsa-pequenas-tiendas-hacia-la-digitalizacion-de-sus-negocios/
- Tienda Pago (Emprendedor, Dec 2021): https://emprendedor.com/no-necesitas-usar-efectivo-esta-fintech-ayuda-a-los-minoristas-a-comprar-su-mercancia/
- Tienda Pago raises $7.5M (ImpactAlpha): https://impactalpha.com/tienda-pago-raises-7-5-million-for-super-short-small-business-loans/

**Risk #1 and cash-out**
- Crypto firms and bank access in El Salvador (Cointelegraph, Feb 2025): https://cointelegraph.com/news/bitcoin-crypto-firms-move-to-el-salvador-but-success-rides-on-banking-access
- MoneyGram cash to USDC on Stellar: https://blog.moneygram.com/cash-to-crypto

**Yield**
- Etherfuse stablebonds: https://support.etherfuse.com/articles/5206274464-available-stablebonds and the FAQ: https://docs.etherfuse.com/stablebonds/stablebonds-faq
- Stablebonds on Stellar (Stellar blog): https://stellar.org/blog/foundation-news/global-bonds-local-impact-stablebonds-on-stellar
- Tokenized Treasury yields in 2026: https://eco.com/support/en/articles/15210582-top-tokenized-treasury-funds-2026-buidl-ousg-usdy-benji-compared

**Stellar and the challenge**
- Stellar docs: the links in §4.
- Challenge Notion (Yahya's copy), Stellar Dev Discord https://discord.gg/stellardev, velocity.events@uwaterloo.ca.

---

## 20. Notes for Claude sessions

- In Yahya's Claude project this file also lives at `/mnt/project-files/el-salvador/team-context.md`. Update it there and in the repo; don't create new docs.
- Call each teammate by name (Yahya, Jack, Ruhaan, Rohan). We're first-years, new to finance and blockchain: plain language, everyday examples, one-line definitions.
- Keep answers short. No long reports. Work in rounds: ask a few questions, then build on the answers.
- Stress-test before proposing anything: who pays and why, each side's incentive, late payment and defaults, timing, competitors in El Salvador, cash-in and cash-out, and phone access. Label guesses as guesses.
- Risk #1 goes in every doc. Add any new idea to §6 with the date.
- Stay in Space 1, domestic El Salvador only. Don't bring back anything in §17 unless asked.
- Use general examples, not teammates' hometowns.
- Never ask for or paste secret keys.
- Since Nov 9 the plan lives in the GitHub issues (owner, due time, "Done means"). Check them before suggesting tasks, and keep the roles in §3.1.
