import "server-only";

import { requireDb } from "./db";
import { invalidateDirectory } from "./directory";
import { newId } from "./crypto";
import type { User } from "./accounts";

// Distributor sign-up and approval (#130). In the real product a licensed
// partner checks the business (KYB) before "aprobado"; here a Relay admin
// approves, or the demo approves by itself after a few seconds.

export type DistributorStatus = "pendiente" | "aprobado" | "rechazado";

export type Distributor = {
  id: string;
  businessName: string;
  nit: string | null;
  address: string | null;
  sells: string[];
  shopsApprox: number | null;
  driversApprox: number | null;
  status: DistributorStatus;
  stellarAddress: string;
  ownerName: string | null;
  ownerContact: string | null;
  createdAt: string;
};

export const SELLS = ["Snacks", "Bebidas", "Pan", "Lácteos", "Abarrotes", "Limpieza", "Otros"] as const;

export type DistributorDetails = {
  businessName: string;
  nit: string;
  address: string;
  sells: string[];
  shopsApprox: string;
  driversApprox: string;
};

/** "0614-120394-101-3" (El Salvador NIT, 14 digits), dashes optional. */
export function normalizeNit(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 14) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13)}`;
}

/** Spanish message if the details won't do, else null. */
export function checkDetails(d: DistributorDetails): string | null {
  if (d.businessName.trim().length < 2) return "Escriba el nombre de la empresa.";
  if (!normalizeNit(d.nit)) return "El NIT debe tener 14 dígitos.";
  if (d.address.trim().length < 5) return "Escriba la dirección de la empresa.";
  if (d.sells.length === 0 || d.sells.some((s) => !(SELLS as readonly string[]).includes(s))) return "Elija qué vende.";
  for (const n of [d.shopsApprox, d.driversApprox]) {
    if (n.trim() !== "" && !/^\d{1,5}$/.test(n.trim())) return "Escriba un número aproximado.";
  }
  return null;
}

type Row = {
  id: string;
  business_name: string;
  nit: string | null;
  address: string | null;
  sells: string | null;
  shops_approx: number | null;
  drivers_approx: number | null;
  status: DistributorStatus;
  stellar_address: string;
  owner_name: string | null;
  owner_contact: string | null;
  created_at: string | Date;
};

const SELECT = `SELECT d.*, u.name AS owner_name, COALESCE(u.phone, u.email) AS owner_contact
                  FROM distributors d LEFT JOIN users u ON u.id = d.owner_user_id`;

const toDistributor = (r: Row): Distributor => ({
  id: r.id,
  businessName: r.business_name,
  nit: r.nit,
  address: r.address,
  sells: r.sells ? r.sells.split(",") : [],
  shopsApprox: r.shops_approx,
  driversApprox: r.drivers_approx,
  status: r.status,
  stellarAddress: r.stellar_address,
  ownerName: r.owner_name,
  ownerContact: r.owner_contact,
  createdAt: new Date(r.created_at).toISOString(),
});

/** The business for a distributor user, using the user's own Stellar account. */
export async function registerDistributor(user: User, details: DistributorDetails): Promise<Distributor> {
  const id = newId("d");
  const num = (text: string) => (text.trim() === "" ? null : Number(text.trim()));
  await requireDb().query(
    `INSERT INTO distributors (id, owner_user_id, business_name, nit, address, sells, shops_approx, drivers_approx, stellar_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      user.id,
      details.businessName.trim().replace(/\s+/g, " "),
      normalizeNit(details.nit),
      details.address.trim(),
      details.sells.join(","),
      num(details.shopsApprox),
      num(details.driversApprox),
      user.stellarAddress,
    ],
  );
  invalidateDirectory();
  return (await distributorById(id))!;
}

export async function distributorById(id: string): Promise<Distributor | null> {
  const rows = await requireDb().query<Row>(`${SELECT} WHERE d.id = $1`, [id]);
  return rows[0] ? toDistributor(rows[0]) : null;
}

export async function distributorForUser(userId: string): Promise<Distributor | null> {
  const rows = await requireDb().query<Row>(`${SELECT} WHERE d.owner_user_id = $1 ORDER BY d.created_at DESC LIMIT 1`, [userId]);
  return rows[0] ? toDistributor(rows[0]) : null;
}

/** Pending first (oldest first), then the last 20 decided. */
export async function listForAdmin(): Promise<{ pending: Distributor[]; decided: Distributor[] }> {
  const db = requireDb();
  const [pending, decided] = await Promise.all([
    db.query<Row>(`${SELECT} WHERE d.status = 'pendiente' AND d.owner_user_id IS NOT NULL ORDER BY d.created_at ASC`),
    db.query<Row>(
      `${SELECT} WHERE d.status <> 'pendiente' AND d.owner_user_id IS NOT NULL ORDER BY d.decided_at DESC NULLS LAST LIMIT 20`,
    ),
  ]);
  return { pending: pending.map(toDistributor), decided: decided.map(toDistributor) };
}

/** Puts the contract's approval on chain (admin key), then records it. */
export type ApproveOnChain = (stellarAddress: string) => Promise<void>;

export async function decide(id: string, status: "aprobado" | "rechazado", approveOnChain: ApproveOnChain): Promise<Distributor | null> {
  const distributor = await distributorById(id);
  if (!distributor || distributor.status === status) return distributor;
  // The contract has no "un-approve": once approved on chain, rejecting would only change our table.
  if (distributor.status === "aprobado") return distributor;
  if (status === "aprobado") await approveOnChain(distributor.stellarAddress);
  await requireDb().query(`UPDATE distributors SET status = $2, decided_at = now() WHERE id = $1`, [id, status]);
  invalidateDirectory();
  return distributorById(id);
}

/**
 * Seconds after sign-up when the demo approves a distributor by itself, or null
 * for never. Fails closed: only a whole number of seconds (0 to 86400) in
 * RELAY_AUTO_APPROVE_SECONDS turns it on; unset, empty, "off" or anything else is off.
 */
export function autoApproveSeconds(): number | null {
  const raw = (process.env.RELAY_AUTO_APPROVE_SECONDS ?? "").trim().toLowerCase();
  if (!/^\d{1,5}$/.test(raw)) return null;
  const seconds = Number(raw);
  return seconds <= 86_400 ? seconds : null;
}

/** For the waiting screen: approve now if the demo setting says it's time. */
export async function approveIfDue(distributor: Distributor, approveOnChain: ApproveOnChain, now = Date.now()): Promise<Distributor> {
  const seconds = autoApproveSeconds();
  if (distributor.status !== "pendiente" || seconds === null) return distributor;
  if (now - Date.parse(distributor.createdAt) < seconds * 1000) return distributor;
  return (await decide(distributor.id, "aprobado", approveOnChain)) ?? distributor;
}
