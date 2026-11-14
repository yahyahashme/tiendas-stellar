"use server";

// Drivers by invite link (#131): the distributor invites, the driver signs up
// from the link, and the distributor's list shows who joined.

import { getDb } from "@/lib/server/db";
import { getDirectory } from "@/lib/server/directory";
import { distributorForUser } from "@/lib/server/distributors";
import { signUpBlocked, TOO_MANY } from "@/lib/server/rate-limit";
import { acceptInvite, createInvite, driverIdForUser, inviteByToken, listDrivers, removeDriver } from "@/lib/server/drivers";
import { currentUser, startSession } from "@/lib/server/session";
import { readClient } from "@/lib/stellar/client";
import { read } from "@/lib/stellar/send";
import { toDollars } from "@/lib/stellar/units";

type Reply = { ok: true } | { ok: false; message: string };
const NOT_YOURS = "Solo la distribuidora aprobada puede hacer esto.";

/** The signed-in user's approved distributor, or null. */
async function myApprovedDistributor() {
  const user = await currentUser();
  if (user?.role !== "distribuidora") return null;
  const distributor = await distributorForUser(user.id);
  return distributor?.status === "aprobado" ? distributor : null;
}

export type InviteView = { token: string; name: string; phone: string };

export async function inviteDriverAction(name: string, phone: string): Promise<({ ok: true } & InviteView) | { ok: false; message: string }> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return { ok: false, message: NOT_YOURS };
  const invite = await createInvite(distributor.id, name, phone);
  if ("error" in invite) return { ok: false, message: invite.error };
  return { ok: true, token: invite.token, name: invite.name, phone: invite.phone };
}

export type MyDriver = {
  id: string;
  name: string;
  phone: string | null;
  status: "activo" | "invitado";
  inviteToken: string | null;
  cashHeld: number;
};

/** null when the viewer isn't an approved distributor. */
export async function getMyDrivers(): Promise<{ distributorName: string; drivers: MyDriver[] } | null> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return null;
  const [rows, directory] = await Promise.all([listDrivers(distributor.id), getDirectory()]);
  const drivers = await Promise.all(
    rows.map(async (row) => {
      const party = row.status === "activo" ? directory.find(row.id, "driver") : undefined;
      const cashHeld = party ? toDollars(await read(readClient().get_driver_cash({ driver: party.address }))) : 0;
      return { ...row, cashHeld };
    }),
  );
  return { distributorName: distributor.businessName, drivers };
}

export async function removeDriverAction(id: string): Promise<Reply> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return { ok: false, message: NOT_YOURS };
  return (await removeDriver(distributor.id, id)) ? { ok: true } : { ok: false, message: "No encontramos a ese motorista." };
}

// ---------- the driver's side ----------

export type InvitePreview = { distributorName: string; name: string; phoneEnd: string };

/** What the invite page shows before sign-up. The phone is only hinted ("…4567"). */
export async function getInvite(token: string): Promise<InvitePreview | null> {
  if (!getDb()) return null;
  const invite = await inviteByToken(token);
  if (!invite || invite.driverId) return null;
  return { distributorName: invite.distributorName, name: invite.name, phoneEnd: invite.phone.slice(-4) };
}

export async function acceptInviteAction(token: string, name: string, password: string): Promise<({ ok: true; driverId: string }) | { ok: false; message: string }> {
  if (!getDb()) return { ok: false, message: "Las cuentas todavía no están activas en este servidor." };
  try {
    if (await signUpBlocked()) return { ok: false, message: TOO_MANY };
    const result = await acceptInvite(token, name, password);
    if (!result.ok) return result;
    await startSession(result.sessionId);
    return { ok: true, driverId: result.driverId! };
  } catch (error) {
    console.error("[driver] accept", error instanceof Error ? error.message : error);
    return { ok: false, message: "No pudimos crear su cuenta en este momento. Intente de nuevo en un minuto." };
  }
}

/** The signed-in driver's id, for "Ir a mi ruta". */
export async function getMyDriverId(): Promise<string | null> {
  const user = await currentUser();
  return user ? driverIdForUser(user) : null;
}
