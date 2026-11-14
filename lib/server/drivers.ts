import "server-only";

import { normalizePhone, signUp, type AuthResult, type User } from "./accounts";
import { newId, newToken } from "./crypto";
import { requireDb } from "./db";
import { invalidateDirectory } from "./directory";
import type { WalletNetwork } from "./wallet";

// Drivers join by invite link (#131): the distributor types a name and phone,
// sends the link, and the driver sets a password. Their account gets its own
// Stellar address (#129) and is linked to that distributor.

export type Invite = {
  token: string;
  distributorId: string;
  distributorName: string;
  name: string;
  phone: string;
  driverId: string | null;
  createdAt: string;
};

export type DriverRow = {
  /** The driver's id once joined; the invite token while it's pending. */
  id: string;
  name: string;
  phone: string | null;
  status: "activo" | "invitado";
  inviteToken: string | null;
};

type InviteRow = {
  token: string;
  distributor_id: string;
  distributor_name: string;
  name: string;
  phone: string;
  driver_id: string | null;
  created_at: string | Date;
};

const toInvite = (r: InviteRow): Invite => ({
  token: r.token,
  distributorId: r.distributor_id,
  distributorName: r.distributor_name,
  name: r.name,
  phone: r.phone,
  driverId: r.driver_id,
  createdAt: new Date(r.created_at).toISOString(),
});

export async function createInvite(distributorId: string, nameText: string, phoneText: string): Promise<Invite | { error: string }> {
  const name = nameText.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return { error: "Escriba el nombre del motorista." };
  const phone = normalizePhone(phoneText);
  if (!phone) return { error: "Escriba un teléfono de El Salvador (8 dígitos)." };
  const db = requireDb();
  const taken = await db.query(
    `SELECT 1 FROM driver_invites WHERE distributor_id = $1 AND phone = $2 AND removed_at IS NULL AND driver_id IS NULL`,
    [distributorId, phone],
  );
  if (taken.length > 0) return { error: "Ya invitó a ese teléfono. Comparta el mismo enlace." };
  const token = newToken();
  await db.query(`INSERT INTO driver_invites (token, distributor_id, name, phone) VALUES ($1, $2, $3, $4)`, [token, distributorId, name, phone]);
  return (await inviteByToken(token))!;
}

export async function inviteByToken(token: string): Promise<Invite | null> {
  const rows = await requireDb().query<InviteRow>(
    `SELECT i.*, d.business_name AS distributor_name
       FROM driver_invites i JOIN distributors d ON d.id = i.distributor_id
      WHERE i.token = $1 AND i.removed_at IS NULL AND d.status = 'aprobado'`,
    [token],
  );
  return rows[0] ? toInvite(rows[0]) : null;
}

/** The driver signs up from the link: account + Stellar address, linked to the distributor. */
export async function acceptInvite(token: string, nameText: string, password: string, network?: WalletNetwork): Promise<AuthResult & { driverId?: string }> {
  const invite = await inviteByToken(token);
  if (!invite) return { ok: false, message: "Esta invitación ya no es válida. Pida otra a su distribuidora." };
  if (invite.driverId) return { ok: false, message: "Esta invitación ya se usó. Entre con su contraseña." };
  const result = await signUp({ role: "motorista", name: nameText || invite.name, contact: invite.phone, password }, network, { viaInvite: true });
  if (!result.ok) return result;
  const driverId = newId("m");
  const db = requireDb();
  await db.query(
    `INSERT INTO drivers (id, user_id, distributor_id, name, phone, stellar_address) VALUES ($1, $2, $3, $4, $5, $6)`,
    [driverId, result.user.id, invite.distributorId, result.user.name, invite.phone, result.user.stellarAddress],
  );
  await db.query(`UPDATE driver_invites SET driver_id = $2 WHERE token = $1`, [token, driverId]);
  invalidateDirectory();
  return { ...result, driverId };
}

/** The driver id for a signed-in driver, or null. */
export async function driverIdForUser(user: User): Promise<string | null> {
  if (user.role !== "motorista") return null;
  const rows = await requireDb().query<{ id: string }>(`SELECT id FROM drivers WHERE user_id = $1 AND active ORDER BY created_at DESC LIMIT 1`, [user.id]);
  return rows[0]?.id ?? null;
}

/** Joined drivers and pending invites, newest first. */
export async function listDrivers(distributorId: string): Promise<DriverRow[]> {
  const db = requireDb();
  const [drivers, invites] = await Promise.all([
    db.query<{ id: string; name: string; phone: string | null }>(
      `SELECT id, name, phone FROM drivers WHERE distributor_id = $1 AND active ORDER BY created_at DESC`,
      [distributorId],
    ),
    db.query<{ token: string; name: string; phone: string }>(
      `SELECT token, name, phone FROM driver_invites WHERE distributor_id = $1 AND driver_id IS NULL AND removed_at IS NULL ORDER BY created_at DESC`,
      [distributorId],
    ),
  ]);
  return [
    ...invites.map((i) => ({ id: i.token, name: i.name, phone: i.phone, status: "invitado" as const, inviteToken: i.token })),
    ...drivers.map((d) => ({ id: d.id, name: d.name, phone: d.phone, status: "activo" as const, inviteToken: null })),
  ];
}

/** "Quitar": a pending invite stops working; a joined driver leaves the list (their history stays). */
export async function removeDriver(distributorId: string, id: string): Promise<boolean> {
  const db = requireDb();
  const invite = await db.query(
    `UPDATE driver_invites SET removed_at = now() WHERE token = $1 AND distributor_id = $2 AND removed_at IS NULL RETURNING token`,
    [id, distributorId],
  );
  if (invite.length > 0) return true;
  const driver = await db.query(`UPDATE drivers SET active = false WHERE id = $1 AND distributor_id = $2 AND active RETURNING id`, [id, distributorId]);
  invalidateDirectory();
  return driver.length > 0;
}
