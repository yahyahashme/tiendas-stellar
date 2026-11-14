# Sunday Nov 15 tracker (#39, #40, #41)

Written Wed Nov 11. Refreshed Fri Nov 13 evening against GitHub (`gh pr view`, `git log origin/main`), after PRs #82, #83, #89, #103, #104, #113, #119, #125, #126 and #139 merged (the last three at 7:26 to 7:36 PM ET): the blockers table and the statuses below are as of that evening. **The "as of" notes below go stale: update the status column, don't trust it.** Status is one of: `not started`, `in progress`, `blocked`, `done`.

## The three deliverables

| Issue | What | Owner | Due | Time | Needs first | Working files | Status |
|---|---|---|---|---|---|---|---|
| #40 | Print and assemble the trifold | Jack, anyone free helps | Sun 6:00 PM ET | about 2 h | #37 layout (Sat) | `docs/trifold-assembly.md` | in progress: the layout (`docs/trifold/`, both fold versions) is on `main` with the QR for relay-sv (PR #102), the name (PR #107), the three real phone screenshots and the diagram with the fee-sponsorship line (PR #119, merged Fri Nov 13; both previews pass the checks, text share 15.6% and 15.0% against a 25% limit). Yellow boxes left: `[N]`, `[N]` and `[what we changed]`, which wait on the count of people we spoke to (see the "what we heard" row). The print shop shortlist is in `docs/trifold-assembly.md` section 8 (only two Staples stores list Sunday hours, and Staples' wide-format limit is 24 x 36 in). No shop chosen (nobody has phoned), board not measured, nothing printed. The computer that prints must run `SCALE=2 node docs/slides/render.mjs` before `node docs/trifold/render.mjs`, because `architecture@2x.png` is git-ignored. |
| #39 | Five timed run-throughs | Everyone | Sun | about 2 h | #37 pitch script (Sat), #35 video (Sat) | `docs/run-throughs/`, `scripts/run-times.mjs` | not started: the script is `docs/pitch.md` on `main` (PR #83, merged); its own timing table puts it at about 2:55 with the full video (259 spoken words at 140 words a minute, so about 5 seconds of room, before the `[N]` line is filled). The video is not recorded (#35 is open), no pitcher is written down, and `docs/run-throughs/log.csv` has no runs yet. |
| #41 | Finals deck draft | Jack | Sun 11:59 PM ET | about 1.5 h | #37 (Sat), #56 slides (Sat) | `docs/deck-slides.md` (the text), `docs/deck-outline.md` (sources, screenshot steps) | in progress: the 8 slides' text is on `main`, refreshed for the name Relay and the relay-sv URL (PR #103, merged Thu Nov 12). The code slide was re-rendered with the new contract ID in PR #82, but #139 changed the contract again (new ID `CAGCZ3I7…`): the image on `main` still shows the previous ID until PR #163 merges. The three phone screenshots are on `main` (PR #119), taken before #125 and #126 changed the shop screens. A draft `.pptx` on the organisers' template exists on Jack's laptop only: it is not in the repo, not shared, and not yet opened in PowerPoint. Still open: `[N]` and `[one thing]` (#30), our ask, the pitcher, and sharing the file where all four can open it. |

**Done means, copied from the issues** (tick them here when the evidence exists):

- [ ] #40: board built, QR tested on 3 phones, photo in the group chat. Evidence: `[photo link]`
- [ ] #39: five run-throughs under 3:00. Evidence: `node scripts/run-times.mjs` prints `[x]`.
- [ ] #39: weak answers rewritten in `docs/pitch.md`. Evidence: the same command prints `[x]`.
- [ ] #41: draft saved and shared in the group chat. Evidence: `[deck link]`

## Capacity check

