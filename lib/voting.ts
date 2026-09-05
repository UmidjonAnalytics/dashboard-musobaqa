import { supabaseAdmin } from "./supabaseAdmin";
import type { Competition } from "./uploadRules";
import type { PublicWork } from "./works";

export type VotableWork = PublicWork & {
  alreadyVoted: boolean;
  isOwn: boolean;
};

export type LeaderboardRow = {
  submissionId: string;
  title: string;
  competition: Competition;
  votesCount: number;
  rating: number | null;
};

// A small, stable hash. Used to give every voter their own shuffle of the
// submissions: the order is random-looking and differs from voter to voter,
// but stays the same for one voter across page loads, so nothing jumps
// around while they work through the list.
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h = h ^ input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleForVoter<T extends { id: string }>(items: T[], voterId: number): T[] {
  return items
    .map(function (item) {
      return { item: item, key: hashString(voterId + ":" + item.id) };
    })
    .sort(function (a, b) {
      if (a.key === b.key) return a.item.id < b.item.id ? -1 : 1;
      return a.key - b.key;
    })
    .map(function (entry) {
      return entry.item;
    });
}

// Which submissions this voter has already rated.
export async function getVotedIds(voterTelegramId: number): Promise<string[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("votes")
    .select("submission_id")
    .eq("voter_telegram_id", voterTelegramId);

  if (!data) return [];
  return data.map(function (row: { submission_id: string }) {
    return row.submission_id;
  });
}

// The ids of submissions this voter owns, so they can be marked and
// filtered out. Note this only ever asks "which are MINE" using the
// voter's own id -- it never reads anybody else's owner column.
export async function getOwnSubmissionIds(voterTelegramId: number): Promise<string[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("submissions")
    .select("id")
    .eq("owner_telegram_id", voterTelegramId);

  if (!data) return [];
  return data.map(function (row: { id: string }) {
    return row.id;
  });
}

export async function getLeaderboard(competition: Competition): Promise<LeaderboardRow[]> {
  const admin = supabaseAdmin();

  // This view carries no owner column at all, by design.
  const { data, error } = await admin
    .from("submission_ratings")
    .select("submission_id, competition, title, votes_count, rating")
    .eq("competition", competition);

  if (error || !data) {
    console.error("leaderboard failed:", error);
    return [];
  }

  const rows: LeaderboardRow[] = data.map(function (r: {
    submission_id: string;
    competition: string;
    title: string;
    votes_count: number | string;
    rating: number | string | null;
  }) {
    return {
      submissionId: r.submission_id,
      title: r.title,
      competition: r.competition as Competition,
      votesCount: Number(r.votes_count) || 0,
      rating: r.rating === null ? null : Number(r.rating),
    };
  });

  // Highest score first; a submission with no votes yet sinks to the
  // bottom rather than pretending to be a zero.
  rows.sort(function (a, b) {
    if (a.rating === null && b.rating === null) return b.votesCount - a.votesCount;
    if (a.rating === null) return 1;
    if (b.rating === null) return -1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.votesCount - a.votesCount;
  });

  return rows;
}

export type Winner = {
  competition: Competition;
  submissionId: string;
  title: string;
  rating: number;
  votesCount: number;
};

// The top entry in each competition, for the announcement once voting closes.
// An entry with no votes can never win: with no rating there is nothing to
// have won on. If two tie exactly, the one with MORE votes takes it, since
// that score is the better established of the two.
export async function getWinners(): Promise<Winner[]> {
  const [excel, powerbi] = await Promise.all([
    getLeaderboard("excel"),
    getLeaderboard("powerbi"),
  ]);

  const winners: Winner[] = [];
  const boards: Array<[Competition, LeaderboardRow[]]> = [
    ["excel", excel],
    ["powerbi", powerbi],
  ];

  for (const [competition, rows] of boards) {
    const scored = rows.filter(function (r) {
      return r.rating !== null && r.votesCount > 0;
    });
    if (scored.length === 0) continue;

    // getLeaderboard already sorts by rating, then by vote count.
    const top = scored[0];
    winners.push({
      competition: competition,
      submissionId: top.submissionId,
      title: top.title,
      rating: top.rating as number,
      votesCount: top.votesCount,
    });
  }

  return winners;
}
