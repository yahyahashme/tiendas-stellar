# Trifold print and assembly (#40)

Scaffold written Wed Nov 11; updated Thu Nov 12 late evening for the name (Relay) and the live URL. This is the checklist and the spec; the content of the board is in `docs/pitch.md` (#37) and the print file is `docs/trifold/trifold.html`, both on `main` since PR #83. Fill in the blanks as we learn them.

**Deadline:** Sun Nov 15, 6:00 PM ET, with a photo of the finished board in the group chat. **Owner:** Jack, and anyone free helps. **Time:** about 2 h of assembly, plus the print shop's turnaround.
**Needs first:** the print-ready layout from #37 (Sat Nov 14). **Then:** the showcase is Mon Nov 16 (setup 4:00 PM, judging 4:30 to 7:00 PM, Innovation Arena, 280 Joseph St, Kitchener).

## 1. Board spec

| Item | Spec | Status |
|---|---|---|
| Board | Tri-fold, 36 x 48 in (the size #40 names) | **Do we have one?** If not, email velocity.events@uwaterloo.ca, subject "Blockchain Innovation Challenge Powered by Stellar". Ask early. |
| Panels | Velocity's board, measured Nov 14: 27 in tall, folding 9 + 19 + 9 in. Each panel fits a 24 x 36 in poster print. | 9 + 19 + 9 in |
| Title | **Relay**, with **Paga tu ruta** under it (decided Nov 12, PR #100; context §1). The board title already says Relay in `docs/trifold/trifold.html` and `docs/pitch.md` on `main` (PR #107, merged; no `[NAME]` is left). `node docs/trifold/render.mjs --final` passes with no yellow left (Sat Nov 14, #40): the "what we heard" panel was cut (the team has spoken to 0 people, and a zero means the line is cut, #61) and the three phone screenshots were retaken from `main`. | done (PR #107; yellow cleared Nov 14) |
| Type sizes | Title about 96 pt, headings 30 to 40 pt, body 24 to 32 pt (Velocity's tips) | from context §3.8 |
| Text share | At most 25% of the board is text | check on the real layout |
| Message | Two key points only. Sketch on paper, and have someone outside the team read it first. | from context §3.8 |
| Layout | Left: the problem. Middle: how it works (3 phone screenshots, the QR code). Right: who pays and why, our plan, where we go next, Risk #1. ("What we heard" is cut: 0 conversations.) | from context §3.8 and the #37 draft |

## 2. Print spec

| Item | Spec | Status |
|---|---|---|
| File | The print-ready layout from #37, as a PDF if the shop accepts it. Keep one copy in the shared folder and post the link in the group chat. | `[link]` |
| Size | Decide with the shop: one print per panel, mounted on the board, or one large print. Per-panel prints are easier to align and to replace if one is wrong. | `[decided: ___]` |
| Image sharpness | Our PNGs in `docs/img/` are 1920 x 1080 px. Placed 12 in wide that is 160 pixels per inch; placed 24 in wide it is only 80, which will look soft. Re-render the architecture diagram and the code slide at 2x or 3x for print (the render script draws at 1x: change `--force-device-scale-factor=1` in `docs/slides/render.mjs`). Text should stay as text in the PDF, not a picture. | **Done Sat Nov 14:** `SCALE=2 node docs/slides/render.mjs` writes `architecture@2x.png` (3840 x 2160, 226 pixels per inch in layout A, 265 in B); the phone screens are 185 (A) and 285 (B) and the QR 240 and 261. Every picture is over 150. Text is text in the PDFs, with the fonts embedded. Re-run both commands on the printing computer if anything changes. |
| Finish | Ask the shop: matte or gloss. Gloss shows glare under showcase lights. | ask |
| Proof | Ask for a small proof or check the PDF at 100% before the full print. | ask |

## 3. The QR code

| Item | Spec | Status |
|---|---|---|
| Points to | **https://relay-sv.vercel.app/demo** (Yahya, in his review of PR #104: print this one). The README names https://relay-sv.vercel.app, and `public/qr-demo.png` was regenerated for it in PR #102 (merged). Decoded Thu Nov 12 evening with macOS CoreImage, from the file on `main`: it opens `https://relay-sv.vercel.app/demo`. The old https://tiendas-stellar.vercel.app only redirects there (HTTP 307): do not print it. | `[final URL: https://relay-sv.vercel.app/demo]` |
| Order | Make the QR **last**, after the URL is final. A QR that points at an old URL fails silently. The URL is final now, so use `public/qr-demo.png` as it is on `main`; do not regenerate it unless the domain changes again. | |
| Size | Our suggestion: at least 4 x 4 in with a clear white border, and a test from arm's length (about 1 m). Not a standard, so the phone test below decides. | |
| Caption | "Scan to try it. Live on Stellar testnet with test dollars." | |

## 4. Questions for the print shop (Sat)

Call or email at least two. Write the answers in the table in section 7. Shops to call first: the shortlist in section 8.

1. Are you open Sunday, and until what time? Last time for pickup?
2. How long does a 36 x 48 in print (or three panel prints) take? Can it be ready by Sunday morning?
3. What file do you want (PDF, size, resolution, bleed)? Where do we send it?
4. Matte or gloss, and what paper? Does it curl or stay flat for mounting?
5. Total cost, and how do we pay?
6. Do you sell foam board or spray adhesive for mounting, in case we need it?

## 5. Timeline (working back from Sunday 6:00 PM)

| When | What | Who |
|---|---|---|
| Sat Nov 14, morning | Print shop picked, hours and turnaround known, board measured | Jack |
| Sat Nov 14, once #37 is final | File sent to the shop. QR made from the final URL. Say in the group chat that it was sent. | Jack, Yahya |
| Sun Nov 15, `[pickup time]` | Pick up the prints. Check every panel for typos and colour before leaving the shop. | `[who]` |
| Sun Nov 15, assembly (about 2 h) | Section 6. **Aim to finish by 4:00 PM**, which leaves two hours of slack before the deadline. | Jack and helpers |
| Sun Nov 15, by 6:00 PM | QR test on 3 phones (section 7). Photo in the group chat. | Jack |
| Mon Nov 16 | Carry the board to the showcase. Who has a car? `[who]` | |

## 6. Assembly checklist

**Bring:** the prints, the board, a ruler or tape measure, a craft knife, a cutting mat or thick card, scissors, a pencil, painter's tape, your chosen adhesive (double-sided tape, spray mount or glue), a few spare strips of tape, paper towels, 3 phones, Wi-Fi or a hotspot.

- [ ] Lay the board flat, fully open. Wipe it.
- [ ] Dry-fit every print with painter's tape. Check margins and that nothing crosses a fold.
- [ ] Mark the corners lightly in pencil.
- [ ] Mount the centre panel first, then the wings.
- [ ] Press out bubbles from the middle outwards. Let it set.
- [ ] Fold and unfold the board once to check nothing catches.
- [ ] Stand it up and read it from 2 m: the title and the two key points must be readable.
- [ ] Have someone outside the team read it in 30 seconds and say what it is about.
- [ ] Do the QR test (section 7).
- [ ] Take a photo of the finished board and post it in the group chat.

**Also bring on Nov 16** (context §3.8): laptop and charger, a phone with the shop page open, the video downloaded in case the Wi-Fi fails, a phone hotspot, and a printed QR code to the app.

## 7. Fill-in tables

**Print shop answers**

| Shop | Open Sunday until | Turnaround | Cost | File they want | Chosen? |
|---|---|---|---|---|---|
| `[name]` | | | | | |
| `[name]` | | | | | |

**QR test (3 different phones; the printed code, not the screen)**

| # | Phone and OS | Camera app or scanner | Distance | Opens the demo? | Seconds to load |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

If any phone fails, fix the code size, glare or URL, reprint the QR if needed, and test all three again.

## 8. Print shop shortlist (researched Thu Nov 12, re-checked Sat Nov 14)

Retrieved Thu Nov 12, 2026, from the shops' own pages where we could open them, plus web search. Hours change and pages go stale, so **call before relying on any of this.** No prices are listed unless a page quoted them.

**Re-check, Sat Nov 14, about 9:30 AM (read-only: the same pages were opened again; nobody was phoned and nothing was ordered).**

- **Hours are unchanged.** Staples The Boardwalk and Strasburg Road: Sunday 11:00am to 5:00pm, Saturday 9:00am to 5:00pm. The UPS Stores #66, #398 and #195: Saturday 10:00 am to 3:00 pm (#398 and #195 list Sunday "Closed"; #66 has a "Sunday" heading with no times).
- **Staples' size limit is not one number.** The older file-submission page still says wide-format posters go "up to 24" x 36"". But Staples' own online poster page (https://shop.staplescopyandprint.ca/products/posters, from https://shop.staplescopyandprint.ca/pages/signs-posters-banners, which says "Posters up to 40" x 60"") lists the sizes 12 x 18, 16 x 20, 18 x 24, 20 x 30, 24 x 36, **36 x 48** and 40 x 60 in, with the finishes laminate, foam core mount, 4 grommets and 4 adhesive hangers. So a 36 x 48 in print is **offered online**, which section 8's first paragraph (written Nov 12) did not know.
- **Same-day pickup is shown for 36 x 48 in.** With "Same-day Print" and 36 x 48 in chosen, and The Boardwalk or Strasburg Road picked as the store, the page says "Order by noon for same-day pickup by store closing" and "Free pickup in-store today". It shows $81.99 for one glossy poster with no finishing, plus a service fee of up to $2.99 per order. "Standard Print" says pickup in 2 to 4 business days, which is too slow for Sunday. This is only what the page displays: nothing was ordered, nobody confirmed it by phone, and we do not know whether the in-store team can cut the print into panels or mount it on our board.
- **What that would mean.** An online order placed **before noon on Saturday** could be picked up the same day before the stores close at 5:00 pm, which takes Sunday's short hours out of the plan. An order on Sunday would have to go in before noon and be picked up by 5:00 pm, leaving about an hour before the 6:00 PM deadline: do not plan on it.
- **Pages disagree, so ask.** Ask Staples on the phone which size limit applies in the store, whether a 36 x 48 in print can be cut at the folds (measure the board first, section 1), and what a cut or a mount costs.
- **Print-desk numbers.** The page's store picker ("Staples Print & Marketing Services") lists 519-578-2241 for Strasburg Road, 519-579-2768 for The Boardwalk and (519) 888-1719 for Waterloo. The store pages below list different numbers for Strasburg Road and Waterloo; try both.

**What we found.** Only two shops near Waterloo and Kitchener list Sunday hours with print services, and both are Staples stores. Staples' wide-format page says posters go "up to 24" x 36"", not 36 x 48 in. So, as of Nov 12, **a 36 x 48 in print on Sunday was not confirmed anywhere** (the Nov 14 re-check above changes that for a Saturday pickup). The other shops we checked either list Sunday as closed or give no Sunday hours (see "Sunday hours not confirmed" and "Checked and closed" below). Two things follow, and the team decides:

- Ask Staples whether per-panel prints (each within 24 x 36 in) are an option. The 16 + 16 + 16 in layout from #37 has panels of about 16 x 36 in, which would fit. The real board may fold 12 + 24 + 12 in instead (section 1), so measure first.
- FASTSIGNS, Minuteman Press and W Print are closed on both Saturday and Sunday, so they only work if the file goes out on **Fri Nov 13**. #37 is due Sat Nov 14. The two UPS Stores in "Checked and closed" are open on Saturday from 10:00 am to 3:00 pm, and #398 lists posters and banners, so a Saturday print is possible there if the file is ready by then.

### Listed open on Sunday

**1. Staples Print, The Boardwalk (Kitchener)**
- Address: 5-225 The Boardwalk, Kitchener, ON N2N 0B1
- Phone: 519-579-2768 (print desk, per the print page). The store page lists 519-579-1614.
- Sunday hours as listed: "Sunday 11:00am - 5:00pm" (Mon to Fri 9:00am to 8:00pm, Sat 9:00am to 5:00pm)
- What the page says: banner and graphic printing, signs, posters and engineering prints; "Print oversized documents, technical drawings, presentation boards and large-format materials." No maximum size is given.
- Source: https://stores.staplescopyandprint.ca/on/kitchener/print-marketing-ca-cp-445.html and https://stores.staples.ca/staples-kitchener-3 (retrieved Thu Nov 12, 2026)
- Hours doubt: a search snippet and a Bell store-locator listing showed Sunday 12:00pm to 5:00pm. Staples' own pages said 11:00am.
- **Jack must call to confirm: 36 x 48 in, file size, turnaround, Sunday pickup.**

**2. Staples, Strasburg Road (Kitchener)**
- Address: 245 Strasburg Road, Kitchener, ON N2E 3W7
- Phone: 519-571-7420
- Sunday hours as listed: "Sunday 11:00am - 5:00pm" (Mon to Fri 9:00am to 8:00pm, Sat 9:00am to 5:00pm). Same doubt as above (12:00pm in a search snippet).
- What the page says: "print and copy services in our store". It does not mention posters or large format, and we found no separate print page for this store.
- Source: https://stores.staples.ca/staples-kitchener-2 (retrieved Thu Nov 12, 2026)
- Size limit for Staples wide-format posters: "We can print posters and engineering prints in wide format in sizes up to 24" x 36"." Source: https://www.staplescopyandprint.ca/PrintOnlineInfo/FileSubmissionInfo.aspx (retrieved Thu Nov 12, 2026). A search snippet of a staples.ca poster page listed sizes up to 40 x 60 in; on Sat Nov 14 Staples' own online poster page (see the re-check above) lists 36 x 48 and 40 x 60 in, so the two pages disagree: ask.
- **Jack must call to confirm: 36 x 48 in, file size, turnaround, Sunday pickup.**

### Sunday hours not confirmed

**3. Staples, Waterloo**
- Address: 620 King Street North, Waterloo, ON N2J 4G8. Phone: 519-888-1716.
- Sunday hours: **not found.** The store's own page has a "Store Hours" heading with no times. Two third-party directories disagree (one says Sunday 11 to 5, another 12 to 6), so we do not trust either. The page does list "Print & Marketing Services".
- Source: https://stores.staples.ca/on/waterloo (retrieved Thu Nov 12, 2026)
- **Jack must call to confirm: 36 x 48 in, file size, turnaround, Sunday pickup.**

**4. The UPS Store #66, Highland at Westmount (Kitchener)**
- Address: 525 Highland Rd W, Kitchener, ON N2M 5P4. Phone: (519) 744-2774 or (519) 744-7621.
- Sunday hours: **not found.** The page shows a "Sunday" heading with no times. It lists Mon to Fri 9:00 am to 6:30 pm and Sat 10:00 am to 3:00 pm. It says it prints posters "in a number of sizes" and can mount and laminate them, with no maximum size stated.
- Source: https://www.theupsstore.ca/66/services/printing/ (retrieved Thu Nov 12, 2026)
- **Jack must call to confirm: 36 x 48 in, file size, turnaround, Sunday pickup.**

### Checked and closed on Sunday (do not spend calls here)

| Shop | Address | What the page lists | Source (retrieved Thu Nov 12, 2026) |
|---|---|---|---|
| FASTSIGNS of Kitchener-Waterloo | 62 McBrine Place, Units 11 & 12, Kitchener. (226) 240-4164 | Mon to Fri 8:30 AM to 5:00 PM, Sat and Sun "Closed". Its structured data conflicts with the visible Friday hours. The page does not mention posters. | https://www.fastsigns.com/kitchener-waterloo-on/ |
| Minuteman Press Waterloo | 16-620 Davenport Road, Waterloo. 519-725-4441 | Mon to Thu 9:00 to 5:00, Fri 9:00 to 4:00, Sat and Sun "Closed" | https://minuteman.com/ca/locations/on/waterloo/ |
| The UPS Store #398 | 7-871 Victoria St N, Kitchener. (519) 569-7336 | Sat 10:00 am to 3:00 pm, Sunday "Closed". Offers wide-format banners and posters. | https://www.theupsstore.ca/398/ |
| The UPS Store #195 | 55 Northfield Drive E, Waterloo. (519) 884-4012 | Sat 10:00 am to 3:00 pm, Sunday "Closed". Large format not mentioned. | https://www.theupsstore.ca/195/ |
| University of Waterloo W Print | General Services Complex, University of Waterloo. wprint@uwaterloo.ca | Mon to Fri 8:30 to 4:30, "Saturday + Sunday CLOSED". Its poster page says 24-hour turnaround for orders placed in business hours and quotes $6.00 (matte) and $9.50 (glossy) per square foot. Whether a team without a UW account can order: not known yet. | https://wstore.uwaterloo.ca/pages/location-hours and https://wstore.uwaterloo.ca/pages/poster-printing |

Also seen, not on the list: SpeedPro in Guelph (650 Woodlawn Rd W Unit 3A, (519) 829-2100) lists "Monday to Friday 8:30am - 4:30pm" with no weekend hours (https://speedprocanada.com/cambridge-guelph-kitchener-waterloo/). Search listings also showed Print2Go (Kitchener) and Custom Press as closed Sundays; we did not open their pages.

Write what each shop tells you in the "Print shop answers" table in section 7.

## Done means (from #40)

- [ ] Board built, QR tested on 3 phones, photo in the group chat.
