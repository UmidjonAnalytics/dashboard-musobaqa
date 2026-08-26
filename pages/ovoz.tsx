import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { listWorks } from "@/lib/works";
import { shuffleForVoter, getVotedIds, getOwnSubmissionIds, VotableWork } from "@/lib/voting";
import { Header, Page, Card, CompetitionTabs, Empty } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  competition: "excel" | "powerbi";
  works: VotableWork[];
};

export default function OvozPage({ user, phase, forced, competition, works }: Props) {
  const header = (
    <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
  );

  if (!user || !user.eligible) {
    return (
      <>
        {header}
        <Page>
          <Card className="p-14 text-center">
            <p className="text-ink/60">{user ? uz.home.notEligible : uz.vote.loginFirst}</p>
            {!user ? (
              <Link href="/kirish" className="mt-4 inline-block font-bold text-accent underline">
                {uz.nav.login}
              </Link>
            ) : null}
          </Card>
        </Page>
      </>
    );
  }

  if (phase !== "voting") {
    return (
      <>
        {header}
        <Page>
          <Card className="p-14 text-center">
            <p className="text-ink/60">{uz.vote.notVotingPhase}</p>
            <Link href="/ishlar" className="mt-4 inline-block font-bold text-accent underline">
              {uz.works.title}
            </Link>
          </Card>
        </Page>
      </>
    );
  }

  const votable = works.filter(function (w) {
    return !w.isOwn;
  });
  const remaining = votable.filter(function (w) {
    return !w.alreadyVoted;
  }).length;

  return (
    <>
      {header}
      <Page>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.vote.title}</h1>
            <p className="mt-1.5 text-ink/55">{uz.vote.subtitle}</p>
          </div>
          <CompetitionTabs active={competition} basePath="/ovoz" />
        </div>

        <p className="mt-6 text-sm font-semibold text-ink/45">
          {remaining > 0 ? remaining + " " + uz.vote.remaining : uz.vote.allDone} &middot;{" "}
          {uz.vote.listNote}
        </p>

        <div className="mt-5">
          {works.length === 0 ? (
            <Empty text={uz.works.empty} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {works.map(function (w) {
                return (
                  <Card
                    key={w.id}
                    className={
                      "flex flex-col overflow-hidden transition " +
                      (w.isOwn ? "opacity-55" : "hover:border-accent/50")
                    }
                  >
                    <Link href={"/ish?id=" + w.id} className="block">
                      <div className="aspect-[16/10] w-full overflow-hidden bg-mist">
                        {w.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.mainImage}
                            alt={w.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-ink/25">—</div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <Link href={"/ish?id=" + w.id}>
                        <h2 className="font-bold leading-snug text-ink hover:text-accent">
                          {w.title}
                        </h2>
                      </Link>

                      <div className="mt-4 flex items-center justify-between">
                        <StatusPill work={w} />
                        {!w.isOwn && !w.alreadyVoted ? (
                          <Link
                            href={"/ish?id=" + w.id}
                            className="text-sm font-bold text-accent hover:underline"
                          >
                            {uz.vote.submit}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Page>
    </>
  );
}

function StatusPill({ work }: { work: VotableWork }) {
  if (work.isOwn) {
    return (
      <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-ink/50">
        {uz.vote.ownWork}
      </span>
    );
  }
  if (work.alreadyVoted) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
        {uz.vote.voted}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-bold text-accent">
      {uz.vote.notVoted}
    </span>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  const raw = ctx.query.competition;
  const competition = raw === "powerbi" ? "powerbi" : "excel";

  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("ovoz user lookup failed:", err);
  }

  const phaseInfo = await getCurrentPhase();

  if (!user || !user.eligible || phaseInfo.phase !== "voting") {
    return {
      props: {
        user: user,
        phase: phaseInfo.phase,
        forced: phaseInfo.forced,
        competition: competition,
        works: [],
      },
    };
  }

  const [works, votedIds, ownIds] = await Promise.all([
    listWorks(competition),
    getVotedIds(user.telegramId),
    getOwnSubmissionIds(user.telegramId),
  ]);

  const decorated: VotableWork[] = works.map(function (w) {
    return {
      ...w,
      alreadyVoted: votedIds.indexOf(w.id) !== -1,
      isOwn: ownIds.indexOf(w.id) !== -1,
    };
  });

  // Every voter gets their own order, so nobody's work is systematically
  // seen first (or last) by everyone.
  const ordered = shuffleForVoter(decorated, user.telegramId);

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      competition: competition,
      works: ordered,
    },
  };
};