Hours planned for Sun Nov 15 in context §3.1: **Yahya 5, Jack 4, Rohan 3, Ruhaan 0.** (Rechecked Wed Nov 11: the plan has not changed, so the table below still stands. The #41 estimate is unchanged too; with the slide text written, most of it is now pasting into the template and capturing screenshots.)

| Person | Sunday load from the issues | Hours planned | Gap |
|---|---|---|---|
| Jack | #40 (2 h) + #41 (1.5 h) + #39 (2 h) = 5.5 h | 4 h | **1.5 h over** |
| Ruhaan | #39 (2 h, he is an assignee) | 0 h | **2 h over** |
| Yahya, Rohan | #39 (2 h each) | 5 h, 3 h | fine |

Ways to close the gap (the team picks one; none is decided):
- Start the deck on Saturday night once #37 is final. It reuses the trifold content.
- Ask Yahya or Rohan to help assemble the trifold while Jack starts the deck.
- Run #39 with three people, and write down Ruhaan's hours if he can join.

## Suggested order for Sunday

1. **#40 first.** It has the earliest deadline (6:00 PM) and depends on the print shop's hours, which we don't know yet. Target: board finished by 4:00 PM.
2. **#39 when all hands are free.** It needs the pitcher, the video, and at least one asker and one timekeeper. Aim to finish all five runs in one sitting and fix weak answers straight after.
3. **#41 last.** It is due at 11:59 PM and reuses the trifold text. Weak answers from #39 may change a slide, so doing it after the run-throughs saves rework.

| Time block | Who | What |
|---|---|---|
| `[ ]` | | |
| `[ ]` | | |
| `[ ]` | | |

## What is blocking us (as of Thu Nov 12 evening, from GitHub)

Rows that start "Cleared" are merged and stay in the table so the history is visible. Delete them once nobody needs them.

| Blocker | Affects | Where it stands |
|---|---|---|
| Team name | #41 slide 1, #39, trifold title | **Cleared.** Decided Nov 12: **Relay**, tagline **Paga tu ruta** (PR #100, merged; `lib/brand.ts`, context §1). `[NAME]` became Relay in `docs/pitch.md` and `docs/trifold/trifold.html` in PR #107 (merged), so nothing is left to do for the name. |
| Pitcher | #39, #43, #45 | **Open.** #26 is closed and no pitcher is written in the repo or on the issue. Ask in the group chat who the pitcher is, then put the first name in `docs/run-throughs/log.csv` for each run. |
| Pitch script v1 | #39, #41, #40 | **Cleared.** PR #83 (#37) merged Thu Nov 12: `docs/pitch.md` and `docs/trifold/*` are on `main`. `[NAME]` is gone (PR #107 made it Relay; its "Open items" rows 2 and 6 now say the name is done and the QR opens relay-sv). It still has the `[N]` placeholders (see the "what we heard" row). |
| Worldwide number, expansion path | #41 slides 2 and 6 | **Cleared.** PR #73 (#51) merged Thu Nov 12: facts entries 22 to 28 are on `main`. |
| Our fees and safety numbers in the fact sheet | #41 slides 5 and 6, #39 answers | **Cleared.** PR #84 (#61) merged Thu Nov 12: facts entries 29 to 35 are on `main`. Entries 36 to 40 (Stellar speed, fees, MoneyGram, legal tender, delivery crews) are on `main` too. Entries 41 to 56 are on `main` too (PR #95, merged Thu Nov 12), and so is entry 57 (advisor calls, PR #116). Entries 58 and 59 (the outreach count, fee sponsorship) are in PR #159, which is open. |
| Demo video | #39 (needs the real video), #41 slide 3 | PR #77 (the shot list, `docs/demo-video.md`) merged. The redeploy is merged, so Yahya can record now. The video is Yahya's (#35, Sat): the issue is still open, so treat it as not recorded. `docs/demo-video.md` now shows the new contract ID (checked against `config/testnet.json`) and the relay-sv URL. |
| Final contract ID on the code slide | #41 slide 5, trifold if it shows code | **Open until #163 merges.** PR #82 merged Fri Nov 13, but then #139 (sliding fee, merged 7:36 PM ET) redeployed the contract: the ID in `config/testnet.json` and the README is now **`CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML`**. `docs/img/code-slide.png` on `main` still shows the previous ID (`CDHDZX7V…`, read by eye on Fri Nov 13). PR #163 re-renders the image with `CAGCZ3I7…` (also read by eye); use it only after #163 merges, and compare the image's ID with `config/testnet.json` character by character. The three code blocks on the slide (the overdue, over-limit and pool checks) are still in `lib.rs` on `main`. The other ID on paper, `docs/demo-video.md`, is fixed in #163 too; answer 6 of the submitted one-pager keeps the earlier ID on purpose (#163 adds a note). **Still open:** Yahya confirms the code shown is what is deployed. |
| Live app URL and QR code | #40 QR, #41 slide 3 | **Cleared.** The live URL is **https://relay-sv.vercel.app** (README). tiendas-stellar.vercel.app only redirects to it (HTTP 307). `public/qr-demo.png` was regenerated in PR #102 (merged); decoded Thu Nov 12 evening with macOS CoreImage from the file on `main`, it opens `https://relay-sv.vercel.app/demo`. Yahya said to print that one. Still to do: scan the printed QR on 3 phones (#40). Also on paper: https://relay-sv.vercel.app/demo (`docs/showcase-and-finals.md`). |
| Real phone screenshots | #41 slide 3, trifold middle panel | **Cleared.** PR #119 (merged Fri Nov 13) added `docs/trifold/img/shop-pay.png`, `shop-credit.png` and `driver-cash.png`, captured from the live app. `docs/screenshots/` still holds only the Nov 10 mock: don't use it. **Recapture due.** #126 (tap shield on the pay buttons, new logo) and #125 (ES / EN switch) merged at 7:26 and 7:27 PM ET on Fri Nov 13, after #119. Both changed the shop's pay screen (`invoice-screen.tsx`); #125 also changed the driver's route screen. Compare the three images with the live app and recapture with the steps in `docs/deck-outline.md` if they differ (we have not compared them). |
| "What we heard from N people" | #41 slide 7, trifold right panel | **Open, and there is no N yet.** `docs/research.md` holds the advisor calls and the partner outreach log (#89, merged), but no conversation with a shop owner or a distributor. PR #152 (open) logs 12 messages sent (7 WhatsApp requests to shops and distributors, 5 emails to nonprofits) and 0 interviews. Messages sent are not people we spoke to, and advisors are not users. The walkthroughs (#30) are open and not logged. Yahya's rule on #61: "0" means cut the line, not say 0. |
| Fee sponsorship wording | #41 slide 4 | **Done.** #113 merged Nov 13 and turned sponsorship on (#81 is closed); #119 put the line back on the diagram. It can be claimed, worded as in `docs/pitch.md` section 3. The deck slide's three lines don't mention it (the diagram does). |
| Partner replies and Risk #1 evidence | #39 Risk #1 answers, #41 slide 6 | PR #89 (#10, partner outreach log and the anchor check) merged Fri Nov 13 and #10 is closed. The log shows 5 emails on Nov 10 (4 banks and a supermarket chain) with no reply beyond one auto-reply, and 16 more on Nov 12 that are not confirmed sent. The related research PRs merged Thu Nov 12: #95 (facts 41 to 56), #96 (what cash-in costs today), #97 (laws we touch), #98 (the 1.5% fee in yearly terms) and #99 (first customer pilot plan, a proposal). |
| Board and print shop | #40 | Board: not known yet. Print shop: the shortlist is in `docs/trifold-assembly.md` section 8. Only two Staples stores list Sunday hours, and Staples' wide-format limit is 24 x 36 in, so a 36 x 48 in print on Sunday is not confirmed. Jack must call. |
| Our ask, and whether the video plays at the finals | #41 slide 8 and timing | No answer in our notes (see `docs/deck-outline.md`, "Open questions"). |

## After Sunday

- The packing list, minute-by-minute plan, notes template and pre-upload checklist for all of these are in `docs/showcase-and-finals.md` (PR #104, merged).
- Mon Nov 16, 4:00 to 7:00 PM: Project Showcase, Innovation Arena, Kitchener (#43).
- Tue Nov 17, 11 AM to 1 PM: finalist prep (Top 8 only). Bring the deck and a note-taker (#44).
- Wed Nov 18, 10:00 AM: final deck upload, no changes after (#45).
- Wed Nov 18, 5 to 7:30 PM: finals, a 3-minute pitch plus 3 minutes of Q&A.

## How to keep this useful

- Change a status the moment it changes, and put the evidence link in the box above.
- Run `node scripts/run-times.mjs` after every run-through. Don't average times in your head.
- If something here is wrong or out of date, fix this file in a small PR rather than leaving a note in the chat.
