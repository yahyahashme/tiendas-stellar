"use server";

// Sign-up, sign-in and the session cookie (#129). The cookie holds a random
// session id, signed with SESSION_SECRET, httpOnly: the browser never sees a key.

import { endSession, signIn, signUp, type Role } from "@/lib/server/accounts";
import { getDb } from "@/lib/server/db";
import { callerIp, clearEvents, countRecent, noteEvent, signUpBlocked, TOO_MANY, WRONG_PASSWORD } from "@/lib/server/rate-limit";
import { clearSession, currentUser, sessionId, startSession } from "@/lib/server/session";
import { config } from "@/lib/stellar/config";

const NO_ACCOUNTS = "Las cuentas todavía no están activas en este servidor.";
const TRY_LATER = "No pudimos crear su cuenta en este momento. Intente de nuevo en un minuto.";

/** What the screens may know about the signed-in person. No keys, no hashes. */
export type CurrentUser = {
  name: string;
  role: Role;
  contact: string;
  stellarAddress: string;
  explorerUrl: string;
};

export type AuthReply = { ok: true } | { ok: false; message: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await currentUser();
  if (!user) return null;
  return {
    name: user.name,
    role: user.role,
    contact: user.phone ?? user.email ?? "",
    stellarAddress: user.stellarAddress,
    explorerUrl: `${config.explorer}/account/${user.stellarAddress}`,
  };
}

export async function signUpAction(input: { role: Role; name: string; contact: string; password: string }): Promise<AuthReply> {
  if (!getDb()) return { ok: false, message: NO_ACCOUNTS };
  try {
    if (await signUpBlocked()) return { ok: false, message: TOO_MANY };
    const result = await signUp(input);
    if (!result.ok) return result;
    await startSession(result.sessionId);
    return { ok: true };
  } catch (error) {
    console.error("[auth] sign-up", error instanceof Error ? error.message : error);
    return { ok: false, message: TRY_LATER };
  }
}

export async function signInAction(contact: string, password: string): Promise<AuthReply> {
  const db = getDb();
  if (!db) return { ok: false, message: NO_ACCOUNTS };
  try {
    // Wrong passwords: a few per phone or email, a few more per IP, then wait.
    const byContact = `signin:${String(contact).trim().toLowerCase().replace(/[\s()-]/g, "")}`;
    const byIp = `signin-ip:${await callerIp()}`;
    const [forContact, forIp] = await Promise.all([
      countRecent(db, byContact, WRONG_PASSWORD.windowSeconds),
      countRecent(db, byIp, WRONG_PASSWORD.windowSeconds),
    ]);
    if (forContact >= WRONG_PASSWORD.max || forIp >= WRONG_PASSWORD.max * 3) return { ok: false, message: TOO_MANY };
    const result = await signIn(contact, password);
    if (!result.ok) {
      await Promise.all([noteEvent(db, byContact), noteEvent(db, byIp)]);
      return result;
    }
    await clearEvents(db, byContact);
    await startSession(result.sessionId);
    return { ok: true };
  } catch (error) {
    console.error("[auth] sign-in", error instanceof Error ? error.message : error);
    return { ok: false, message: "No se pudo completar. Intente de nuevo." };
  }
}

export async function signOutAction(): Promise<void> {
  try {
    await endSession(await sessionId());
  } finally {
    await clearSession();
  }
}
