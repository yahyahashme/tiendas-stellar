import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

// ---------- passwords: scrypt (Node's built-in), salted ----------

const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;

/** "scrypt$16384$8$1$<salt>$<hash>" (base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, saltB64, hashB64] = stored.split("$");
  if (kind !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- secret keys at rest: AES-256-GCM with WALLET_KEY ----------

function walletKey(): Buffer {
  const raw = process.env.WALLET_KEY;
  if (!raw) throw new Error("WALLET_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("WALLET_KEY must be 32 bytes, base64 (openssl rand -base64 32)");
  return key;
}

/** "v1:<iv>:<tag>:<ciphertext>" (base64). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", walletKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(sealed: string): string {
  const [version, ivB64, tagB64, dataB64] = sealed.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Unknown sealed secret format");
  const decipher = createDecipheriv("aes-256-gcm", walletKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

// ---------- session cookie: "<id>.<HMAC>" with SESSION_SECRET ----------

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET is not set");
  return secret;
}

const mac = (value: string) => createHmac("sha256", sessionSecret()).update(value).digest("base64url");

export function signValue(value: string): string {
  return `${value}.${mac(value)}`;
}

/** The value if the signature is right, else null. */
export function unsignValue(signed: string | undefined): string | null {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = signed.slice(0, dot);
  const given = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(mac(value));
  return given.length === expected.length && timingSafeEqual(given, expected) ? value : null;
}

// ---------- ids ----------

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l: ids show up in URLs and invites

/** "t-k3f9x2mq7a": a prefix and 10 random characters. */
export function newId(prefix: string, length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `${prefix}-${out}`;
}

/** A long random token for sessions and invites. */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}
