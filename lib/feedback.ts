import { supabaseAdmin } from "./supabaseAdmin";
import { getLeaderboard } from "./voting";
import type { Competition } from "./uploadRules";

// ============================================================================
// The feedback a student received on their own work
// ============================================================================
// Two rules shape everything here:
//
//   1. A student sees ONLY their own work. Every query below filters on
//      owner_telegram_id = the logged-in person, so another student's
//      feedback is never even fetched, let alone sent to the browser.
//
//   2. Voters stay anonymous. voter_telegram_id is never selected. These
//      comments were written by classmates about each other's work, and
//      attaching names to them would change what people are willing to
//      write next time -- and could sour a friendship over a 3 out of 5.
// ============================================================================

export type Review = {
  design: number;
  diagrams: number;
  problemSolving: number;
  average: number;
  suggestion: string;
};

export type MyWorkFeedback = {
  submissionId: string;
  competition: Competition;
  title: string;
  votesCount: number;
  rating: number | null;
  avgDesign: number | null;
  avgDiagrams: number | null;
  avgProblem: number | null;
  rank: number | null;
  totalInCompetition: number;
  reviews: Review[];
};

export async function getMyFeedback(telegramId: number): Promise<MyWorkFeedback[]> {
  const admin = supabaseAdmin();

  // Only this person's own submissions.
  const { data: subs } = await admin
    .from("submissions")
    .select("id, competition, title")
    .eq("owner_telegram_id", telegramId)
    .order("created_at", { ascending: true });

  if (!subs || subs.length === 0) return [];

  // Only votes cast ON this person's work. Note which column is filtered:
  // owner_telegram_id, not voter_telegram_id -- these are the votes their
  // work RECEIVED, never the votes they gave.
  const { data: votes } = await admin
    .from("votes")
    .select("submission_id, design, diagrams, problem_solving, suggestion")
    .eq("owner_telegram_id", telegramId);

  const [excelBoard, powerbiBoard] = await Promise.all([
    getLeaderboard("excel"),
    getLeaderboard("powerbi"),
  ]);

  const out: MyWorkFeedback[] = [];

  for (const sub of subs) {
    const competition = sub.competition as Competition;
    const mine = (votes || []).filter(function (v: { submission_id: string }) {
      return v.submission_id === sub.id;
    });

    const reviews: Review[] = mine.map(function (v: {
      design: number;
      diagrams: number;
      problem_solving: number;
      suggestion: string;
    }) {
      return {
        design: v.design,
        diagrams: v.diagrams,
        problemSolving: v.problem_solving,
        average: (v.design + v.diagrams + v.problem_solving) / 3,
        suggestion: v.suggestion,
      };
    });

    const n = reviews.length;
    const mean = function (pick: (r: Review) => number): number | null {
      if (n === 0) return null;
      let total = 0;
      for (const r of reviews) total += pick(r);
      return total / n;
    };

    const board = competition === "excel" ? excelBoard : powerbiBoard;
    const position = board.findIndex(function (row) {
      return row.submissionId === sub.id;
    });

    out.push({
      submissionId: sub.id,
      competition: competition,
      title: sub.title,
      votesCount: n,
      rating: mean(function (r) { return r.average; }),
      avgDesign: mean(function (r) { return r.design; }),
      avgDiagrams: mean(function (r) { return r.diagrams; }),
      avgProblem: mean(function (r) { return r.problemSolving; }),
      rank: position === -1 || n === 0 ? null : position + 1,
      totalInCompetition: board.length,
      reviews: reviews,
    });
  }

  return out;
}
