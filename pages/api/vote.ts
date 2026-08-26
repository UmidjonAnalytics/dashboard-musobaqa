import type { NextApiRequest, NextApiResponse } from "next";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentPhase } from "@/lib/phase";
import { isValidUuid } from "@/lib/uploadRules";

const MIN_SUGGESTION = 20;

function isScore(value: unknown): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

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
    if (phase !== "voting") {
      res.status(403).json({ error: "not_voting_phase", phase: phase });
      return;
    }

    const body = req.body || {};
    const submissionId = body.submissionId;
    const design = Number(body.design);
    const diagrams = Number(body.diagrams);
    const problemSolving = Number(body.problemSolving);
    const suggestion = typeof body.suggestion === "string" ? body.suggestion.trim() : "";

    if (!isValidUuid(submissionId)) {
      res.status(400).json({ error: "bad_submission_id" });
      return;
    }
    if (!isScore(design) || !isScore(diagrams) || !isScore(problemSolving)) {
      res.status(400).json({ error: "bad_scores" });
      return;
    }
    if (suggestion.length < MIN_SUGGESTION) {
      res.status(400).json({ error: "suggestion_too_short" });
      return;
    }

    // The owner is looked up on the SERVER, never taken from the request.
    // It is stored on the vote row so the database's composite foreign key
    // can prove it really is that submission's owner -- which in turn is
    // what makes the "voter is not the owner" CHECK constraint meaningful.
    const { data: submission } = await admin
      .from("submissions")
      .select("id, owner_telegram_id")
      .eq("id", submissionId)
      .maybeSingle();

    if (!submission) {
      res.status(404).json({ error: "submission_not_found" });
      return;
    }

    // Checked here too so the student gets a clear message rather than a
    // raw constraint error -- but the database is still the real guard.
    if (submission.owner_telegram_id === session.telegramId) {
      res.status(403).json({ error: "own_work" });
      return;
    }

    const { error } = await admin.from("votes").insert({
      submission_id: submissionId,
      owner_telegram_id: submission.owner_telegram_id,
      voter_telegram_id: session.telegramId,
      design: design,
      diagrams: diagrams,
      problem_solving: problemSolving,
      suggestion: suggestion,
    });

    if (error) {
      console.error("vote insert failed:", error);

      if (error.code === "23505") {
        res.status(409).json({ error: "already_voted" });
        return;
      }
      if (error.code === "23514") {
        // A CHECK constraint refused it -- self-voting, or a bad score
        // that slipped past the checks above.
        res.status(403).json({ error: "rejected_by_rules", detail: error.message });
        return;
      }
      res.status(400).json({ error: "vote_failed", detail: error.message });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("vote failed:", err);
    res.status(500).json({ error: "server_error" });
  }
}
