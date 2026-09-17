import type { NextApiRequest, NextApiResponse } from "next";

// A tiny diagnostic page. Open https://your-site/api/health in a browser.
//
// If you see JSON, the API layer deployed correctly.
// If you see a 404 page, the pages/api folder did not upload properly.
//
// It reports only whether each secret is PRESENT -- never its value.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    stage: "2 - login and telegram bot",
    envPresent: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_WEBHOOK_SECRET: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      COOKIE_SECRET: !!process.env.COOKIE_SECRET,
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
  });
}
