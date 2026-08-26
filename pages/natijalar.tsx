import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { getLeaderboard, LeaderboardRow } from "@/lib/voting";
import { Header, Page, Card, CompetitionTabs, Empty } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  competition: "excel" | "powerbi";
  rows: LeaderboardRow[];
};

// The leaderboard. Live throughout voting, and open to everyone.
// It shows the vote count beside every score on purpose: a single 5.00 is
// plainly not the same achievement as a 4.60 from fifteen people.
export default function NatijalarPage({ user, phase, forced, competition, rows }: Props) {
  const maxVotes = rows.reduce(function (m, r) {
    return r.votesCount > m ? r.votesCount : m;
  }, 0);

  return (
    <>
      <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
      <Page>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.results.title}</h1>
            <p className="mt-1.5 text-ink/55">{uz.results.subtitle}</p>
          </div>
          <CompetitionTabs active={competition} basePath="/natijalar" />
        </div>

        <p className="mt-6 text-sm font-semibold text-ink/45">
          {uz.results.countNote} &middot; {uz.works.anonymousNote}
        </p>

        <div className="mt-5">
          {rows.length === 0 ? (
            <Empty text={uz.results.empty} />
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[3rem_1fr_7rem_9rem] gap-4 border-b border-line bg-mist/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink/40 sm:grid">
                <div>{uz.results.rank}</div>
                <div>{uz.results.work}</div>
                <div className="text-right">{uz.results.score}</div>
                <div className="text-right">{uz.results.votes}</div>
              </div>

              <ul className="divide-y divide-line">
                {rows.map(function (row, index) {
                  return (
                    <li
                      key={row.submissionId}
                      className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 px-6 py-4 sm:grid-cols-[3rem_1fr_7rem_9rem]"
                    >
                      <div
                        className={
                          "text-lg font-black tabular-nums " +
                          (index === 0 && row.rating !== null ? "text-accent" : "text-ink/30")
                        }
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={"/ish?id=" + row.submissionId}
                          className="block truncate font-bold text-ink hover:text-accent"
                        >
                          {row.title}
                        </Link>
                      </div>

                      <div className="col-start-2 flex items-baseline gap-2 sm:col-start-3 sm:justify-end">
                        {row.rating === null ? (
                          <span className="text-sm font-semibold text-ink/30">
                            {uz.results.noVotes}
                          </span>
                        ) : (
                          <span className="text-xl font-black tabular-nums text-ink">
                            {row.rating.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="col-start-2 sm:col-start-4 sm:justify-self-end">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-mist">
                            <div
                              className="h-full rounded-full bg-accent/60"
                              style={{
                                width:
                                  maxVotes > 0
                                    ? Math.round((row.votesCount / maxVotes) * 100) + "%"
                                    : "0%",
                              }}
                            />
                          </div>
                          <span className="w-8 text-sm font-bold tabular-nums text-ink/50">
                            {row.votesCount}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </Page>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  const raw = ctx.query.competition;
  const competition = raw === "powerbi" ? "powerbi" : "excel";

  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("natijalar user lookup failed:", err);
  }

  const [phaseInfo, rows] = await Promise.all([getCurrentPhase(), getLeaderboard(competition)]);

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      competition: competition,
      rows: rows,
    },
  };
};
