// Demo phone numbers for the "Recordar por WhatsApp" button (#32). They are
// off-chain on purpose: phone numbers never go on the public ledger (context §8.4).
// They are made up but look real, so a real person may own them. The dashboard uses them only to
// decide which shops get the button: its link goes to DEMO_WHATSAPP (or to no number), so nobody else is messaged by mistake.
/** The demo's shops, so the dashboard shows each one even when none of its invoices is on the loaded page. */
export const DEMO_SHOP_IDS = ["tienda-1", "tienda-2", "tienda-3"];

export const DEMO_PHONES: Record<string, string> = {
  "tienda-1": "7000-0001",
  "tienda-2": "7000-0002",
  "tienda-3": "7000-0003",
};

/**
 * Where every demo reminder goes: the team's own WhatsApp number, set on the deployment as
 * NEXT_PUBLIC_DEMO_WHATSAPP (country code first, digits only) and kept out of the repo.
 * Not set: "" and the link carries no number, so WhatsApp asks who to send the message to.
 */
export const DEMO_WHATSAPP = (process.env.NEXT_PUBLIC_DEMO_WHATSAPP ?? "").replace(/\D/g, "");
