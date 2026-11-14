import "server-only";

import { hashPassword, newId, newToken, verifyPassword } from "./crypto";
import { requireDb } from "./db";
import { invalidateDirectory } from "./directory";
import { createWallet, type WalletNetwork } from "./wallet";

// Users, passwords and sessions (#129). Messages are Spanish, like every
// receipt; lib/i18n.tsx translates them on screen.

export type Role = "tienda" | "distribuidora" | "motorista" | "admin";

export type User = {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  email: string | null;
  stellarAddress: string;
};

export type AuthResult = { ok: true; user: User; sessionId: string } | { ok: false; message: string };

export const SESSION_DAYS = 30;
export const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

/** Passwords anyone would try first. */
const EASY = new Set(["12345678", "123456789", "1234567890", "87654321", "11111111", "00000000", "password", "contraseña", "qwertyui", "abcdefgh"]);

/** What's wrong with a new password, or null. */
export function passwordProblem(password: string): string | null {
  if (password.trim().length < MIN_PASSWORD || password.length > MAX_PASSWORD) return "La contraseña debe tener al menos 8 caracteres.";
  if (EASY.has(password.trim().toLowerCase()) || /^(.)\1+$/.test(password)) return "Esa contraseña es muy fácil de adivinar. Use otra.";
  return null;
}

/** El Salvador numbers: 8 digits starting with 2, 6 or 7, with or without +503. */
export function normalizePhone(text: string): string | null {
  const digits = text.replace(/[\s()-]/g, "").replace(/^\+?503/, "");
  return /^[267]\d{7}$/.test(digits) ? `+503${digits}` : null;
}

export function normalizeEmail(text: string): string | null {
  const email = text.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

/** A phone or an email, whichever it looks like. */
export function parseContact(text: string): { phone: string } | { email: string } | null {
  if (text.includes("@")) {
    const email = normalizeEmail(text);
    return email ? { email } : null;
  }
  const phone = normalizePhone(text);
  return phone ? { phone } : null;
}

type UserRow = {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  email: string | null;
  stellar_address: string;
  password_hash: string;
};

const toUser = (row: UserRow): User => ({
  id: row.id,
  role: row.role,
  name: row.name,
  phone: row.phone,
  email: row.email,
  stellarAddress: row.stellar_address,
});

async function findByContact(contact: { phone: string } | { email: string }): Promise<UserRow | undefined> {
  const db = requireDb();
  const [column, value] = "phone" in contact ? ["phone", contact.phone] : ["email", contact.email];
  const rows = await db.query<UserRow>(`SELECT * FROM users WHERE ${column} = $1`, [value]);
  return rows[0];
}

async function newSession(userId: string): Promise<string> {
  const id = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await requireDb().query(`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [id, userId, expires.toISOString()]);
  return id;
}

export type SignUpInput = { role: Role; name: string; contact: string; password: string };

/**
 * A new user with their own Stellar account (funded, with the USDC trustline).
 * Drivers only come in through a distributor's invite (#131), admins by hand.
 */
export async function signUp(
  input: SignUpInput,
  network?: WalletNetwork,
  options: { viaInvite?: boolean } = {},
): Promise<AuthResult> {
  const allowed = options.viaInvite ? ["motorista"] : ["tienda", "distribuidora"];
  if (!allowed.includes(input.role)) {
    return { ok: false, message: "Los motoristas se registran con la invitación de su distribuidora." };
  }
  // A raw Server Action POST can send anything: only strings go further.
  if (typeof input.name !== "string" || typeof input.contact !== "string" || typeof input.password !== "string") {
    return { ok: false, message: "Escriba su nombre." };
  }
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return { ok: false, message: "Escriba su nombre." };
  const contact = parseContact(input.contact);
  if (!contact) return { ok: false, message: "Escriba un teléfono de El Salvador (8 dígitos) o un correo válido." };
  const weak = passwordProblem(input.password);
  if (weak) return { ok: false, message: weak };
  if (await findByContact(contact)) {
    return { ok: false, message: "Ya hay una cuenta con ese teléfono o correo. Entre con su contraseña." };
  }

  // Hash first: if anything is wrong with the password, no Stellar account gets funded.
  const passwordHash = await hashPassword(input.password);
  const wallet = await createWallet(network);
  const id = newId("u");
  const db = requireDb();
  await db.query(`INSERT INTO wallets (address, secret_enc) VALUES ($1, $2)`, [wallet.address, wallet.secretEnc]);
  try {
    await db.query(
      `INSERT INTO users (id, role, name, phone, email, password_hash, stellar_address) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, input.role, name, "phone" in contact ? contact.phone : null, "email" in contact ? contact.email : null, passwordHash, wallet.address],
    );
  } catch (error) {
    // Two sign-ups with the same phone at the same moment: the second loses on the UNIQUE constraint.
    if (String(error).includes("unique") || String(error).includes("duplicate")) {
      return { ok: false, message: "Ya hay una cuenta con ese teléfono o correo. Entre con su contraseña." };
    }
    throw error;
  }
  invalidateDirectory();
  const user: User = {
    id,
    role: input.role,
    name,
    phone: "phone" in contact ? contact.phone : null,
    email: "email" in contact ? contact.email : null,
    stellarAddress: wallet.address,
  };
  return { ok: true, user, sessionId: await newSession(id) };
}

const WRONG = "Teléfono, correo o contraseña incorrectos.";

let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hashPassword("relay-no-such-user"));

export async function signIn(contactText: string, password: string): Promise<AuthResult> {
  if (typeof contactText !== "string" || typeof password !== "string") return { ok: false, message: WRONG };
  const contact = parseContact(contactText);
  if (!contact) return { ok: false, message: WRONG };
  const row = await findByContact(contact);
  // Check a real hash anyway when there's no such user, so both answers take the same time.
  const ok = await verifyPassword(password, row?.password_hash ?? (await dummyHash()));
  if (!row || !ok) return { ok: false, message: WRONG };
  return { ok: true, user: toUser(row), sessionId: await newSession(row.id) };
}

export async function userForSession(sessionId: string | null): Promise<User | null> {
  if (!sessionId) return null;
  const rows = await requireDb().query<UserRow>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function endSession(sessionId: string | null): Promise<void> {
  if (sessionId) await requireDb().query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}
