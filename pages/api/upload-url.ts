import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentPhase } from "@/lib/phase";
import {
  DASHBOARD_BUCKET,
  SCREENSHOT_BUCKET,
  IMAGE_EXTS,
  allowedDashboardExts,
  buildStoragePath,
  isCompetition,
  isValidUuid,
} from "@/lib/uploadRules";

// Hands the browser a one-time signed URL so the dashboard file goes
// STRAIGHT from the student's computer to Supabase Storage. It never
// passes through this server -- which matters because Vercel's free tier
// refuses request bodies over 4.5 MB, and a .pbix can be 25 MB.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    // --- who is asking -----------------------------------------------------
    const session = verifySession(req.cookies[SESSION_COOKIE_NAME]);
    if (!session) {
      res.status(401).json({ error: "not_logged_in" });
      return;
    }

    const admin = supabaseAdmin();
    const { data: user } = await admin
      .from("users")
      .select("telegram_id, manual_eligible, eligible_auto")
      .eq("telegram_id", session.telegramId)
      .maybeSingle();

    if (!user || (user.manual_eligible !== true && user.eligible_auto !== true)) {
      res.status(403).json({ error: "not_eligible" });
      return;
    }

    // --- is uploading open right now ---------------------------------------
    const { phase } = await getCurrentPhase();
    if (phase !== "upload") {
      res.status(403).json({ error: "not_upload_phase", phase: phase });
      return;
    }

    // --- what are they asking for ------------------------------------------
    const body = req.body || {};
    const competition = body.competition;
    const submissionId = body.submissionId;
    const kind = body.kind; // "dashboard" or "image"
    const ext = typeof body.ext === "string" ? body.ext.toLowerCase() : "";

    if (!isCompetition(competition)) {
      res.status(400).json({ error: "bad_competition" });
      return;
    }
    if (typeof submissionId !== "string" || !isValidUuid(submissionId)) {
      res.status(400).json({ error: "bad_submission_id" });
      return;
    }

    let bucket: string;
    if (kind === "dashboard") {
      if (allowedDashboardExts(competition).indexOf(ext) === -1) {
        res.status(400).json({ error: "bad_extension" });
        return;
      }
      bucket = DASHBOARD_BUCKET;
    } else if (kind === "image") {
      if (IMAGE_EXTS.indexOf(ext) === -1) {
        res.status(400).json({ error: "bad_extension" });
        return;
      }
      bucket = SCREENSHOT_BUCKET;
    } else {
      res.status(400).json({ error: "bad_kind" });
      return;
    }

    // --- one submission per student per competition -------------------------
    const { data: existing } = await admin
      .from("submissions")
      .select("id")
      .eq("competition", competition)
      .eq("owner_telegram_id", session.telegramId)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: "already_submitted" });
      return;
    }

    // --- make the signed URL ------------------------------------------------
    const randomName = randomBytes(16).toString("hex");
    const path = buildStoragePath(competition, submissionId, randomName, ext);

    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      console.error("createSignedUploadUrl failed:", error);
      res.status(500).json({ error: "could_not_sign", detail: error ? error.message : null });
      return;
    }

    res.status(200).json({
      bucket: bucket,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    console.error("upload-url failed:", err);
    res.status(500).json({ error: "server_error" });
  }
}
