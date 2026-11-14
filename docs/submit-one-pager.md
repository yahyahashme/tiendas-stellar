# Submitting the one-pager: Thursday call and Friday form (#31)

The form decides the Top 16. It closes **Fri Nov 13, 8:30 AM ET**. We read and fix the one-pager on the **Thu Nov 12, 9:00 PM** call, and Jack submits by 9:30 PM so Friday morning is only a spare. **Nothing has been submitted.**

**Checked on Thu Nov 12 (evening) against** `origin/main` at `67f265f`: `docs/one-pager.md` (merged in #64), `docs/facts.md`, `docs/research.md`, `config/testnet.json`, `README.md` and `contracts/route_ledger/src/lib.rs`. Merged since the first draft of this page: #64 (the one-pager), #72 (advisor calls log), #73 (worldwide number), #84 (fact sheet entries 29 to 40) and #90 (the redeploy). **Run the checker yourself and don't trust any count written here.** When last run on `67f265f` it gave 4 FAILs: the old contract ID in answer 6 (finding 1) and the three form fields (team number, team name, Devpost link). People fill the form fields, not a script. Every FAIL it prints must be fixed or consciously accepted (say why out loud on the call). If the one-pager changes again, run the script (section 6) again.

## 1. What has to be true before 9 PM

| What | Who | By | Why it matters |
|---|---|---|---|
| Answer 6 has the new contract ID | Jack | before the call | The redeploy landed in #90: `config/testnet.json` and the README table on `main` now hold `CDHDZX7V…`. Answer 6 on `main` still has the old `CAPQ6ZDD…` until the separate one-pager PR (branch `31-one-pager-new-id`) merges. If it isn't merged by the call, paste the full ID by hand from `config/testnet.json` (finding 1). |
| Team name chosen (#26 is closed) | Everyone | before the call | Form field 2 can't say "TBD". The name is not in the repo yet: the one-pager says TBD and `lib/brand.ts` on `main` still says "Nombre pendiente". Say the name in the chat. |
| Production URL (#28 is closed); Yahya posts the URL in the chat (#28 step 5) | Yahya | Thu 8:30 PM | Answer 6 has the URL. The README on `main` links the same one (https://relay-sv.vercel.app). Answer 6 must use the exact URL Yahya posts. |
| 2 or 3 phone screenshots (pay now, pay in 7 days, cuenta page) posted in the chat (#25 step 7; #25 is closed) | Yahya | Thu 8 PM | #31 step 3. Have them saved on Jack's computer before the call, in case the form takes a file (finding 9). |
| Rohan confirms the count in answer 6: "2 advisor calls, and emails to 4 banks and a supermarket chain" | Rohan | before the call | The 2 advisor calls are in `docs/research.md` on `main` (#72). The five emails dated Nov 10 (four banks, one supermarket chain) are logged only in PR #89, which is open. Recount if he sent more. Honest numbers only (finding 5). |
| A teammate who didn't write them opens the links in `docs/facts.md` entries 36 to 40 and confirms each quote | Any teammate | Before the call | They are on `main` (#84) and back the Stellar, MoneyGram and delivery-crew sentences. Each entry still says "Checked: Pending". Checklist item 4. |
| Someone looks at MoneyGram's coverage map for El Salvador and confirms cash-in is not offered | Yahya or any teammate | Before the call | Answer 6 says "as far as we found". Nobody has checked the map by eye. Checklist item 3. |
| Devpost project exists, or we know whether field 7 is required | Yahya | Thu 9 PM | Field 7 is still TODO (#36 is open). |
| Team number | Jack | on the call | Field 1 is "pick our number from the form's list". |

Already done, checked on `origin/main`: #64 (the one-pager is `docs/one-pager.md`), #73 (entry 22, the $5.7 trillion, is in `docs/facts.md`), #84 (entries 36 to 40 are in `docs/facts.md`) and #90 (the redeploy; issue #52 is closed).

## 2. Findings from the number check

The check is `scripts/check-one-pager.mjs` plus the table in section 3. Severity: **HIGH** can embarrass us in front of a judge, **MED** needs a source or a cut (#31 step 2: "fix anything without a source, or cut it"), **LOW** is cleanup. Findings marked **DONE** were applied in the one-pager in #64 (on `main`): nobody re-applies them on the call. The rest are still open.

| # | Sev. | Where | Problem | Proposed fix |
|---|---|---|---|---|
| 1 | HIGH | Answer 6 | **The contract ID in answer 6 is the old one.** The redeploy landed in #90 (merged Thu Nov 12): `contracts.routeLedger` in `config/testnet.json` and the README table on `main` now hold `CDHDZX7V…`. Answer 6 on `main` still says `CAPQ6ZDD…`, the first deploy's contract, which the app no longer uses. A judge who looks up that ID finds the wrong contract. | The ID in answer 6 must be `contracts.routeLedger` from `config/testnet.json`. A separate PR (branch `31-one-pager-new-id`) does that. If it isn't merged by the call: run `git fetch origin && git merge origin/main`, then paste the full ID from `config/testnet.json` into answer 6 by hand (never from memory or an old chat message). The script FAILs while the old ID is in answer 6, and also FAILs if this checkout's `config/testnet.json` differs from `origin/main`'s, so merge main first. Check by eye too. **If you can't settle which ID is live, drop the ID and write "contract ID in our README"** (the README table has it). |
| 2 | HIGH | Answer 6 | **Wording DONE in #64; one check still open.** It was "MoneyGram covers cash-out only", which was not established. It now says "MoneyGram lists cash-out points in El Salvador but, as far as we found, not cash-in." That matches what we saw (Yahya's Nov 7 locator check). But moneygram.com/stellar says "Cash-out is available in 170+ countries and territories and cash-in in 25+ countries", and our reading that El Salvador is cash-out only comes from the page's HTML, not from a person looking at the coverage map (`docs/facts.md` entry 38; `docs/context.md` §6 source check, Nov 12). | **A person opens MoneyGram's coverage map for El Salvador and confirms cash-in is not offered** (checklist item 3). If cash-in IS offered, the sentence must change (section 7). Yahya did the Nov 7 check, so he is the natural person. |
| 3 | MED | Answer 5 | **DONE in #64.** It was "Stellar settles in seconds for a fraction of a cent", with no source. It now says "Stellar says payments finalize in about five seconds, with fees under a cent." That is Stellar's own claim and the sentence says so; sources are in the section 3 table and `docs/facts.md` entries 36 and 37 (links not yet opened by a teammate: checklist item 4). | Nothing to apply. Keep "Stellar says". Never state a precise dollar fee: Stellar's own dollar figures for fees disagree. |
| 4 | MED | Answer 5 | **DONE in #64 (cut), but see finding 11.** "Shops pay trucks in cash, with no record of who collected what" is gone. It had no El Salvador source (entry 11 covers four countries), and the "no record" half was our own assumption. | Don't put it back as fact. If we say it, say "we think". The sentence that replaced it needs a check: finding 11. |
| 5 | MED | Answer 6 | **Mostly DONE in #64; one count still needs its owner.** The four `[N]` and "(from docs/research.md)" are gone. Answer 6 now says "2 advisor calls, and emails to 4 banks and a supermarket chain in El Salvador". The 2 advisor calls are in `docs/research.md` on `main` (#72). The emails are logged only in PR #89 (open, not merged). The one-pager's own check table notes that the log's pitch line says "6 banks and cash-in companies", because it also counts Jack's Nov 11 email to a Davivienda colleague. | Rohan says "confirmed", or recounts if he sent more. If he can't, **cut the clause** "and emails to 4 banks and a supermarket chain in El Salvador" (answer 6 stays in range) and don't write a count nobody logged. |
| 6 | LOW | Answers 5 and 6 | **DONE in #64.** Both answers now say "public" Soroban contract and "public contract", not "open" (#48 removed the MIT licence, so "open" could read as "open source"). The same change turned "digital dollars (USDC)" into "test dollars" in answer 5. | Nothing to apply. |
| 7 | LOW | Answer 6 | "Rohan studies FARM" and "three engineers (software, two computer)" come from Yahya's comment on #64. The one-pager's number check table still says "to confirm". | Rohan and Yahya say "confirmed" on the call. |
| 8 | LOW | Answer 4 and 5 | "7 days": the contract takes the credit period at deploy time. The default is 604,800 s (7 days); `CREDIT_PERIOD_SECS=120` makes the fast "overdue" demo copy. `scripts/deploy.sh` only rewrites the README table when the period is the default (lines 168 to 171), and #90 did change the README, so the final deploy used 7 days. | Yahya says "confirmed" out loud. The one-pager says 7 days. |
| 9 | INFO | Form | #31 step 3 says to add the live URL and 2 or 3 phone screenshots (#25 step 7), but the one-pager has no screenshot field (questions 1 to 7). | On the call, open the form: if a field takes a file or link, use it. If not, the screenshots go to Devpost (#36) and the trifold (#37), and step 3 is only the URL. |
| 10 | INFO | Answer 5 | The $5.7 trillion line is Rohan's opening line (#51), now in `docs/facts.md` entry 22 (#73). He may reword it by Sat noon, after we submit. | Whatever we submit is final. Make the trifold, the pitch and the video say the same words, or change them on purpose. |
| 11 | MED | Answer 5 | **New sentence, sources not yet checked by a person.** #64 replaced the cut "shops pay trucks in cash" line with "Delivery crews in El Salvador have been robbed and extorted." Sources: El Diario de Hoy, 23 Jul 2024 (cash robbed from a delivery-truck employee, one case from 2023); Brown, Montero, Schmidt-Padilla and Sviatschi, Review of Economic Studies (drivers meet a gang representative before delivering; extortion payments, data 2012 to 2019); `docs/facts.md` entry 40 (#84). The robbery is one reported case and the study's data is old. | Rohan (or a teammate) opens both links and confirms the quotes (checklist item 4). **If nobody can in 2 minutes, cut the sentence.** |

On `67f265f` the checker gives answer 4 at **20** words, answer 5 at **149** and answer 6 at **142**, the same as the one-pager's Word counts table. Answers 5 and 6 fit 120 to 150. Answer 5 has 1 word of room, so cut something before adding anything. Swapping in the new contract ID doesn't change answer 6's count (an ID is one word).

## 3. Number to source table

"On `main`" says whether the source is merged. Entries are `docs/facts.md` entries.

| Number or claim | In | Source | On `main`? | Verdict |
|---|---|---|---|---|
| about $5.7 trillion credit gap | 5 | Entry 22 (IFC and SME Finance Forum, 2019 data); opening line approved in #73 | Yes (#73) | OK. A gap, never our market. |
| more than 50,000 neighbourhood shops | 5 | Entry 3 (50,133); "Say this" table | Yes | OK |
| about $2 billion a year, "(Conamype estimate)" | 5 | Entry 1 | Yes | OK. Keep the attribution. |
| 6 in 10 informal small businesses borrowed from loan sharks | 5 | Entry 9 (62.2%) | Yes | OK. "Informal" must stay. |
| about $35 per $100 (2019 survey) | 5 | Entry 10 | Yes | OK. The year must stay. |
| "Shops pay trucks in cash, with no record of who collected what" | 5 (cut) | None for El Salvador (entry 11 is regional); the "no record" half is our assumption | n/a | **Done: cut in #64** (finding 4). Don't put it back as fact. |
| two taps | 5 | Context §7.1; contract `cash_claim` and `cash_confirm` | Yes | OK |
| 7 days | 4, 5 | Context §7.3; `deploy.sh` default | Yes | OK, **finding 8** |
| limit up to $500 | 5 | `LIMIT_CAP` = $500 (`lib.rs:34`); `docs/credit-model.md` | Yes | OK |
| 1.5% fee, 0.25% ours, 0.1% of other invoices | 5 | `CREDIT_FEE_BPS` 150, `OUR_BPS` 25, `USAGE_FEE_BPS` 10 (`lib.rs:20-28`); context §5; entry 29 | Yes | OK. No usage fee on credit sales. |
| "Stellar says payments finalize in about five seconds, with fees under a cent" | 5 | developers.stellar.org ("Ledgers close in ~5 seconds, and their transactions are final when they do"); stellar.org/solutions/cross-border-payments ("network fees under a cent"); entries 36 and 37 | Yes (#84) | **Done in #64** (finding 3). Stellar's own claim, so it says "Stellar says". Links not yet opened by a teammate (checklist item 4). |
| Delivery crews in El Salvador have been robbed and extorted | 5 | El Diario de Hoy, 23 Jul 2024 (one robbery of a delivery-truck employee, 2023); Brown, Montero, Schmidt-Padilla and Sviatschi, Review of Economic Studies (data 2012 to 2019); entry 40 | Yes (#84) | Not a number. **Finding 11**: sources not yet checked by a person. |
| Rohan studies FARM; three engineers | 6 | Yahya's comment on #64 | n/a | **Finding 7** |
| contract in answer 6: `CAPQ6ZDD…` today, should be `CDHDZX7V…` | 6 | `contracts.routeLedger` in `config/testnet.json` and the README table (#90) | Yes (#90) | **Finding 1** |
| https://relay-sv.vercel.app | 6 | Same URL as the README on `main` (the Nov 12 HTTP 200 check is in the contract row below) | Yes (README) | OK. Open it again on the call, on a phone, in a private window. |
| 2 advisor calls | 6 | `docs/research.md` "Advisor calls (Nov 9)" | Yes (#72) | OK |
| emails to 4 banks and a supermarket chain in El Salvador | 6 | Partner outreach log in PR #89 (`docs/research.md`): five emails dated Nov 10, four banks and one supermarket chain | **No, PR #89** | **Finding 5.** Rohan says "confirmed". |
| "MoneyGram lists cash-out points in El Salvador but, as far as we found, not cash-in" | 6 | Context §6: Nov 7 locator check (cash-out points) and Nov 12 source check (page data only); entry 38 | Yes (#84, #64) | Wording **done in #64**. The coverage-map check is still open (**finding 2**, checklist item 3). |
| first-year Waterloo students | 6 | Context header | Yes | OK |
| KYC on shops and KYB on distributors by a licensed partner; repay weekly like a bill | 6 | Context §6 and §11, a plan | Yes | OK. Both are worded as "our plan". |

## 4. The call: Thu 9:00 to 9:30 PM

Jack shares the screen with the one-pager open and the script already run.

| Time | What |
|---|---|
| 9:00 to 9:03 | Jack runs `git fetch origin && git merge origin/main`, then `node scripts/check-one-pager.mjs --online docs/one-pager.md`. Read out the FAILs: each gives its line. Compare the URL with the one Yahya posted. Open the form and check for new fields or limits. |
| 9:03 to 9:13 | **Read the three answers aloud**, one per person: Yahya answer 5, Rohan answer 6, Ruhaan answer 4. Whoever stumbles marks the line. |
| 9:13 to 9:20 | **Number check.** Go down section 3. Each "to confirm" is cleared by its owner saying "confirmed", or the number is struck. **No source after 2 minutes means cut it.** Apply the open findings: 1 (the contract ID), 2 (the map check), 5, 7, 8 and 11. |
| 9:20 to 9:25 | **Fill the form fields:** team number, team name, the four members, the Devpost link or "n/a". |
| 9:25 to 9:30 | One last read of the exact text as it will be pasted. Rerun the script with `--online`: every FAIL fixed or consciously accepted, said out loud. Jack submits. |

**Rules for the call:** "Don't wait for perfect" (#31). Fix and move on, don't rewrite. A number that can't be confirmed is cut, never kept with "about". Only Yahya contacts the advisors.

## 5. Checklist (Jack): before pressing Submit (Thursday night, or Friday morning if we slip)

1. **Open the form fresh.** Check for new questions, new limits or a closing-time change.
2. `git fetch origin && git merge origin/main`, then `node scripts/check-one-pager.mjs --online docs/one-pager.md`: **every FAIL fixed or consciously accepted** (the three form fields, team number, team name and Devpost link, are filled by people, not by the script). It checks for "(to confirm)" markers, `[brackets]`, TODO or TBD, word counts in range, contract ID equals `config/testnet.json` and that file equals `origin/main`'s, and every URL answers 2xx. Also check by eye that the URL is the one Yahya posted in the chat.
3. **Look at MoneyGram's coverage map for El Salvador, by eye** (moneygram.com/stellar, in a browser: it may return 403 to a script, and the FAQ answer may show collapsed). Confirm cash-in is NOT offered there. Answer 6 says "as far as we found, not cash-in", which comes from the page's data, not from a person. **If cash-in IS offered, that sentence must change before you submit** (section 7).
4. **Confirm `docs/facts.md` entries 36 to 40 have had their links opened by a teammate**, each quote matching its page. They back the Stellar, MoneyGram and delivery-crew sentences in answers 5 and 6, and each still says "Checked: Pending". A link that doesn't match its quote means cutting or softening that sentence.
5. **Contract ID (the redeploy landed in #90):** after `git fetch origin && git merge origin/main`, confirm the ID in answer 6 equals `contracts.routeLedger` in `config/testnet.json` and the ID in the README table (`CDHDZX7V…` at the time of writing). Read all three by eye as well as trusting the script. If answer 6 still says `CAPQ6ZDD…`, the separate one-pager PR (branch `31-one-pager-new-id`) hasn't merged: paste the full ID by hand and run the script again.
6. **Open the app on a phone in a private window** (not a team phone if you can): the home page loads, one payment works.
7. **Open the contract on stellar.expert** (`https://stellar.expert/explorer/testnet/contract/<ID from answer 6>`). It shows our contract and recent events, not "not found".
8. **Paste as plain text**, one answer at a time, from between the `<!-- qN -->` markers (not the markers). Check that `$`, `%` and `'` came through.
9. **Pick the team number and the four members.** If a member isn't in the picker, use the "cannot find someone" box.
10. **Submit once.** If the page errors, don't resubmit blindly: look for a confirmation email or message first. Still stuck: velocity.events@uwaterloo.ca, subject "Blockchain Innovation Challenge Powered by Stellar".
11. **Screenshot the confirmation** and post it in the group chat (this is #31's "Done means").
12. **Record what we sent:** a small PR "Record the submitted one-pager" that adds a section "Submitted on <date and time>" to `docs/one-pager.md` with the exact pasted text. Judges and the pitch then match what is on file.

## 6. The script

```
node scripts/check-one-pager.mjs                     # docs/one-pager.md (on main since #64)
node scripts/check-one-pager.mjs path/to/file.md     # any copy of the one-pager
node scripts/check-one-pager.mjs --online            # also git fetch origin main, and opens each URL, expects 2xx
```

The script is in PR #87. Run it from a checkout that has both the script and the one-pager: this branch after `git fetch origin && git merge origin/main`, or `main` once #87 is merged. If `docs/one-pager.md` is missing, you haven't merged `origin/main`.

- **FAIL** (exit code 1): word count outside the target (question 4 about 20, questions 5 and 6: 120 to 150), a "(Rohan to confirm)" marker, a `[placeholder]`, TODO or TBD (also in the team number, team name and Devpost fields), a file path like `docs/research.md`, anything on the "never use" list ($7B, 70,000 shops, Chivo, MoneyGram's 5%, $5B as our market, "85,265 neighbourhood shops" alone, "62% of small businesses"), a contract ID that isn't `contracts.routeLedger` in `config/testnet.json`, a `config/testnet.json` that differs from `origin/main`'s (a redeploy you haven't merged), the test USDC token ID instead of our contract, a string shaped like a secret key.
- **WARN**: "open" contract, "audited", passkeys, the MoneyGram "only" claim, "fraction of a cent".
- Findings about a marker, placeholder, claim or ID give the line number in the file. A marker or `[N]` is one FAIL each, so three markers are three FAILs.
- It counts words the way the one-pager's "Word counts" table does (split on spaces, markers excluded, `[placeholders]` counted). On `67f265f` it gives 20, 149 and 142, the same as the one-pager's table.
- It does not decide what is true. It cannot see whether a number is right, only whether it is marked, sourced and in range. Sections 2 and 3 are the part a person has to do.

## 7. If something goes wrong

| What | Do this |
|---|---|
| The script still FAILs on the contract ID in answer 6 after you merged main | The one-pager PR with the new ID (branch `31-one-pager-new-id`) isn't merged. Paste the full `contracts.routeLedger` ID from `config/testnet.json` into answer 6 by hand and run the script again. If you can't tell which ID is live, drop the ID and write "contract ID in our README". |
| Rohan can't confirm the outreach count | Cut the clause "and emails to 4 banks and a supermarket chain in El Salvador". Don't write a number nobody logged. |
| The form changed (new field or a limit) | Fit the answer to the limit, don't cut sources. Post the change in the chat. |
| The form won't submit | Try another browser, then another person. Then the Velocity email in section 5. |
| 9:30 PM and not submitted | Keep going. Friday 8:30 AM ET is the hard stop. |
| MoneyGram's map shows cash-in offered in El Salvador | The answer 6 sentence is wrong: change it before submitting to say only what the map shows, and tell Yahya (he did the Nov 7 check). Keep answer 6 within 120 to 150 words. The Risk #1 notes in `docs/context.md` section 6 then need updating too, after the form is in. |
| A link in `docs/facts.md` entries 36 to 40 doesn't match its quote | Cut or soften the sentence it backs (Stellar speed and fees, MoneyGram, delivery crews). |
| A number can't be confirmed | Cut it. |
