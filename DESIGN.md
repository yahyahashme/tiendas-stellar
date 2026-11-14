# Relay design: Papel de confianza

Shop owners in El Salvador already run credit on paper: the cuaderno de fiado, the printed receipt, the distributor's ledger. Paper is what they trust with money. Relay replaces the loan shark, not the paper, so every screen looks like the paper its user knows, made reliable.

| Role | Paper object | Layout |
|---|---|---|
| Shop | el recibo, the printed slip | `Slip` on phones, `Split` when there is room |
| Driver | la hoja de ruta, the delivery manifest | `Slip` on phones, `Split` sideways and on tablets |
| Distributor | el libro mayor, the ledger | `Shell` |

## The one rule

**Paper holds facts. Solid blue holds actions.**

- Anything you read (amounts, dates, names, history, status) sits on paper: warm off-white, hairline rules, near-square corners, no shadow. Depth comes from paper lying on the darker counter.
- Anything you tap is a filled blue control (the main action) or a clear outlined row (everything else). Nothing on paper responds to a tap except a "Ver detalles" text link and the "Ver productos" fold.
- Status is a rubber stamp, never a pill: PAGADA, CONFIRMADO, EN CRÉDITO, VENCE PRONTO, VENCIDA (and, off the invoice, a few of the same kind: CREADA on a new invoice, APROBADA, HECHO). Uppercase, tilted 4° to 6°, double border, worn ink. In a dense table it is a small upright mark. Always words plus colour.
- If it looks like paper, it isn't a button.

## Type

- **Atkinson Hyperlegible Next** (400, 600, 700): headings and all interface text.
- **IBM Plex Mono** (500, 600): every amount, invoice number, receipt line, receipt date and ledger column. Never body text.
- Outfit lives only inside the logo. Both text fonts are self-hosted with `next/font`, Latin subset, 54 KB together.
- Sizes are fluid from 320 to 1440 px (`text-body`, `text-lead`, `text-title`, `text-figure`, `text-total` in `app/globals.css`). Body is never under 16 px, labels never under 14 px. The invoice total is the largest thing in the product: `clamp(2.75rem, 10vw + 1rem, 4.5rem)`, mono 600, and it shrinks rather than clip.
- Amounts read `$ 48.50`: a thin gap after the sign, two decimals always, tabular, right-aligned in lists. Use `<Money>` on screen and `formatAmount()` in plain text.

## Colour

Light theme only. Tokens live in `@theme` in `app/globals.css`.

| Token | Value | Use |
|---|---|---|
| `counter` | `#e6e1d4` | page background |
| `paper` | `#fffdf8` | receipts, ledger, manifest (never pure white) |
| `paper-rule` | `#d9d3c4` | hairlines and dotted rules on paper |
| `counter-rule` | `#c4c2ba` | hairlines on the counter |
| `ink` | `#14202e` | amounts and main text (16.2:1 on paper) |
| `muted` | `#4f5a68` | secondary text (6.9:1 on paper, 5.4:1 on counter) |
| `brand` | `#0b4ea2` | actions, links, focus rings (white on it: 8.0:1) |
| `ok` `warn` `bad` `credit` | `#146c43` `#8f5200` `#b42318` `#5b3fa6` | stamps and status words |

Each status colour has a `-tint` for stamp fills only. No gradients, glass, blur, shadows or dark mode. `lib/contrast.test.ts` checks every pair: AA everywhere, AAA for ink.

## Shape

2 px corners on paper, 10 px on controls. A receipt is torn top and bottom (zig-zag drawn in CSS), its lines use dotted leaders, and its total sits under a double rule. A ledger has 1 px row rules, vertical rules beside its money columns, and a double rule above totals. No illustrations, emoji or decorative icons; the only drawn marks are chevrons.

## Components (`components/kit/`)

