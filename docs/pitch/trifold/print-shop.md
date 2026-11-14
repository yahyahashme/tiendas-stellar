# Print shop: call script and email (#40)

Drafted Wed Nov 11 for Jack. Use the call script (it can be Saturday) to pick a shop, and send the email and the files on Sunday, once the numbers are in and the layout is final. The checklist for mounting the board is in `docs/pitch/trifold-assembly.md`; this file is only about finding a shop and getting the file to it. Don't put your full name or phone number in this file: the repo is public.

**The deadline chain (one plan: print on Sunday).** The calls to the shops can happen Saturday Nov 14, but nothing is ordered then, because the product numbers are not final. On **Sunday Nov 15** the team agrees the numbers, the final render passes, and the order goes in **before noon** for same-day pickup (Staples' page says "Order by noon for same-day pickup by store closing"). You pick it up **by 5 PM** (Staples closes at 5:00 PM, hours unverified), the board is built after that, and the photo is in the group chat by **6 PM** (#40). The showcase is **Monday Nov 16** (setup 4:00 PM, Innovation Arena, 280 Joseph St, Kitchener).

**Sunday is tight, so do not promise the 6 PM photo.** A 5 PM pickup leaves about an hour, and assembly takes about 2 h (`docs/pitch/trifold-assembly.md` section 5). Also, Yahya's decision is that the numbers are agreed on Sunday afternoon, which is after the noon cutoff: the same-day order only works if the numbers are agreed before noon. Otherwise, ask a store by phone whether its print desk can print in the store that afternoon (not confirmed by anyone).

## 1. Decide these before you call (so each call takes five minutes)

1. **The board** (measured Nov 14): 27 in tall, panels 9 + 19 + 9 in wide. Print on Sunday, only once the team has agreed the numbers and the final render passes: run `SCALE=2 node docs/pitch/slides/render.mjs` first (`docs/img/architecture@2x.png` is git-ignored, so a fresh checkout does not have it; without it the diagram prints at 149 pixels per inch), then `node docs/pitch/trifold/render.mjs --final`.
2. **Panels or one sheet?** `node docs/pitch/trifold/render.mjs` writes both into `docs/pitch/trifold/out/`:

| You pick | Files to send | Size of each print |
|---|---|---|
| Three panel prints (easier to line up, and one can be reprinted alone, as `docs/pitch/trifold-assembly.md` says) | `trifold-9-19-9-left.pdf`, `-centre.pdf`, `-right.pdf` | 9 x 27, 19 x 27 and 9 x 27 in (each fits a 24 x 36 in poster print) |
| One big print | `trifold-9-19-9.pdf` | 37 x 27 in, one page |

3. **Copies:** one of each. Ask for the price of a small proof too, and whether there is time for one on a same-day order.
4. **The files are final only when** `node docs/pitch/trifold/render.mjs --final` passes: it refuses while a yellow placeholder is left or a picture is too blurry. Don't send a file that still has yellow on it.

## 2. Shop list

**Hours below are UNVERIFIED.** A listing's opening hours are often wrong, and a shop's Sunday hours change. The call decides, not the website. Write the hours the person on the phone tells you.

Tell me the area (a city or postcode) and I'll draft candidates here. Types of places to try, without names: sign and banner shops, the print centre of an office-supply store, a campus print service. Call at least two.

| Shop | Address / area | Phone | Hours on its listing (**UNVERIFIED**) | Open Sunday? (confirmed by call) |
|---|---|---|---|---|
| `[waiting for the area]` | | | | |
| | | | | |
| | | | | |

## 3. Call script

Say it slowly, and write the answers in the table in section 5.

> Hi. I'm calling about a large-format print for a school project. I have a finished PDF. I need **[three panels, 27 inches tall and 9, 19 and 9 inches wide / one print 37 by 27 inches]**, in colour, one copy. I would like to order on **Sunday, before noon**, and pick it up the same day **before you close**. Can you do that?

Then ask, in this order:

1. **Are you open Sunday? Until what time?** What's the earliest pickup, and the last?
2. **How long does that print take?** If I send the file on Sunday before noon, what is the earliest I can pick it up that day? What's the latest time on Sunday that you'd take the file?
3. **What file do you want?** I have a PDF with the text kept as text and the fonts inside; it is in RGB. Do you need CMYK, bleed, or a particular resolution? Where do I send it, and how big can the file be?
4. **Matte or gloss?** What paper? Does it lie flat, or curl? (Gloss gives glare under showcase lights; matte is the better pick.)
5. **What's the total price, and how do I pay?** What does a small proof cost, and is there time for one on a same-day order? (If not, check the PDF at 100% before you send it.)
6. **How wide can your printer print?** (The board is 27 in tall, so a roll at least 27 in wide can print it as one 37 x 27 in piece. If not, ask for the three panels, 9 x 27, 19 x 27 and 9 x 27 in.) Can you cut panels to size? Can you mount a print on foam board, or do you only sell the board and the spray adhesive?
7. **Can I get a written quote and a confirmation by email?**

Red flags: "We can have it Monday" (too late); "we need the original design file, not a PDF" (try another shop first); no proof offered and no way to fix a typo after printing.

## 4. Email (copy, fill the brackets, attach the PDFs)

**Subject:** Large-format print for Sunday pickup: 3 panels, 27 in tall

> Hello,
>
> I'm a student at the University of Waterloo and I need a large-format print for a competition on Monday Nov 16. I would like to send the files on the morning of Sunday Nov 15, before noon, and pick the prints up the same day, before **[time]**.
>
> **What I need (colour, one copy of each, matte if you have it):**
> **[Pick one:]**
> - Three panels, each 27 inches tall: **9 in, 19 in and 9 in wide** (files: `trifold-9-19-9-left.pdf`, `-centre.pdf`, `-right.pdf`)
> - One print, **37 x 27 in** (file: `trifold-9-19-9.pdf`)
>
> The PDFs are made at the exact size, with the text kept as text, the fonts embedded, and the colours in RGB. Tell me if you need CMYK, bleed, or a different resolution and I will resend.
>
> **Could you tell me:**
> 1. Are you open on Sunday, until what time, and what is the earliest pickup?
> 2. What is the latest time on Sunday you can take the files to have them ready the same day, and how long does the print take?
> 3. The total price, and whether you can print a small proof first.
> 4. Whether you can cut the panels to size and mount them on foam board, or only print.
>
> Thank you,
> **[your name]**
> **[your phone]**

## 5. Record the answers

Copy the winner into the print-shop table in `docs/pitch/trifold-assembly.md` (from PR #85; this file does not edit it).

| Shop | Open Sunday until (told by phone) | Latest file time Sunday | Ready by | Cost | Proof? | File they want | Chosen? |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |

## 6. After you choose

- Send the files, and ask for a reply in writing that says the pickup time.
- Check the proof, or the PDF at 100%, for typos first. The names, numbers and the QR are on the board for the whole showcase.
- The app's address is fixed: **relay-sv.vercel.app** (the old tiendas-stellar address only redirects). The QR in `public/qr-demo.png` was regenerated for it in PR #102 and opens `https://relay-sv.vercel.app/demo`; the board also prints the address under the QR. If the address ever changes again, regenerate the QR before the final render (`docs/pitch/trifold-assembly.md` section 3).
- Ask for a shop phone number you can call on Sunday if the print isn't ready when promised.
