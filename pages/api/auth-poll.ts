import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recordLoginAndCheckEligibility } from "@/lib/loginFlow";
import { signSession, buildSessionCookie } from "@/lib/session";
import { LOGIN_TOKEN_LIFETIME_MS } from "@/lib/config";

// The /kirish page calls this about once every 1.5 seconds while it waits
// for the student to tap "Ha, tasdiqlayman" inside Telegram.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).json({ status: "invalid" });
    return;
  }

  try {
    const admin = supabaseAdmin();

    const { data: row } = await admin
      .from("login_tokens")
      .select("status, telegram_id, username, first_name, created_at")
      .eq("token", token)
      .maybeSingle();

    if (!row) {
      res.status(200).json({ status: "invalid" });
      return;
    }

    const ageMs = Date.now() - new Date(row.created_at).getTime();

    if (row.status === "pending") {
      if (ageMs > LOGIN_TOKEN_LIFETIME_MS) {
        await admin.from("login_tokens").delete().eq("token", token);
        res.status(200).json({ status: "expired" });
        return;
      }
      res.status(200).json({ status: "pending" });
      return;
    }

    if (row.status === "cancelled") {
      await admin.from("login_tokens").delete().eq("token", token);
      res.status(200).json({ status: "cancelled" });
      return;
    }

    // From here on the status is "confirmed". The ticket is single-use, so
    // it is deleted immediately -- it can never be replayed.
    await admin.from("login_tokens").delete().eq("token", token);

    if (row.telegram_id === null || row.telegram_id === undefined) {
      res.status(200).json({ status: "invalid" });
      return;
    }

    const eligible = await recordLoginAndCheckEligibility({
      id: row.telegram_id,
      username: row.username ? row.username : null,
      first_name: row.first_name ? row.first_name : "Talaba",
    });

    if (!eligible) {
      res.status(200).json({ status: "confirmed", eligible: false });
      return;
    }

    const cookieValue = signSession({
      telegramId: row.telegram_id,
      issuedAt: Math.floor(Date.now() / 1000),
    });

    res.setHeader("Set-Cookie", buildSessionCookie(cookieValue));
    res.status(200).json({ status: "confirmed", eligible: true });
  } catch (err) {
    console.error("auth-poll failed:", err);
    res.status(500).json({ status: "error" });
  }
}