| File | What it holds |
|---|---|
| `layout.tsx` | `Slip` (one column, 28 rem), `Split` (facts and actions, one column under 40 rem of room), `Shell` (sidebar from 64 rem, else top bar and bottom navigation), `TopNav` |
| `paper.tsx` | `Receipt` and its parts: header, lines, fold, total, foot with the stamp slot |
| `stamp.tsx` | `Stamp`, large and `small` (which one an invoice gets: `lib/stamps.ts`) |
| `button.tsx` | `Button` (blue, `danger`, `busy`, `arriving`; `sm` is 44 px, for a top bar), `Held`, `ActionList`, `ActionRow`, `ActionLink`, `DetailLink` |
| `ledger.tsx` | `Ledger` (a table; a `secondary` column folds into the row under 60 rem of room, or under 54 rem with `secondary: 54`; under 40 rem each row is a `LedgerCard`), `LedgerFigures` (its figures share one size, set by the longest amount), and the row actions `RowLink` and `RowButton` |
| `manifest.tsx` | `ManifestRow`: paper with a blue end (`current` circles the open stop in ink; under 19 rem of row the amount takes its own line). `StopSlip`: the open stop, with the code at 70% of the width or more, two reserved lines under it for a failure, and the stamp across the faded code once paid |
| `field.tsx` | `Field`, `MoneyField`, `SelectField`, `PasswordField`, `FilterSelect` (a ledger's filters, one row) |
| `states.tsx` | `Loading` (a blank ruled slip), `Empty`, `Failure` with Reintentar, `Answer` (what the server said after an action) |
| `form.tsx` | `Form` (brings a field's error into view and focuses it), `FormHead` (step and title; takes focus when the step changes), `Choices` / `Choice`, `FormSubmit` (the button with two reserved lines above it, so a message never moves it) |
| `band.tsx` | the testnet band and the ES / EN switch |

Buttons are at least 52 px tall, 60 px on the driver's screens, with 8 px between neighbours. A driver's screen carries `data-gloves`: every target on it is at least 56 px, the band's ES / EN switch included (`gloves:`), with `TopNav`, `TextButton`, `Failure` and the action rows at `size="lg"`. `sideways:` is a short screen with room for two columns: the code moves beside the facts so it and "Recibí efectivo" stay in view on a phone on its side. `/sistema` shows every component in every state.

A message about one field goes under that field (`lib/form-errors.ts` maps the server's fixed messages to their field); anything else goes in the reserved lines above the button. Waiting, not valid and ready screens are a slip with one title, one sentence and a stamp (EN REVISIÓN, NO APROBADA, NO VÁLIDO, LISTA). A large stamp of more than about eight letters takes `fit={letters}` so it shrinks to its paper. On the landing, at 360x640 and 390x844, the logo, the sentence and both ways in are in view: the receipt's lines give way first. Server pages use `<T es en />` from `lib/i18n`.

A ledger row's actions (Historial, Repetir) show on hover or keyboard focus when there is a mouse and room for every column. They sit at the end of the shop cell and shorten a long name with "…", so they never cover an amount, a stamp or a date. Anywhere else the row ends in a chevron that unfolds them, together with the folded columns. The one action a small ledger exists for ("Recordar por WhatsApp", "Marcar efectivo entregado") is a column of its own and always visible.

An invoice that is simply waiting (unpaid, and not yet near its due date) carries no stamp: the Estado column says "Pendiente" in plain grey, and an empty Pagado or Método is a dash. A stamp means something happened or is about to.

One tint is allowed outside a stamp: on the dashboard, an invoice that is new or has just changed (a shop paid) is lit for four seconds, then goes back to paper.

Mi cuenta is a short slip beside a long list, so its `Split` takes `pin="facts"`: the list scrolls with the page and the slip stays in view on a screen tall enough to hold it. `Slip wide` (56 rem) is a ledger page outside the Shell, and `LedgerFigures pair` keeps two figures across. On the account slip Debe is the large figure with its due date beside the label; Límite, Disponible, Puntaje Relay and Saldo are its lines; the foot carries EN CRÉDITO, VENCE PRONTO, VENCIDA or PAGADA. No debt means no stamp.

A score is a number, its word as a stamp, and its reasons in a ruled list marked "A favor" or "En contra" in words, with no tick or warning glyphs. A late payment keeps its PAGADA stamp, in amber, with "N días de atraso" beside it. A switch is a blue-ruled row with its state in words ("Sí" / "No") beside the track. A record shown to strangers (`/compartido`) carries the logo, full dates with the year, and a closing line under a double rule.

A form's news (hint, busy, error) has one place that is always there: above its button on a phone, beside it with room. It never moves the button. A page inside the Shell that needs two panes builds them against its own container (`@container/panes`; Nueva factura splits at 44 rem); `Split` is for pages without the Shell. A choice between two forms is a pair of tabs in the navigation's language: the current one is paper, the other is blue. A small stamp does not wrap, so its word stays short (INVITADO).

Any write that removes a row or changes what is under the thumb (create an invoice, approve, remove, link) gets a re-entry guard, the tap shield and `settle(HOLD_MS)`. Destructive actions live in the row's menu and take a second tap.

## Motion

In a payment flow, motion never delays or blurs what happened.

- One moment of delight: when a payment completes the stamp lands once (scale 1.15 to 1, 180 ms, a short vibration where the phone allows).
- An invoice prints in once on first load (clip reveal, 240 ms).
- Everything else is press feedback: scale 0.97 in 120 ms. No staggered lists, scroll effects or page transitions.
- Nothing animates while a payment runs. `prefers-reduced-motion` gets opacity only. Hover styles apply only with a mouse.

## Behaviour the design wraps and never breaks

- A button that can move money ignores taps for 0.6 s after it appears (`arriving`, `useQuietOnArrival`), and ignores a tap that lands where the tap before it hit something else (`useSameSpotGuard`): that tap was meant for what used to be there.
- A refresh can add rows above a button. For a beat after its block changes place on the page, the button ignores taps (`useMovedGuard`, on the distributor's cash hand-in).
- When a payment removes a button, something inert holds its place (`Held`). The tap shield covers the screen while a payment runs and stays until the taps have stopped for 2.2 s (`settle(HOLD_MS)`).
- While data is stale the screen says "Cargando..." or locks its buttons.
- "Pagar este monto" stays inside its own row, never in a bar at the bottom.
- On the driver's route a stop opens in place (`?parada=`), and "Recibí efectivo" is quiet for a beat each time one opens. The stop shown beside the list never changes on its own: a payment that arrives cannot put another stop's button under the thumb.

## Words

Every string goes through `t("español", "English")`, in usted. Screens say "dólares digitales". The words blockchain, wallet and crypto never appear; "Ver detalles" is the only way to the public record.

## Checking a screen

`node scripts/screens.mjs <group>` opens each screen at 30 device sizes, from a 280 px fold to 1920 px, portrait and sideways, fails on sideways scroll, a page wider than the screen (a phone would zoom out), clipped text or a touch target under 44 px, and writes a contact sheet to `docs/screenshots/redesign/`. Add `--lang en`, `--zoom 2` (200% zoom), `--text 1.5` (large system text), `--size 1280x800` (one size) or, last, `--full` (the whole page, not the first screenful). Two frames are fixed: at 360x640 the shop sees all three pay options without scrolling (the slip tightens and folds its lines on a short screen: the `short:` and `tall:` variants), and at 1280x800 the distributor sees the header strip and ten invoice rows.

`node scripts/pay-taps.mjs` taps every pay button on the shop's invoice, the driver's "Recibí efectivo", "Pagar deuda" on Mi cuenta, a stop's row at the spot where that button will be (no cash may be recorded), the distributor's cash hand-in with two drivers holding cash, "Crear factura" and the admin's "Aprobar", twice quickly, then every second, then every two seconds. Screens that need a session (the `admin` group, and those last two) are checked by swapping their server-action answers in Playwright. It fails unless each run makes one payment (or one hand-in, or one write) and no later tap reaches a button or a link.
