import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { getLeaderboard, getWinners, LeaderboardRow, Winner } from "@/lib/voting";
import WinnerBanner from "@/lib/WinnerBanner";
import { Header, Page, Card, PlatformBadge } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  excel: LeaderboardRow[];
  powerbi: LeaderboardRow[];
  winners: Winner[];
};

// Both leaderboards side by side -- no switching between them.
// The vote count sits beside every score on purpose: a single 5.00 is
// plainly not the same achievement as a 4.60 from fifteen people.
export default function NatijalarPage({ user, phase, forced, excel, powerbi, winners }: Props) {
  return (
    <>
      <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
      <Page>
        {phase === "after" ? (
          <div className="mb-12">
            <WinnerBanner winners={winners} />
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.results.title}</h1>
        <p className="mt-1.5 text-ink/55">{uz.results.subtitle}</p>
        <p className="mt-4 text-sm font-semibold text-ink/45">
          {uz.results.countNote} &middot; {uz.works.anonymousNote}
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-2 lg:items-start">
          <Board competition="excel" rows={excel} />
          <Board competition="powerbi" rows={powerbi} />
        </div>
      </Page>
    </>
  );
}

function Board({
  competition,
  rows,
}: {
  competition: "excel" | "powerbi";
  rows: LeaderboardRow[];
}) {
  const maxVotes = rows.reduce(function (m, r) {
    return r.votesCount > m ? r.votesCount : m;
  }, 0);

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <PlatformBadge competition={competition} />
        <span className="text-sm font-semibold text-ink/40">
          {rows.length} {uz.works.count}
        </span>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink/45">{uz.results.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(function (row, index) {
              return (
                <li key={row.submissionId} className="flex items-center gap-4 px-5 py-4">
                  <span
                    className={
                      "w-6 shrink-0 text-lg font-black tabular-nums " +
                      (index === 0 && row.rating !== null ? "text-accent" : "text-ink/25")
                    }
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={"/ish?id=" + row.submissionId}
                      className="block truncate font-bold text-ink hover:text-accent"
                    >
                      {row.title}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-mist">
                        <div
                          className="h-full rounded-full bg-accent/55"
                          style={{
                            width:
                              maxVotes > 0
                                ? Math.round((row.votesCount / maxVotes) * 100) + "%"
                                : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-ink/40">
                        {row.votesCount} {uz.results.votes.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-right">
                    {row.rating === null ? (
                      <span className="text-xs font-semibold text-ink/30">
                        {uz.results.noVotes}
                      </span>
                    ) : (
                      <span className="text-xl font-black tabular-nums text-ink">
                        {row.rating.toFixed(2)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("natijalar user lookup failed:", err);
  }

  const [phaseInfo, excel, powerbi] = await Promise.all([
    getCurrentPhase(),
    getLeaderboard("excel"),
    getLeaderboard("powerbi"),
  ]);

  const winners = phaseInfo.phase === "after" ? await getWinners() : [];

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      excel: excel,
      powerbi: powerbi,
      winners: winners,
    },
  };
};
