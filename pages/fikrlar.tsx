import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { getMyFeedback, MyWorkFeedback, Review } from "@/lib/feedback";
import { Header, Page, Card, PlatformBadge } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  works: MyWorkFeedback[];
};

// What the voters wrote about YOUR work. Only ever your own, and always
// without the voters' names.
export default function FikrlarPage({ user, phase, forced, works }: Props) {
  const header = (
    <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
  );

  if (!user) {
    return (
      <>
        {header}
        <Page>
          <Card className="p-14 text-center">
            <p className="text-ink/60">{uz.feedback.loginFirst}</p>
            <Link href="/kirish" className="mt-4 inline-block font-bold text-accent underline">
              {uz.nav.login}
            </Link>
          </Card>
        </Page>
      </>
    );
  }

  if (phase !== "after") {
    return (
      <>
        {header}
        <Page>
          <Card className="p-14 text-center">
            <p className="text-ink/60">{uz.feedback.notYet}</p>
          </Card>
        </Page>
      </>
    );
  }

  return (
    <>
      {header}
      <Page>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.feedback.title}</h1>
        <p className="mt-1.5 text-ink/55">{uz.feedback.subtitle}</p>
        <p className="mt-3 text-sm font-semibold text-ink/40">
          {uz.feedback.anonymous} {uz.feedback.onlyYours}
        </p>

        {works.length === 0 ? (
          <Card className="mt-6 p-14 text-center">
            <p className="text-ink/55">{uz.feedback.noSubmission}</p>
            <Link href="/ishlar" className="mt-4 inline-block font-bold text-accent underline">
              {uz.works.title}
            </Link>
          </Card>
        ) : (
          <div className="mt-7 space-y-10">
            {works.map(function (w) {
              return <WorkFeedback key={w.submissionId} work={w} />;
            })}

            <Card className="bg-mist/60 p-6">
              <p className="text-sm leading-relaxed text-ink/60">{uz.feedback.thanksNote}</p>
            </Card>
          </div>
        )}
      </Page>
    </>
  );
}

function WorkFeedback({ work }: { work: MyWorkFeedback }) {
  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <PlatformBadge competition={work.competition} />
        <h2 className="text-xl font-extrabold tracking-tight text-ink">{work.title}</h2>
        <Link
          href={"/ish?id=" + work.submissionId}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {uz.works.open}
        </Link>
      </div>

      {work.votesCount === 0 ? (
        <Card className="mt-4 p-10 text-center">
          <p className="text-ink/50">{uz.feedback.noVotes}</p>
        </Card>
      ) : (
        <>
          {/* Headline numbers */}
          <Card className="mt-4 p-6">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
              <div>
                <p className="text-4xl font-black tabular-nums text-ink">
                  {work.rating !== null ? work.rating.toFixed(2) : "—"}
                </p>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-ink/40">
                  {uz.feedback.yourScore}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-ink/70">{work.votesCount}</p>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-ink/40">
                  {uz.feedback.votesGiven}
                </p>
              </div>
              {work.rank !== null ? (
                <div>
                  <p className="text-2xl font-black tabular-nums text-ink/70">
                    {work.rank}
                    <span className="text-base font-bold text-ink/35">
                      {" / " + work.totalInCompetition}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-ink/40">
                    {uz.feedback.rank}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
                {uz.feedback.criteria}
              </p>
              <div className="mt-3 space-y-2.5">
                <CriterionBar label={uz.vote.design} value={work.avgDesign} />
                <CriterionBar label={uz.vote.diagrams} value={work.avgDiagrams} />
                <CriterionBar label={uz.vote.problem} value={work.avgProblem} />
              </div>
            </div>
          </Card>

          {/* The written comments */}
          <h3 className="mt-8 text-xs font-bold uppercase tracking-wider text-ink/40">
            {uz.feedback.reviewsTitle} ({work.reviews.length})
          </h3>
          <div className="mt-3 space-y-4">
            {work.reviews.map(function (r, i) {
              return <ReviewCard key={i} review={r} index={i + 1} />;
            })}
          </div>
        </>
      )}
    </section>
  );
}

function CriterionBar({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? (value / 5) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-56 shrink-0 text-sm font-semibold text-ink/70">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-accent/70" style={{ width: pct + "%" }} />
      </div>
      <span className="w-12 shrink-0 text-right text-sm font-black tabular-nums text-ink">
        {value !== null ? value.toFixed(2) : "—"}
      </span>
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/35">
          {uz.feedback.reviewNumber} {index}
        </span>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-ink/50">
          <Chip label={uz.vote.design} value={review.design} />
          <Chip label={uz.vote.diagrams} value={review.diagrams} />
          <Chip label={uz.vote.problem} value={review.problemSolving} />
          <span className="rounded-md bg-ink px-2 py-1 font-black text-white tabular-nums">
            {review.average.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="mt-3.5 whitespace-pre-wrap border-l-2 border-accent/30 pl-4 leading-relaxed text-ink/80">
        {review.suggestion}
      </p>
    </Card>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-mist px-2 py-1" title={label}>
      {label.slice(0, 3)}. <span className="font-black text-ink/70">{value}</span>
    </span>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("fikrlar user lookup failed:", err);
  }

  const phaseInfo = await getCurrentPhase();

  // Feedback is only fetched for a logged-in person, and only once voting
  // has closed. Before that, nothing is read at all.
  const works =
    user && phaseInfo.phase === "after" ? await getMyFeedback(user.telegramId) : [];

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      works: works,
    },
  };
};
