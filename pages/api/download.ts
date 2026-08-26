import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DASHBOARD_BUCKET, isValidUuid } from "@/lib/uploadRules";

// Anyone may download a dashboard file -- no account needed, as intended.
// The bucket itself stays private: this hands out a short-lived signed link
// each time, so the files can never be listed or guessed at wholesale.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = typeof req.query.id === "string" ? req.query.id : "";

  if (!isValidUuid(id)) {
    res.status(400).json({ error: "bad_id" });
    return;
  }

  try {
    const admin = supabaseAdmin();

    // Only file_path is selected. The owner's id is never read here, so it
    // cannot end up in a response by accident.
    const { data: row } = await admin
      .from("submissions")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();

    if (!row) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { data, error } = await admin.storage
      .from(DASHBOARD_BUCKET)
      .createSignedUrl(row.file_path, 120, { download: true });

    if (error || !data) {
      console.error("createSignedUrl failed:", error);
      res.status(500).json({ error: "could_not_sign" });
      return;
    }

    res.redirect(302, data.signedUrl);
  } catch (err) {
    console.error("download failed:", err);
    res.status(500).json({ error: "server_error" });
  }
}
