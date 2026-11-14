# 60-second demo video: shot list (#35)

The script is the table in issue #35. This file turns it into exact clicks. Everything below was clicked
through on testnet on Nov 10 (labels copied from the screens). **Re-click the table after the Thursday
redeploy (#52)**: the contract ID changes and #80 adds history and "Ver más" to the dashboard; then update
this line. The product name is decided: **Relay**, tagline *Paga tu ruta* (PR #100).

## Before you record (10 min)

1. Use the live app (production URL, or the latest Vercel preview while #68 to #71 aren't merged).
2. Make fresh invoices: on `/distribuidor` tap **Nueva factura de demo** three times. They rotate
   Tienda Rosa ($45.00), Tienda Don Luis ($60.00), Mini Súper La Esquina ($85.50). Note the three ids.
   The script's "$150" becomes whatever the invoice says; say "the shop pays" without a number.
3. Tienda Don Luis must owe $0 first, or "Pagar en 7 días" may be greyed out: open
   `/tienda/cuenta/tienda-2` and tap **Pagar deuda** if it shows a debt.
4. Ana should start at $0 cash (the cash shot is Mini Súper, on her route): on `/distribuidor`, tap
   **Marcar efectivo entregado** next to her if not.
5. Close other tabs and notifications (Focus mode on). Zoom the browser so text reads well at 1080p.
6. The grey line at the top of every screen, "Demo en testnet · dinero de prueba · cash-in simulado",
   is the on-screen label the script asks for. Keep it in frame the whole time.

## Three windows side by side (Mac)

- Chrome, three windows. Left: driver, `/ruta/motorista-1`. Middle: shop, the invoice `/tienda/<id>`.
  Right (widest): `/distribuidor`.
- Phone size for left and middle: open DevTools (Cmd+Opt+I), toggle the device toolbar (Cmd+Shift+M),
  pick iPhone 12 Pro (390 × 844), then undock DevTools into its own window so it isn't recorded.
  Or just drag those two windows narrow (about 400 px); the app is built for 360 px.
- Record: Cmd+Shift+5 → "Record Selected Portion" around the three windows → Options: microphone on
  if you narrate live. QuickTime saves a .mov; File → Export As → 1080p for the MP4. OBS works too
  (one "Screen capture" source, crop to the windows).
- Do a 10-second test recording first and check the text is readable.

## Shots

| Time | Window | Exact clicks | Wait for |
|---|---|---|---|
| 0:00 to 0:08 | Title card (slide) | Shown as text, not spoken (spoken it takes about 15 s); narration starts on the next shot. The approved opening line (#73), word for word: "Around the world, small businesses in developing countries can't get about $5.7 trillion in credit they need. In El Salvador alone, more than 50,000 neighbourhood shops buy about $2 billion a year from distributors." On screen under it: "Conamype estimate". | |
| 0:08 to 0:20 | Driver, then shop | Driver: tap the Tienda Rosa row (the QR opens). Shop: the invoice page (as if scanned) → **Pagar ahora** | Shop: green ✓ "Pago recibido…". Driver's chip turns **Pagada** within 5 s |
| 0:20 to 0:35 | Shop, then dashboard | Open the Tienda Don Luis invoice → **Pagar en 7 días** → **Confirmo** | ✓ "Listo. Tiene hasta el … para pagar $60.00, sin intereses." Dashboard row: **Crédito**, "recibió $59.10" (the distributor pays a 1.5% fee) |
| 0:20 to 0:35 (cont.) | Shop | Tap **Mi cuenta** | "Debe $60.00", the due date, the limit |
| 0:35 to 0:45 | Driver, then shop | Driver: tap the Mini Súper row → **Recibí efectivo**. Shop: that invoice → **Confirmo** (the "Pagué en efectivo" panel opens by itself once the driver has registered the cash; tap **Pagué en efectivo** if it is closed) | Dashboard: Ana's cash under "Efectivo por motorista" goes up |
| 0:45 to 0:55 | Shop | On the green receipt, tap **Ver detalles** (opens stellar.expert) | The transaction page; then the contract page (link below) |
| 0:55 to 1:00 | End card | App URL and contract ID (below) | |

Mini Súper La Esquina's $85.50 cash payment goes to Ana (motorista-2), so switch the left window to her
route (`/ruta/motorista-2`) for that shot.

Line fix for 0:20 to 0:35: the issue says "$147.60 on a $150 invoice". The app's lender fee is 1.5%,
so the screen shows $59.10 on $60.00 (and would show $147.75 on $150). Say what the screen shows.

## End card

- App: https://relay-sv.vercel.app
- Contract: `CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML`
  (https://stellar.expert/explorer/testnet/contract/CAGCZ3I7CQHZDELPV5OB2W4D4LHA7MPSOBP4NO2AV4JO2G6HED7HV4ML). Redeployed for #139 (sliding credit fee); the one before was `CDHDZX7V…`.
  If the contract is redeployed (#52), copy the new ID from `config/testnet.json`.
- Product name: **Relay**, with *Paga tu ruta* under it (PR #100)

## If something goes wrong while recording

- A button spins for more than 10 s: testnet is slow. Stop, make a fresh invoice, redo that shot only;
  cut the shots together afterwards.
- "Pagar en 7 días" greyed out: the shop still owes or the invoice is over $200; see step 3 above.
- Upload as Public on YouTube, open it in a private window, and keep the MP4 offline for Monday.
