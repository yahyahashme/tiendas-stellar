import "server-only";

import { cookies } from "next/headers";
import { userForSession, type User } from "./accounts";
import { signValue, unsignValue } from "./crypto";
import { getDb } from "./db";

// The session cookie: a random id, signed with SESSION_SECRET, httpOnly. The
// browser never sees a key or a hash.

const COOKIE = "relay_session";

export async function sessionId(): Promise<string | null> {
  return unsignValue((await cookies()).get(COOKIE)?.value);
}

export async function startSession(id: string): Promise<void> {
  (await cookies()).set(COOKIE, signValue(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null (also when there's no database). */
export async function currentUser(): Promise<User | null> {
  if (!getDb()) return null;
  try {
    return await userForSession(await sessionId());
  } catch (error) {
    console.error("[session]", error instanceof Error ? error.message : error);
    return null;
  }
}
