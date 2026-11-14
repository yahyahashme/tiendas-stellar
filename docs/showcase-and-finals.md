# Showcase and finals plan (#43, #44, #45)

Written Thu Nov 12 evening; updated late that evening for the product name (Relay, "Paga tu ruta") and the new live URL. These three issues are events, so this file is a plan to follow, not something to finish. Each "Done means" at the bottom needs evidence from the day itself. Fill in every `Who: ____` cell as a team. Nobody is assigned here.

**Marks used below.** "source: issue #43" means the fact is copied from that issue. "our suggestion" means we made it up to be useful and Velocity has not said it. "not known yet" means no issue, doc or page we have says it.

## 1. Dates and places (copied from the issues)

| When (ET) | What | Source |
|---|---|---|
| Mon Nov 16, arrive by 4:00 PM | Project Showcase. Setup 4:00, judging 4:30 to 7:00. Innovation Arena, 280 Joseph St, Kitchener. All four attend. | issue #43 |
| Tue Nov 17, 11 AM to 1 PM | Finalist pitch prep, **Top 8 only**. Same place as the showcase. All four attend if we are in. | issue #44 |
| Wed Nov 18, **10:00 AM** | Final deck upload, no changes after. | issue #45 |
| Wed Nov 18, 5:00 to 7:30 PM | Finals: 3-minute pitch plus 3 minutes of questions. All four attend. | issue #45 |

**Not known yet:** how and when Velocity tells us we are in the Top 8; the order of teams and what time we must arrive on Wed; how long each judge spends at our table on Mon; whether the venue gives us a table, an easel, power or Wi-Fi. Ask velocity.events@uwaterloo.ca (subject "Blockchain Innovation Challenge Powered by Stellar") on Monday if nobody has said.

## 2. Mon Nov 16: Project Showcase (#43)

