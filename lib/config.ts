// Non-secret settings. Every actual secret comes from Vercel's
// Environment Variables screen, never from this file.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

export const SESSION_COOKIE_NAME = "session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// How long a login link stays usable before it must be regenerated.
export const LOGIN_TOKEN_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
