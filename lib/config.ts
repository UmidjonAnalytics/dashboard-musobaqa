// Small, central place for the non-secret settings the app needs.
// The actual secret values all come from Vercel's Environment Variables.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

export const SESSION_COOKIE_NAME = "session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