**What we do:** one person gives the 3-minute pitch with the 1-minute video inside it (context §3.8). A judge then scans the QR on the trifold with their own phone, pays as the shop, and watches the distributor dashboard on our laptop update. **If anything fails, play the video** (source: issue #43).

### State on `main` on Thu Nov 12

- The `/demo` route is on `main` (PR #70, hardened in #88). Each visit makes a new invoice for one of the three demo shops and sends the phone to it, so every judge pays their own invoice (`app/demo/route.ts`).
- The live app is **https://relay-sv.vercel.app** (README). The old https://tiendas-stellar.vercel.app only redirects there (HTTP 307), so do not print it.
- The QR image `public/qr-demo.png` was regenerated for the new URL (PR #102, merged). Decoded Thu Nov 12 evening with macOS CoreImage, from the file on `main`: it opens `https://relay-sv.vercel.app/demo`. **That checks the file, not the print: scan the printed QR once before Monday to check it opens `/demo`.**
- The contract was redeployed on Thu Nov 12 (PR #90). The contract ID is `contracts.routeLedger` in `config/testnet.json`.
- `docs/pitch.md` and the trifold files (`docs/trifold/`) are on `main` (PR #83, merged). The product name is decided: **Relay**, tagline **"Paga tu ruta"** (PR #100, `lib/brand.ts`, context §1). `[NAME]` became "Relay" in `docs/pitch.md` and `docs/trifold/trifold.html` in PR #107 (merged), so no name placeholder is left; the `[N]` ("what we heard") and phone screenshot placeholders are still open.

### Packing list

The first seven rows are the list in issue #43. The rest is our suggestion.

| Done | Item | What to check before leaving | Who: ____ |
|---|---|---|---|
| [ ] | Laptop and charger | Battery full. Opens `/distribuidor` full screen and shows the grey banner "Demo en testnet · dinero de prueba · cash-in simulado". Sleep and screen lock off. | |
| [ ] | Phones, charged, with the shop page open | At least two team phones, as a backup for a judge whose phone will not scan. Note: every visit to `/demo` makes a new invoice (the server allows 20 a minute), so do not open it again and again to "test". | |
| [ ] | The trifold with the demo QR | Board built (`docs/trifold-assembly.md`), QR tested on 3 phones. | |
| [ ] | The video, downloaded | The MP4 is on the laptop and on one phone, and plays with Wi-Fi off. The shot list is `docs/demo-video.md`. Whether the video is recorded yet: #35 (Yahya's) was still open on Thu Nov 12 evening, so treat it as not recorded until it closes. | |
| [ ] | A phone hotspot | Hotspot on and tested with the laptop before leaving. Name and password written on paper. | |
| [ ] | A printed QR code | At least two spare prints, at least 4 x 4 in with a white border (our size suggestion in `docs/trifold-assembly.md`). | |
| [ ] | Note-taker's notebook and pen, or a shared note | Every judge question is written down (issue #43 "Done means"). | |
| [ ] | Power strip or extension cord, a phone charger or power bank | Our suggestion. Venue power is not known yet. | |
| [ ] | Painter's tape, scissors, spare tape | Our suggestion, for the board and the printed QR. | |
| [ ] | The URL on paper | `https://relay-sv.vercel.app/demo`, for a judge who cannot scan. The same address the printed QR opens (decoded from `public/qr-demo.png`, see "State on `main`"). Not the old `tiendas-stellar` address: it only redirects. | |

### Mon morning, at home (our suggestion, from README "Before the showcase")

Use the laptop that ran `scripts/setup.sh`: it holds the test-dollar issuer. Yahya owns the shared deploy (README). Which laptop that is: ask Yahya.

| Done | Step | Who: ____ |
|---|---|---|
| [ ] | Check the contract still answers (`docs/security.md` section 5 says to do this before any demo; testnet can be reset, and contract data expires about 30 days after its last write). | |
| [ ] | Check each shop still has test dollars (each starts with $500) and top up if low. Steps 1 and 2 of README "Before the showcase". | |
| [ ] | Open `/tienda/cuenta/tienda-1`, `-2` and `-3` and tap "Pagar deuda" so every shop has credit available. | |
| [ ] | Make a test payment on your own phone through the printed QR. Watch the dashboard. This uses one invoice and one shop's test dollars, and that is fine. | |
| [ ] | Charge everything. Put the video, the board, the QR prints and the cables in one bag. | |

### Minute-by-minute: 4:00 to 7:00 PM

| Time | What | Who: ____ |
|---|---|---|
| By 4:00 | Arrive. Find our spot. Say hello to the Velocity staff and ask about power and Wi-Fi if we do not know. | |
| 4:00 to 4:10 | Stand the board up. Tape the spare QR somewhere easy to scan at arm's length. | |
| 4:10 to 4:20 | Laptop on power. Hotspot on, laptop joined. Open `/distribuidor` full screen. Check the banner and that the tiles load. | |
| 4:20 to 4:30 | Dry run: scan the printed QR with a team phone and pay with "Pagar ahora". The dashboard should change within about 5 seconds ("Se actualiza cada 5 segundos"). Play 10 seconds of the video on the laptop to check sound. Pitcher says the first 25 seconds out loud. | |
| 4:30 to 7:00 | Judging. Run the loop below for each judge. | |
| 5:30 | Reset check (5 minutes). Dashboard still up? Phones above 50%? Open each shop's cuenta page and tap "Pagar deuda" if a judge left a debt, so "Pagar en 7 días" is not greyed out. Is a shop low on test dollars? | |
| 6:15 | Second reset check, same list. Charge the laptop if it is under 50%. | |
| 7:00 | Judging ends. Take a photo of the board. Do not leave yet. | |
| 7:00 to 7:20 | Sit down and write every question you remember, with the judge's role (not name), while it is fresh. | |

**The loop for one judge (our suggestion; Velocity has not said how a visit works):**

1. Pitcher: the 3-minute pitch, standing at the board, with the video on the laptop.
2. Hand over the QR: "Scan this with your own phone. You are the shop." The judge pays with "Pagar ahora". Point at the laptop dashboard when the row changes.
3. Questions. The note-taker writes each one down, word for word, with the judge's role.
4. Thank them. Check the dashboard before the next judge.

**Showcase format:** play the full one-minute working-prototype video during the three-minute pitch. Offer the live QR demo after the pitch and keep the local video ready if the live demo fails. [Velocity's Devpost requirements](https://blockchain-stellar-ic.devpost.com/#requirements)

### If something fails

| What you see | Do this |
|---|---|
| No Wi-Fi or slow Wi-Fi | Laptop on the phone hotspot. The judge uses their own data. If the page does not open in 10 seconds, play the video. |
| The QR will not scan (glare, angle) | Use a spare printed QR, or hand over the URL on paper. |
| "No pudimos crear su factura" with "Intentar de nuevo" | Wait a few seconds and tap it. Several judges at once can take about 30 seconds (comment in `app/demo/route.ts`). If it fails twice, play the video. |
| A button spins for more than 10 seconds | Testnet is slow (`docs/demo-video.md`). Wait 10 seconds, then play the video. |
| "Pagar en 7 días" is greyed out | That shop owes money or the invoice is over its $200 limit. Tap "Pagar deuda" on `/tienda/cuenta/tienda-N`, or ask the judge to use "Pagar ahora". |
| The dashboard does not move | Reload `/distribuidor`. Check the payment screen shows the green "Pago recibido". |
| Nothing from the contract works at all | Play the video. Tell Yahya. Testnet may have been reset; the recovery steps are in `docs/security.md` and are Yahya's call, not something to run at the venue. |
| The laptop dies | Show the video on a phone. A second laptop with `/distribuidor` open is the real fix. |

### Showcase judges (by role; source: issue #43)

| Judge role | What to expect | Where our answer is | Who answers: ____ |
|---|---|---|---|
| SDF, Ecosystem | The issue gives no hint. Our guess: why Stellar and what we use of it. | context §14 "Why Stellar?"; `docs/facts.md` entries 36 and 37 | |
| SDF, Strategic Initiatives and Policy | **Regulation questions** (source: issue #43). | context §14 "Is it legal?"; `docs/facts.md` entry 18 (the interest-rate cap law); README "Demo vs real product" | |

## 3. Tue Nov 17: finalist prep, Top 8 only (#44)

**Bring** (source: issue #44, plus our suggestions marked):

- The deck draft from #41 (due Sun Nov 15, 11:59 PM), on the laptop and as a backup copy on a USB stick or in a shared folder (our suggestion).
- A laptop and a **note-taker** (issue #44).
- The video file, a charger, the pitch script `docs/pitch.md` (on `main` since PR #83; our suggestion), and the QR and the app on a phone (our suggestion).

**What happens:** a 3-minute pitch, then mentor feedback. **Write every comment down** (issue #44).

**The rule: update the deck that night.** Do not wait for Wednesday morning: the upload closes at 10:00 AM and nothing can change after it.

### Notes template for mentor feedback

The repo is public. Write mentors **by role only** here (for example "SDF mentor", "startup mentor"). Keep names in your own notes.

Pitch time on the day: `m:ss`. Pitcher: `____`. Note-taker: `____`.

| # | Mentor (role only) | What they said (their words) | Slide or part | Act on it? (yes / no / ask) | Change to make | Who: ____ | Done |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | [ ] |
| 2 | | | | | | | [ ] |
| 3 | | | | | | | [ ] |
| 4 | | | | | | | [ ] |
| 5 | | | | | | | [ ] |

**Questions they asked that we answered badly:** `____`

### That night (our suggestion)

1. Note-taker types the table above into the group chat before anyone leaves the building.
2. Decide as a team which comments to act on. Fewer, bigger fixes beat many small ones.
3. Make the changes in a copy of the deck. Keep the Sunday draft as it was.
4. Any new number gets an entry in `docs/facts.md` before it goes on a slide.
5. Re-time the pitch once with a stopwatch. It must stay under 3:00.
6. Post the new file in the group chat. Run the pre-upload checklist in section 4 on it the same night, and again in the morning.

## 4. Wed Nov 18: upload by 10:00 AM, finals at 5:00 PM (#45)

**Upload:** the [upload form](https://airtable.com/apprwC5wqwb4We3jo/paghYqabHAh8pDtac/form) (link from issue #45). Use Velocity's template, as a **PowerPoint** file, **no animations**, **no changes after** the upload. Jack uploads (context §2).

### Timeline

| Time | What | Who: ____ |
|---|---|---|
| Tue night | Deck updated from the mentor notes (section 3). | |
| Wed, by 9:00 AM (our suggestion) | Pre-upload checklist below, done together, with the file open on a second laptop. This leaves an hour of slack before the deadline. | |
| Wed, before 10:00 AM | Upload. Take a screenshot of the form's confirmation. Save the exact uploaded file and post it in the group chat with the time. | |
| Wed, afternoon | Pitch out loud twice with a timer. Q&A practice with the judge-role list below. | |
| Wed, before 5:00 PM | Arrive early (our suggestion; the arrival time is not known yet). Laptop, charger, the video file, a phone hotspot. | |
| 5:00 to 7:30 PM | Finals. 3-minute pitch, then 3 minutes of questions (source: issue #45). | |

### Pre-upload checklist

Run this on the file you are about to upload, not on the draft.

- [ ] **Every number has a `docs/facts.md` entry.** Read each slide and write the entry number next to each number. A number with no entry: take it out, or add the entry in a PR first. Nothing from the "Never use" list at the top of `docs/facts.md`.
- [ ] **"$35 per $100" says "2019 survey"** wherever it appears (facts entry 10).
- [ ] **Any contract ID equals `contracts.routeLedger` in `config/testnet.json`.** Compare character by character, on the slide and on any image such as the code slide. Do not copy an ID from an old doc. As of Fri Nov 13 evening the live ID is `CAGCZ3I7…` (the #139 redeploy; `config/testnet.json` and the README table). `docs/img/code-slide.png` and `docs/demo-video.md` on `main` still show the previous one (`CDHDZX7V…`) until PR #163 merges; answer 6 of the submitted `docs/one-pager.md` keeps it on purpose, with a note from #163. Check again after any redeploy.
- [ ] **No advisor names** anywhere, including slide notes. Roles only ("our startup advisor", "our technical and finance advisor").
- [ ] **Fee sponsorship is worded as built, and no more.** Say "our sponsor account pays the network fees" (#113). Not "gasless", not "users never need XLM" (the demo accounts hold test XLM), and no passkeys: they are not built.
- [ ] **No placeholders left:** search the file for `[`, `]`, "TBD", "PENDING" and `[NAME]`.
- [ ] **The name and the URL are the new ones:** "Relay" with "Paga tu ruta" under it, and https://relay-sv.vercel.app. Search for "Tiendas", "tiendas-stellar" and "Nombre pendiente": none may appear.
- [ ] **No animations and no transitions** on any slide. Format is PowerPoint (`.pptx`), made from the Velocity template.
- [ ] **The file opens on a second laptop, in PowerPoint itself** (not only Google Slides): fonts, images and layout look the same.
- [ ] Screenshots in the deck: the grey demo banner is readable, and there is no secret key (starts with S), no `.env` text and no phone number on screen.
- [ ] The words "blockchain", "wallet" and "crypto" do not appear on any app screenshot (context §3.5).
- [ ] The pitch still fits in 3:00 with this deck.
- [ ] Questions put to Velocity before Wed, with answers written here: does the video play at the finals; is the template 16:9; may the deck hold backup slides after slide 8 for questions; do we present from our laptop or from the uploaded file. (From `docs/deck-outline.md`, "Open questions".) Answers: `____`

### Finals judges (by role and organisation; source: issue #45)

Questions get 3 minutes in total. Whether all four judges ask, or just some, is not known yet. Decide who answers what before Wednesday.

| Judge role | What to expect | Where our answer is | Who answers: ____ |
|---|---|---|---|
| SDF Senior Developer Advocate | **Contract questions** (source: issue #45). | `docs/security.md`; `contracts/route_ledger/src/lib.rs`; context §8.2; `docs/facts.md` entries 29 to 35 | |
| Stellar ecosystem, founder of Stellarlight.xyz | The issue gives no hint. Our guess: how we use Stellar (USDC, Soroban, anchors) and why Stellar. | context §14 "Why Stellar?"; `docs/facts.md` entries 36 to 38 | |
| SDF Payment Partners | **Risk #1 questions**: how cash becomes digital dollars (source: issue #45). | README "Risk #1"; context §6; `docs/research.md` (partner outreach, merged in #89) | |
| Stellar Ecosystem Impact | **Impact questions** (source: issue #45). | context §9; `docs/facts.md` sections 1 to 12; what we heard from real people: `docs/research.md` (the walkthroughs, #30, are not logged yet) | |

## Done means (copied from the issues)

- [ ] #43: pitch delivered; judges' questions written down in `docs/pitch.md`. Evidence: `[commit or PR link]`
- [ ] #44: feedback written down; deck updated. Evidence: `[notes link, deck link]`
- [ ] #45: deck uploaded by 10 AM; we pitched. Evidence: `[form confirmation screenshot]`
