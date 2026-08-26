import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./config";

// A small signed cookie built with Node's own crypto module:
//    base64url(payload) + "." + hex signature
// No auth library needed. The signature means a student cannot edit the
// cookie to claim to be somebody else -- any change breaks the signature.

export type SessionPayload = {
  telegramId: number;
  issuedAt: number; // seconds since 1970
};

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET is not set in Vercel.");
  return secret;
}

export function signSession(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encoded).digest("hex");
  return encoded + "." + signature;
}

export function verifySession(cookieValue: string | undefined | null): SessionPayload | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const encoded = parts[0];
  const signature = parts[1];

  let expected: string;
  try {
    expected = createHmac("sha256", getSecret()).update(encoded).digest("hex");
  } catch {
    return null;
  }

  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(signature, "hex");
    b = Buffer.from(expected, "hex");
  } catch {
    return null;
  }
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    const ageSeconds = Math.floor(Date.now() / 1000) - payload.issuedAt;
    if (!Number.isFinite(payload.telegramId)) return null;
    if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSessionCookie(value: string): string {
  return [
    SESSION_COOKIE_NAME + "=" + value,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + SESSION_MAX_AGE_SECONDS,
  ].join("; ");
}

export function buildLogoutCookie(): string {
  return [
    SESSION_COOKIE_NAME + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}
