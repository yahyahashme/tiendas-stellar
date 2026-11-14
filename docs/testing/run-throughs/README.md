# Run-through logs (#39)

Two CSV files, one row each time something happens, so the "Done means" lines of #39 can be checked instead of remembered:

- `log.csv`: one row per timed run of the 3-minute pitch.
- `qa-log.csv`: one row per judge question asked and answered.

Then run `node scripts/run-times.mjs` for the summary. It needs only Node.

**Done means (from #39):** five run-throughs under 3:00, and weak answers rewritten in `docs/pitch/pitch.md`. The summary prints both as checked or unchecked.

## How to run a run-through

1. The pitcher presents standing, with a phone timer running. Play the full 60-second demo from the start. One person is the timekeeper and writes down the time at each segment break (the six segments below).
2. The others then ask judge questions one at a time (the list below). Each answer should take 20 seconds or less. The asker grades it and the timekeeper logs it.
3. Add the rows straight after the run, while it is fresh. Don't average in your head.
4. For every weak answer, set `weak` to `yes`. Fix the wording in `docs/pitch/pitch.md`, then set `fixed_in_pitch_md` to `yes`.

## `log.csv` columns

| Column | What to write |
|---|---|
| `run` | 1 to 5, then 6 and up if you repeat a run |
| `date` | `2026-11-15` |
| `pitcher` | first name |
| `timer` | who held the timer |
| `total` | the whole run, `m:ss` (for example `2:52`) or seconds (`172`) |
| `problem`, `built`, `video`, `pays`, `risk`, `close` | the time each segment took, `m:ss` or seconds. Leave them empty if you only timed the total. |
| `video_played` | `yes` if the complete demo video played from the start, otherwise `no` |
| `notes` | anything that went wrong. Wrap text with commas in double quotes. |

**Segment budgets** (from context §3.8 and the #37 draft, PR #83; they add up to 3:00):

| Column | Part of the pitch | Budget |
|---|---|---|
| `problem` | 0:00 to 0:25, the problem | 25 s |
| `built` | 0:25 to 0:55, what we built and why Stellar | 30 s |
| `video` | 0:55 to 1:55, the video | 60 s |
| `pays` | 1:55 to 2:30, who pays | 35 s |
| `risk` | 2:30 to 2:50, Risk #1 and what users told us | 20 s |
| `close` | 2:50 to 3:00, the close | 10 s |

If the segment boundaries change in `docs/pitch/pitch.md`, change the budgets in `scripts/run-times.mjs` too.

## `qa-log.csv` columns

| Column | What to write |
|---|---|
| `run` | the run it followed |
| `question_id` | `Q1` to `Q8` from the list below, or `Q9` and up for a new one (write it in `notes`) |
| `asked_by`, `answered_by` | first names |
| `seconds` | how long the answer took. Over 20 is too long. |
| `clarity`, `accuracy` | 1 (poor) to 5 (great), from the asker. Accuracy is checked against `docs/facts.md`. |
| `weak` | `yes` or `no`. Say `yes` if either score is 3 or lower, or the answer ran long. |
| `fixed_in_pitch_md` | `yes` once the better wording is in `docs/pitch/pitch.md`, otherwise `no`. Leave empty if not weak. |
| `notes` | what was wrong, or the better line |

**The questions** (from #39; context §14 has a starting answer for most):

| ID | Question |
|---|---|
| Q1 | How do you make money? (30-second answer) |
| Q2 | How do you get into El Salvador? |
| Q3 | How does a shop get digital dollars? (Risk #1) |
| Q4 | What if a shop doesn't pay? |
| Q5 | Is it legal? (interest-rate cap, KYC/KYB) |
| Q6 | Why Stellar, and not Transfer365 plus a database? |
| Q7 | What do El Salvador's credit bureaus already cover? Do tiendas have DUNS numbers? |
| Q8 | Have real users tried it? |

Answer facts only from `docs/facts.md` (entries 15 to 18 cover Q5 and Q7, entry 14 covers Q6). At the finals there are 3 minutes of Q&A, so about 8 answers fit if each is 20 seconds.
