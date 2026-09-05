import { useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { getWork, PublicWork } from "@/lib/works";
import { getVotedIds, getOwnSubmissionIds } from "@/lib/voting";
import { Header, Page, Card, PlatformBadge } from "@/lib/ui";
import VoteForm from "@/lib/VoteForm";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  work: PublicWork | null;
  alreadyVoted: boolean;
  isOwn: boolean;
};

// One submission, in detail -- and, during the voting phase, where the
// rating happens. Uses a query string (/ish?id=...) rather than a folder
// named [id], which GitHub's web uploader silently skips.
export default function IshPage({ user, phase, forced, work, alreadyVoted, isOwn }: Props) {
  const [justVoted, setJustVoted] = useState(false);

  const voted = alreadyVoted || justVoted;
  const canVote =
    !!work && !!user && user.eligible && phase === "voting" && !isOwn && !voted;

  return (
    <>
      <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
      <Page>
        {!work ? (
          <Card className="p-14 text-center">
            <p className="text-ink/55">{uz.work.notFound}</p>
            <Link href="/ishlar" className="mt-4 inline-block font-bold text-accent underline">
              {uz.work.back}
            </Link>
          </Card>
        ) : (
          <>
            <Link
              href={
                (phase === "voting" && user && user.eligible ? "/ovoz" : "/ishlar") +
                "?competition=" +
                work.competition
              }
              className="text-sm font-semibold text-ink/45 hover:text-ink"
            >
              &larr; {uz.work.back}
            </Link>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ink">
                {work.title}
              </h1>
              <a
                href={"/api/download?id=" + work.id}
                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate1"
              >
                {uz.works.download}
              </a>
            </div>

            <div className="mt-3">
              <PlatformBadge competition={work.competition} />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
              <div>
                {work.embedUrl ? (
                  <div className="mb-8">
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-ink/40">
                        {uz.platform.livePreview}
                      </h2>
                      <a
                        href={work.embedUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        {uz.platform.openInNewTab}
                      </a>
                    </div>
                    <Card className="overflow-hidden">
                      <div className="aspect-[16/10] w-full bg-mist">
                        <iframe
                          src={work.embedUrl}
                          title={work.title}
                          className="h-full w-full border-0"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                      </div>
                    </Card>
                    <p className="mt-2 text-sm text-ink/45">{uz.platform.liveNote}</p>
                  </div>
                ) : null}

                {work.description ? (
                  <Card className="p-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-ink/40">
                      {uz.work.description}
                    </h2>
                    <p className="mt-2.5 whitespace-pre-wrap leading-relaxed text-ink/75">
                      {work.description}
                    </p>
                  </Card>
                ) : null}

                {work.images.length > 0 ? (
                  <>
                    <h2 className="mt-8 text-xs font-bold uppercase tracking-wider text-ink/40">
                      {uz.work.screenshots}
                    </h2>
                    <div className="mt-3 space-y-5">
                      {work.images.map(function (src, i) {
                        return (
                          <Card key={i} className="overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={work.title} className="w-full" loading="lazy" />
                          </Card>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>

              <aside className="lg:sticky lg:top-6">
                {canVote ? (
                  <VoteForm
                    submissionId={work.id}
                    onVoted={function () {
                      setJustVoted(true);
                    }}
                  />
                ) : null}

                {voted && phase === "voting" ? (
                  <Card className="p-6 text-center">
                    <p className="font-bold text-emerald-800">{uz.vote.thanks}</p>
                    <Link
                      href={"/ovoz?competition=" + work.competition}
                      className="mt-3 inline-block text-sm font-bold text-accent underline"
                    >
                      {uz.vote.title}
                    </Link>
                  </Card>
                ) : null}

                {isOwn && phase === "voting" ? (
                  <Card className="p-6 text-center">
                    <p className="font-semibold text-ink/55">{uz.vote.ownWork}</p>
                  </Card>
                ) : null}

                {phase !== "voting" ? (
                  <Card className="p-6">
                    <p className="text-sm text-ink/55">{uz.works.votingSoon}</p>
                  </Card>
                ) : null}

                {phase === "voting" && user && !user.eligible ? (
                  <Card className="mt-4 p-6">
                    <p className="text-sm text-warn">{uz.home.notEligible}</p>
                  </Card>
                ) : null}

                {phase === "voting" && !user ? (
                  <Card className="mt-4 p-6 text-center">
                    <p className="text-sm text-ink/55">{uz.vote.loginFirst}</p>
                    <Link
                      href="/kirish"
                      className="mt-3 inline-block text-sm font-bold text-accent underline"
                    >
                      {uz.nav.login}
                    </Link>
                  </Card>
                ) : null}
              </aside>
            </div>
          </>
        )}
      </Page>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  const id = typeof ctx.query.id === "string" ? ctx.query.id : "";

  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("ish user lookup failed:", err);
  }

  const [phaseInfo, work] = await Promise.all([
    getCurrentPhase(),
    id ? getWork(id) : Promise.resolve(null),
  ]);

  let alreadyVoted = false;
  let isOwn = false;

  if (user && work) {
    const [votedIds, ownIds] = await Promise.all([
      getVotedIds(user.telegramId),
      getOwnSubmissionIds(user.telegramId),
    ]);
    alreadyVoted = votedIds.indexOf(work.id) !== -1;
    isOwn = ownIds.indexOf(work.id) !== -1;
  }

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      work: work,
      alreadyVoted: alreadyVoted,
      isOwn: isOwn,
    },
  };
};
