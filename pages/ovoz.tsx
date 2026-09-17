import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { listAllWorks } from "@/lib/works";
import { shuffleForVoter, getVotedIds, getOwnSubmissionIds, VotableWork } from "@/lib/voting";
import { Header, Page, Card, Empty } from "@/lib/ui";
import WorkCard from "@/lib/WorkCard";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  works: VotableWork[];
};

// Both competitions in one list, each voter getting their own order.
export default function OvozPage({ user, phase, forced, works }: Props) {
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

  const remaining = works.filter(function (w) {
    return !w.isOwn && !w.alreadyVoted;
  }).length;

  return (
    <>
      {header}
      <Page>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.vote.title}</h1>
        <p className="mt-1.5 text-ink/55">{uz.vote.subtitle}</p>

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
                  <WorkCard
                    key={w.id}
                    work={w}
                    dimmed={w.isOwn}
                    footer={
                      <div className="flex items-center justify-between gap-3">
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
                    }
                  />
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
        works: [],
      },
    };
  }

  const [works, votedIds, ownIds] = await Promise.all([
    listAllWorks(),
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
      works: ordered,
    },
  };
};
