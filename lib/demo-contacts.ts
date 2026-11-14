// Demo phone numbers for the "Recordar por WhatsApp" button (#32). They are
// off-chain on purpose: phone numbers never go on the public ledger (context §8.4).
// They are made up but look real, so a real person may own them. The dashboard uses them only to
// decide which shops get the button: its link goes to DEMO_WHATSAPP, so nobody else is messaged by mistake.
/** The demo's shops, so the dashboard shows each one even when none of its invoices is on the loaded page. */
export const DEMO_SHOP_IDS = ["tienda-1", "tienda-2", "tienda-3"];

export const DEMO_PHONES: Record<string, string> = {
  "tienda-1": "7000-0001",
  "tienda-2": "7000-0002",
  "tienda-3": "7000-0003",
};

/** Where every demo reminder goes: the team's own WhatsApp number (country code first, digits only). */
export const DEMO_WHATSAPP = "12268982385";
