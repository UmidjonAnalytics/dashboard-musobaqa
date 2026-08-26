import type { NextApiRequest, NextApiResponse } from "next";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentPhase } from "@/lib/phase";
import {
  MAX_FILE_BYTES,
  MAX_IMAGES,
  MIN_IMAGES,
  isCompetition,
  isValidUuid,
} from "@/lib/uploadRules";

type IncomingImage = {
  url: string;
  isMain: boolean;
};

// Records the submission once its files are already sitting in Storage.
// Only small pieces of text reach this endpoint, so it stays far under
// Vercel's 4.5 MB request limit.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
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

    const { phase } = await getCurrentPhase();
    if (phase !== "upload") {
      res.status(403).json({ error: "not_upload_phase", phase: phase });
      return;
    }

    const body = req.body || {};
    const submissionId = body.submissionId;
    const competition = body.competition;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const rawDescription = typeof body.description === "string" ? body.description.trim() : "";
    const description = rawDescription.length > 0 ? rawDescription : null;
    const filePath = typeof body.filePath === "string" ? body.filePath : "";
    const fileSize = Number(body.fileSize);
    const images: IncomingImage[] = Array.isArray(body.images) ? body.images : [];

    if (!isValidUuid(submissionId)) {
      res.status(400).json({ error: "bad_submission_id" });
      return;
    }
    if (!isCompetition(competition)) {
      res.status(400).json({ error: "bad_competition" });
      return;
    }
    if (title.length < 1 || title.length > 200) {
      res.status(400).json({ error: "bad_title" });
      return;
    }
    if (description !== null && description.length > 2000) {
      res.status(400).json({ error: "description_too_long" });
      return;
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_BYTES) {
      res.status(400).json({ error: "bad_file_size" });
      return;
    }
    if (images.length < MIN_IMAGES || images.length > MAX_IMAGES) {
      res.status(400).json({ error: "bad_image_count" });
      return;
    }

    let mainCount = 0;
    for (const img of images) {
      if (!img || typeof img.url !== "string" || img.url.length < 1 || img.url.length > 1000) {
        res.status(400).json({ error: "bad_image_url" });
        return;
      }
      if (img.isMain === true) mainCount = mainCount + 1;
    }
    if (mainCount !== 1) {
      res.status(400).json({ error: "need_exactly_one_main" });
      return;
    }

    // The file path is rebuilt from trusted pieces and compared against what
    // the browser claims, so a tampered request cannot point the submission
    // at somebody else's file.
    const expectedPrefix = competition + "/" + submissionId + "/";
    if (filePath.indexOf(expectedPrefix) !== 0) {
      res.status(400).json({ error: "bad_file_path" });
      return;
    }

    // Insert the submission. The database's own rules are the real
    // gatekeeper here: one entry per student per competition, the file path
    // shape, and (once the images go in) exactly one main image.
    const { error: subError } = await admin.from("submissions").insert({
      id: submissionId,
      competition: competition,
      owner_telegram_id: session.telegramId,
      title: title,
      description: description,
      file_path: filePath,
      file_size_bytes: Math.round(fileSize),
    });

    if (subError) {
      console.error("submission insert failed:", subError);
      if (subError.code === "23505") {
        res.status(409).json({ error: "already_submitted" });
        return;
      }
      res.status(400).json({ error: "insert_failed", detail: subError.message });
      return;
    }

    const imageRows = images.map(function (img, index) {
      return {
        submission_id: submissionId,
        image_url: img.url,
        is_main: img.isMain === true,
        position: index + 1,
      };
    });

    const { error: imgError } = await admin.from("submission_images").insert(imageRows);

    if (imgError) {
      console.error("image insert failed:", imgError);
      // Roll back by hand so a half-finished submission never lingers.
      await admin.from("submissions").delete().eq("id", submissionId);
      res.status(400).json({ error: "image_insert_failed", detail: imgError.message });
      return;
    }

    res.status(200).json({ ok: true, submissionId: submissionId });
  } catch (err) {
    console.error("submit failed:", err);
    res.status(500).json({ error: "server_error" });
  }
}
