import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LOGIN_TOKEN_LIFETIME_MS } from "@/lib/config";

// Called by the /kirish page as soon as it opens. Creates a one-time
// ticket that ties this browser tab to whatever happens next in Telegram.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const admin = supabaseAdmin();

    // Housekeeping so this table never grows without bound.
    const cutoff = new Date(Date.now() - LOGIN_TOKEN_LIFETIME_MS).toISOString();
    await admin.from("login_tokens").delete().lt("created_at", cutoff);

    const token = randomBytes(24).toString("hex");
    const { error } = await admin.from("login_tokens").insert({ token: token });

    if (error) {
      console.error("auth-start insert failed:", error);
      res.status(500).json({ error: "could not create login token" });
      return;
    }

    res.status(200).json({ token: token });
  } catch (err) {
    console.error("auth-start failed:", err);
    res.status(500).json({ error: "server error" });
  }
}
