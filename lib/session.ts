import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_MAX_AGE_SECONDS } from "./config";

// A small, hand-rolled signed cookie: base64url(payload) + "." + hex HMAC.
// No auth library needed -- Node's built-in crypto module is enough.

export type SessionPayload = {
  telegramId: number;
  issuedAt: number; // seconds since epoch
};

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("COOKIE_SECRET environment variable is not set.");
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
}

export function verifySession(cookieValue: string | undefined | null): SessionPayload | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  let expected: string;
  try {
    expected = createHmac("sha256", getSecret()).update(encoded).digest("hex");
  } catch {
    return null;
  }

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    const ageSeconds = Math.floor(Date.now() / 1000) - payload.issuedAt;
    if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
