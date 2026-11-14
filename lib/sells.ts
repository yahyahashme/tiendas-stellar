// What a distributor sells (#130), as the sign-up form offers it. The server
// checks the same list (lib/server/distributors.ts SELLS) and stores the Spanish.
export const SELLS = ["Snacks", "Bebidas", "Pan", "Lácteos", "Abarrotes", "Limpieza", "Otros"];

const EN: Record<string, string> = {
  Snacks: "Snacks",
  Bebidas: "Drinks",
  Pan: "Bread",
  Lácteos: "Dairy",
  Abarrotes: "Groceries",
  Limpieza: "Cleaning",
  Otros: "Other",
};

export const sellLabel = (item: string, lang: "es" | "en") => (lang === "en" ? (EN[item] ?? item) : item);
