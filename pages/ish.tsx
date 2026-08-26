import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { getWork, PublicWork } from "@/lib/works";
import { Header, Page, Card } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  work: PublicWork | null;
};

// One submission, in detail. Uses a query string (/ish?id=...) rather than
// a folder like [id], which GitHub's web uploader silently skips.
export default function IshPage({ user, phase, forced, work }: Props) {
  return (
    <>
      <Header
        phase={phase}
        forced={forced}
        loggedIn={!!user}
        eligible={!!user && user.eligible}
      />
      <Page>
        {!work ? (
          <Card className="p-14 text-center">
            <p className="text-ink/55">{uz.work.notFound}</p>
            <Link href="/ishlar" className="mt-4 inline-block font-semibold text-accent underline">
              {uz.work.back}
            </Link>
          </Card>
        ) : (
          <>
            <Link
              href={"/ishlar?competition=" + work.competition}
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

            <p className="mt-2 text-sm font-semibold text-ink/40">
              {work.competition === "excel" ? uz.upload.excel : uz.upload.powerbi}
            </p>

            {work.description ? (
              <Card className="mt-7 p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink/40">
                  {uz.work.description}
                </h2>
                <p className="mt-2.5 whitespace-pre-wrap leading-relaxed text-ink/75">
                  {work.description}
                </p>
              </Card>
            ) : null}

            <h2 className="mt-9 text-xs font-bold uppercase tracking-wider text-ink/40">
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

            {phase !== "voting" ? (
              <p className="mt-9 rounded-xl bg-mist px-5 py-4 text-sm text-ink/55">
                {uz.works.votingSoon}
              </p>
            ) : null}
          </>
        )}
      </Page>
    </>
  );
};

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

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      work: work,
    },
  };
};
