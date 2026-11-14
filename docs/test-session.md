# Working Session #2: test checklist, name checks, pitcher pick (#26)

For Wed Nov 11, 5 to 7 PM ET, 1st floor IDEAs Clinic. Everyone does the same four things, in this order: test the flows, file the bugs, pick the name, pick the pitcher.

**Written against `main` (dfdc33c), checked on Nov 11.** "Pagar otro monto" (#75) and "Marcar efectivo entregado" (#76) were merged into the stacked branch `28-readme-v1`, not into `main`, so they are marked "only if present" below. The live app (checked on the old address; it is now https://relay-sv.vercel.app) returned 404 for `/demo` (a page that exists only in #70), which suggests production is not running that stack, but I could not see which branch it tracks. Step 0 asks Yahya.

| Time | What | Who |
|---|---|---|
| 5:00 to 5:10 | Setup: pick your role, open the app, note your phone | Everyone |
| 5:10 to 5:50 | Test script (section 1), write down every failure | Everyone |
| 5:50 to 6:00 | File the bugs (section 2) | Whoever found each one |
| 6:00 to 6:30 | Pick the name (section 3) | Everyone |
| 6:30 to 6:50 | Pick the pitcher (section 4) | Everyone |
| 6:50 to 7:00 | Post in the group chat, tell Yahya the name (section 5) | Jack posts |

The Pitch Prep Workshop may have its own agenda from 6 PM. If it does, do section 3 and 4 inside it and keep the order.

## 1. Test script (40 minutes)

**Rules**
- Use your own phone, in a private/incognito tab. The app is built for 360 px width.
- **Split the roles so you don't collide.** The app runs on one shared testnet contract, so two people paying the same invoice get a failure that isn't a bug. Yahya: distributor dashboard. Jack: shop screens, shop 1. Ruhaan: driver screens. Rohan: try everything cold with no instructions, and say out loud what confuses you.
- **Pairs for the two-person steps.** Steps 3 to 7 and 12 to 14 need a driver and a shop at the same time: Jack (shop 1) and Ruhaan (driver, Carlos's route) do them together. Yahya keeps the dashboard open for steps 15 and 16. Rohan starts cold, then joins Jack for step 17 (two phones, one invoice).
- **Make your own invoices.** On the dashboard, "Nueva factura de demo" adds one, and it **rotates the shops**: Tienda Rosa (tienda-1) $45.00, Tienda Don Luis (tienda-2) $60.00, Mini Súper La Esquina (tienda-3) $85.50. Each shop always gets its own amount, and every third tap is yours: tap until the invoice is for your shop. Don't depend on the seed invoices (other people use them), except in step 10.
- Testnet can be slow. Wait 10 seconds before calling a button stuck.
- These tests are about "is it easy to use". They are not user research for #30: only real shop owners and distributors count there.

**Pass or fail:** copy the table into your notes. For every FAIL, take a screenshot and go to section 2.

| # | Do this | Expect (the exact text on `main`) | Pass? |
|---|---|---|---|
| 0 | Open the URL. Ask Yahya which branch production tracks. | The grey banner "Demo en testnet · dinero de prueba · cash-in simulado" is on every screen. The app title still says "Nombre pendiente". | |
| 1 | Home page `/` | Buttons: Distribuidora El Sol, each Motorista (Carlos, Ana), each Tienda with its open invoices. | |
| 2 | Driver: open Carlos's route `/ruta/motorista-1` | "Ruta de Carlos", "N paradas hoy · M por cobrar", "Efectivo en mano $X". | |
| 3 | Driver: tap a stop | A QR code and "La tienda escanea este código para pagar." | |
| 4 | Shop: open that invoice (scan the QR from a second phone, or use the link on the home page) | Shop name, amount, chip "Pendiente", "Vence el …", the list Pagar en 7 días, Pagar otro monto, Pagué en efectivo, and the Pagar ahora button at the bottom. | |
| 5 | Shop: tap **Pagar ahora** | A spinner, then "Pago recibido: $X en dólares digitales." and a green "PAGADA" stamp replaces the chip. | |
| 6 | Shop: tap "Ver detalles" on the receipt | Opens the transaction on stellar.expert (testnet). The page is not blank and not an error. | |
| 7 | Driver: wait up to 5 seconds, no refresh | The same stop shows "Pagada". | |
| 8 | Shop: new invoice, tap **Pagar en 7 días**, then **Confirmo** | First "Hoy no paga nada. Paga $X en 7 días." Then "Listo. Tiene hasta el <date> para pagar $X, sin intereses." | |
| 9 | Shop: tap **Mi cuenta** | "Debe $X", "Vence el <date>", then the sum: "Límite de crédito", "Menos lo que debe", "Disponible". The limit starts at $200. **Pagar deuda** stays at the bottom of the screen (it fades in and takes a tap after about half a second). | |
| 10 | Shop: open an invoice that would take the debt over the $200 limit. Use seed invoice **1003** (Mini Súper La Esquina, $220.00: over the limit on purpose). If someone already paid it, use Mini Súper's demo invoices ($85.50 each): buy two on credit ($171.00), and the third is over the limit. | "Pagar en 7 días" is greyed out, with the hint "Supera su límite de crédito". | |
| 11 | Shop: **Pagar deuda** on Mi cuenta | "Deuda pagada a tiempo. Su límite subió a $…" (the limit grows only after a $40+ cycle, once per credit period, so "Deuda pagada a tiempo. Gracias." is also correct). The slip shows the amount with a green "PAGADA" stamp and "Pagada hoy"; if the limit moved, "Subió $25.00" under the limit. The button turns into a grey "Deuda pagada" that does nothing when tapped. Leave the screen and come back and it reads "Debe $0.00" and "No tiene deudas pendientes." | |
| 12 | Cash, shop first: new invoice, **Pagué en efectivo** before the driver did anything | "El motorista aún no registró el efectivo." | |
| 13 | Cash, driver: tap the stop, then **Recibí efectivo** | The button shows the amount. Then "Esperando que la tienda confirme $X." and the chip "Efectivo por confirmar". | |
| 14 | Cash, shop: **Confirmo** (the "Pagué en efectivo" panel opens by itself within 5 seconds of step 13; tap **Pagué en efectivo** if it is closed) | "Carlos registró $X en efectivo." then "Listo. Confirmó $X en efectivo." The driver's "Efectivo en mano" goes up by $X. | |
| 15 | Dashboard `/distribuidor` after steps 5 to 14 | The tiles "Cobrado digital", "Efectivo por motorista", "En crédito", "Vencido" moved within 5 seconds ("Se actualiza cada 5 segundos."). | |
| 16 | Dashboard: tap **Nueva factura de demo** | A new invoice appears on the list and on a shop's home page. | |
| 17 | Pay twice: open one unpaid invoice on two phones, tap Pagar ahora on both (or double-tap fast) | Money moves **once**. The second attempt shows a plain Spanish message, not a raw error code. "Blocks paying twice" is a claim in our pitch. | |
| 18 | Bad links: `/tienda/9999`, `/ruta/xyz`, `/tienda/cuenta/xyz` | "No encontramos la factura 9999.", "No encontramos a ese motorista.", "No encontramos esa tienda." | |
| 19 | Phone checks: 360 px wide, no sideways scroll, every button easy to hit with a thumb | Nothing cut off, nothing overlaps. | |
| 20 | Slow network: Chrome DevTools, Network, "Slow 3G" | A loading state, then data. If it fails, a retry message, not a blank screen. | |
| 21 | Words check: read every main screen | No "blockchain", "wallet", "crypto" or "token". "USDC on Stellar" is allowed only behind "Ver detalles". Everything is in Spanish. | |

**Only if your build has them (not on `main` on Nov 11):**
- "Pagar otro monto" on the shop's invoice (#75): pay part of an invoice, then see the lines "Pagado −$X" and "Falta $Y" and the chip "Parcial".
- "Marcar efectivo entregado" on the dashboard next to a driver (#76): the driver's cash goes back to $0.
- `/demo` and the big-screen dashboard (#70).

## 2. Filing bugs

Every bug is one GitHub issue, label `bug`, assigned to Yahya. Fix nothing tonight. Copy this:

```
Title: <screen> - <what went wrong in 6 words>   (add "BLOCKS VIDEO" if it breaks the 60-second flow in #35)

Steps
1. Open <URL> on <phone and browser>
2. <tap ... >
3. <tap ... >

Expected: <the text or result from the table>
Got: <what you saw, with the exact message>
Screenshot: <attach>
Test step: <# from docs/test-session.md>
```

- A failure that comes from two people using the same invoice is not a bug. Say so in the chat and move on.
- If testnet itself is down or slow, that is one issue, not ten.
- A wording or design opinion goes in the group chat, not in an issue.

## 3. Pick the name

Rules from #26: not RUTA, our technical and finance advisor said to pick one, and it must not be an existing fintech in Central America. Ideas so far: Fiado, CuentaClara, Cuadre, or a new one.

### Five quick checks (about 5 minutes per name)

1. **Is it already a finance or payments business?** Search the name plus "fintech", "app" and "El Salvador" on Google, the Play Store, the App Store and LinkedIn. **Any finance or payments business in Latin America using it: drop the name.**
2. **Trademark.** Search the name in the WIPO Global Brand Database (https://branddb.wipo.int), then in El Salvador's national registry (CNR). Look at Nice classes 9 (software), 36 (finance) and 42 (software services). **A live mark in 36 or 9: drop the name.** This is a quick look, not legal advice.
3. **Domain and handles.** Is a `.com`, `.app` or `.sv` free, and the same handle on Instagram, X and TikTok? Don't buy anything tonight; Yahya decides about a domain (#28, and the trifold QR must never change after Friday).
4. **Say it.** Everyone says the opening line aloud with the name in it, in English and in Spanish (10 seconds). Does it sound right, is it easy to spell after hearing it once, and does it mean something odd in either language? Ask a Spanish speaker outside the team if you can.
5. **Does it fit what we promise?** Full price, no interest, "dólares digitales". No "blockchain", "crypto" or "wallet" in it. It must fit on the trifold at 96 pt, so keep it short.

### What I found before the session (Nov 11, one web search per name, plus a DNS lookup)

| Name | Check 1: existing business? | Check 3: domains | Verdict so far |
|---|---|---|---|
| **Fiado** | **Yes.** CB Insights lists "Fiado App" in San Salvador: "a digital financial services company that provides microcredit solutions", founded 2019, "Seed \| Alive", news up to Apr 2024 ([CB Insights](https://www.cbinsights.com/company/fiado-app)). LatamFintech reports a credit card it launched with Pomelo ([article](https://www.latamfintech.co/articles/pomelo-y-fiado-se-unen-para-lanzar-tarjeta-de-credito-que-beneficiara-a-los-mexicanos-en-eeuu)). The sources disagree on its founding year and country, so confirm. | `fiado.com` and `fiado.app` are registered | **Fails check 1** unless the team confirms it is defunct. It is also the everyday word for buying on credit, so it is hard to own. |
| **CuentaClara** | No fintech with that exact name in one search. Close names: "Cuenta Clara" is ABANCA's (Spain) free bank account ([kelisto](https://www.kelisto.es/cuentas-nomina/bancos/abanca/cuenta-clara-2000)), and Clara is a Mexican and Colombian business-card and credit fintech ([clara.com](https://www.clara.com)). | `cuentaclara.com` and `cuentaclara.app` are registered | **No hit, but crowded.** Check 2 (trademark) matters most here because Clara works in business credit. |
| **Cuadre** | No app or fintech with that name in one search. The results were cash-register and cash-close tools, so it is a common word in that area. | `cuadre.com` and `cuadre.app` are registered | **No hit.** Run check 2 and check 4 (what does it mean in El Salvador?). |

- "No result in one search" is not a clearance. Checks 2 and 4 are still to do for CuentaClara and Cuadre, and for any new idea.
- All six domains above had DNS records on Nov 11, so none is clearly free. Registered does not mean unavailable, but expect to use a different address or a subdomain.
- I did not check the `.sv` domains, the social handles or the trademark databases.

### How we decide

1. Drop every name that fails check 1 or 2.
2. Each person writes down their top choice from what is left, then everyone shows at once.
3. If it is not unanimous, say the opening line with each name and vote again.
4. If it is still a tie, take the name that is easier to say aloud (check 4).
5. Write the winner and the runner-up in the group chat. A runner-up matters if a trademark problem turns up on Friday.

## 4. Pick the pitcher

#26: the pitcher "rehearses the most and owns the script from v1" (#37). One person gives the 3-minute pitch, and the 1-minute video plays inside it. The script v1 is `docs/pitch.md` in PR #83 (branch `37-trifold-pitch`). It is not on `main` yet, so open it from that PR's "Files changed" tab, and have it open on everyone's laptop before 6:30.

1. **Read-through, 5 minutes.** Each person reads two segments of the script aloud with a timer: 0:00 to 0:25 (62 words) and 2:30 to 2:50 (47 words). Others write down one thing that landed and one that didn't.
2. **Check the dates.** The pitcher must be at the Mon Nov 16 4:00 PM showcase, the Tue Nov 17 prep session if we make the Top 8, and the Wed Nov 18 5 to 7:30 PM finals. All four of us must be there anyway (context §2). Say now if anyone has a class conflict.
3. **Ask who will rehearse most.** The five timed run-throughs are Sun Nov 15 (#39). Whoever commits to doing the most extra ones between now and then is the pitcher, unless the read-through shows a clear problem.
4. **Decide, then say it in the chat.** The pitcher edits `docs/pitch.md` from here on. Everyone else sends them changes as comments, not edits.
5. **Optional, 5 minutes:** who answers which questions in the 3 minutes of Q&A at the finals? A suggested split: the pitcher takes business and market, Yahya takes contract and Stellar, Jack takes security and the demo, Rohan takes the numbers. Velocity hasn't said how Q&A works, so treat this as a plan, not a rule.

## 5. After the session

**Post this in the group chat:**

```
Name: <NAME> (runner-up: <NAME2>)
Team number: <n> (from the form's "Team Topic & Number" picker)
Pitcher: <NAME>
Bugs filed: #<n>, #<n> (or: none)
Name checks: <done / not done: which>
```

**Then:**
- **Find our team number.** Open the form (don't submit anything) and look for our team in the "Team Topic & Number" picker. Jack puts the number in the post: form field 1 needs it on Thursday (#31).
- **Tell Yahya the name.** He changes one line: `export const APP_NAME = "Nombre pendiente";` in `lib/brand.ts` (#32). The app reads it from there only.
- **Where else the name must go, so nobody guesses later:** form question 2 (#31, due Thu 9 PM), the trifold title (#37), the video end card (#35), the README (#28), and, if Yahya wants it in the web address, a Vercel domain before Friday (#28 step 1).
- If the name comes late, the form still needs one on Thursday night. Don't leave it to the 9 PM call.

## Done means (#26)
- [ ] Name and pitcher posted in the group chat.
- [ ] Bugs filed as issues.
