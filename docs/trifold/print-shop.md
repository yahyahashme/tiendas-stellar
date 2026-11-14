# Print shop: call script and email (#40)

Drafted Wed Nov 11 for Jack. Use it Sunday, once the numbers are in and the layout is final. The checklist for mounting the board is in `docs/trifold-assembly.md`; this file is only about finding a shop and getting the file to it. Don't put your full name or phone number in this file: the repo is public.

**The deadline chain:** the final files go to the shop on **Saturday Nov 14**, you pick them up **Sunday Nov 15 morning**, the board is built by **4 PM**, the photo is in the group chat by **6 PM** (#40), and the showcase is **Monday Nov 16** (setup 4:00 PM, Innovation Arena, 280 Joseph St, Kitchener).

## 1. Decide these before you call (so each call takes five minutes)

1. **The board** (measured Nov 14): 27 in tall, panels 9 + 19 + 9 in wide. Print Sunday afternoon, once the team has agreed the numbers and `render.mjs --final` passes.
2. **Panels or one sheet?** `node docs/trifold/render.mjs` writes both into `docs/trifold/out/`:

| You pick | Files to send | Size of each print |
|---|---|---|
| Three panel prints (easier to line up, and one can be reprinted alone, as `docs/trifold-assembly.md` says) | `trifold-9-19-9-left.pdf`, `-centre.pdf`, `-right.pdf` | 9 x 27, 19 x 27 and 9 x 27 in (each fits a 24 x 36 in poster print) |
| One big print | `trifold-9-19-9.pdf` | 37 x 27 in, one page |

3. **Copies:** one of each. Ask for the price of a small proof too.
4. **The files are final only when** `node docs/trifold/render.mjs --final` passes: it refuses while a yellow placeholder is left or a picture is too blurry. Don't send a file that still has yellow on it.

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

> Hi. I'm calling about a large-format print for a school project. I have a finished PDF. I need **[three panels, 27 inches tall and 9, 19 and 9 inches wide / one print 37 by 27 inches]**, in colour, one copy. I need to pick it up **Sunday before closing**. Can you do that?

Then ask, in this order:

1. **Are you open Sunday? Until what time?** What's the earliest pickup, and the last?
2. **How long does that print take?** Could it be ready Sunday by 10 AM if I send the file Saturday afternoon? What's the latest on Saturday that you'd take the file?
3. **What file do you want?** I have a PDF with the text kept as text and the fonts inside; it is in RGB. Do you need CMYK, bleed, or a particular resolution? Where do I send it, and how big can the file be?
4. **Matte or gloss?** What paper? Does it lie flat, or curl? (Gloss gives glare under showcase lights; matte is the better pick.)
5. **What's the total price, and how do I pay?** What does a small proof cost?
6. **How wide can your printer print?** (A 36 in roll can print a 48 in long piece. If not, ask for panels.) Can you cut panels to size? Can you mount a print on foam board, or do you only sell the board and the spray adhesive?
7. **Can I get a written quote and a confirmation by email?**

Red flags: "We can have it Monday" (too late); "we need the original design file, not a PDF" (try another shop first); no proof offered and no way to fix a typo after printing.

## 4. Email (copy, fill the brackets, attach the PDFs)

**Subject:** Large-format print for Sunday pickup: 3 panels, 27 in tall

> Hello,
>
> I'm a student at the University of Waterloo and I need a large-format print for a competition on Monday Nov 16. I would like to send the files and pick the prints up on Sunday Nov 15, before **[time]**.
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
> 2. What is the latest time on Saturday you can take the files to have them ready on Sunday morning?
> 3. The total price, and whether you can print a small proof first.
> 4. Whether you can cut the panels to size and mount them on foam board, or only print.
>
> Thank you,
> **[your name]**
> **[your phone]**

## 5. Record the answers

Copy the winner into the print-shop table in `docs/trifold-assembly.md` (from PR #85; this file does not edit it).

| Shop | Open Sunday until (told by phone) | Latest file time Saturday | Ready by | Cost | Proof? | File they want | Chosen? |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |

## 6. After you choose

- Send the files, and ask for a reply in writing that says the pickup time.
- Check the proof, or the PDF at 100%, for typos first. The names, numbers and the QR are on the board for the whole showcase.
- The app's address is fixed: **relay-sv.vercel.app** (the old tiendas-stellar address only redirects). The QR in `public/qr-demo.png` was regenerated for it in PR #102 and opens `https://relay-sv.vercel.app/demo`; the board also prints the address under the QR. If the address ever changes again, regenerate the QR before the final render (`docs/trifold-assembly.md` section 3).
- Ask for a shop phone number you can call on Sunday morning if the print isn't ready.
