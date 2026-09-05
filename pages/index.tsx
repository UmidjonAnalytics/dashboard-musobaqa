import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { listAllWorks, PublicWork } from "@/lib/works";
import { getWinners, Winner } from "@/lib/voting";
import WinnerBanner from "@/lib/WinnerBanner";
import { uz } from "@/lib/uz";
import { Header, Page, Card } from "@/lib/ui";
import WorkCard from "@/lib/WorkCard";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  excelCount: number;
  powerbiCount: number;
  recent: PublicWork[];
  winners: Winner[];
};

export default function HomePage({
  user,
  phase,
  forced,
  excelCount,
  powerbiCount,
  recent,
  winners,
}: Props) {
  const phaseText =
    phase === "before"
      ? uz.phase.before
      : phase === "upload"
        ? uz.phase.uploadOpen
        : phase === "voting"
          ? uz.phase.votingOpen
          : uz.phase.after;

  return (
    <>
      <Header
        phase={phase}
        forced={forced}
        loggedIn={!!user}
        eligible={!!user && user.eligible}
      />

      {/* Hero */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">
              {uz.tagline}
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[1.05] tracking-tight text-ink">
              {uz.siteTitle}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink/60">{phaseText}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ishlar"
                className="rounded-xl bg-ink px-6 py-3 font-bold text-white transition hover:bg-slate1"
              >
                {uz.works.title}
              </Link>
              {user && user.eligible && phase === "upload" ? (
                <Link
                  href="/yuklash"
                  className="rounded-xl bg-accent px-6 py-3 font-bold text-white transition hover:bg-accentDark"
                >
                  {uz.upload.title}
                </Link>
              ) : null}
              {!user ? (
                <Link
                  href="/kirish"
                  className="rounded-xl border border-line bg-white px-6 py-3 font-bold text-ink/70 transition hover:border-accent hover:text-ink"
                >
                  {uz.nav.login}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-2 gap-4">
            <Stat label={uz.upload.excel} value={excelCount} />
            <Stat label={uz.upload.powerbi} value={powerbiCount} />
          </div>
        </div>
      </div>

      <Page>
        {phase === "after" ? (
          <div className="mb-12">
            <WinnerBanner winners={winners} />
          </div>
        ) : null}

        {user ? (
          <Card className="p-6">
            <p className="font-bold text-ink">
              {uz.home.welcomeBack}, {user.username ? "@" + user.username : user.firstName}
            </p>
            <p className={"mt-1.5 text-sm " + (user.eligible ? "text-ink/55" : "text-warn")}>
              {user.eligible ? uz.home.eligible : uz.home.notEligible}
            </p>
          </Card>
        ) : (
          <Card className="p-6">
            <p className="font-bold text-ink">{uz.home.notLoggedIn}</p>
            <p className="mt-1.5 text-sm text-ink/55">{uz.home.loginHint}</p>
          </Card>
        )}

        {recent.length > 0 ? (
          <div className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">{uz.works.title}</h2>
              <Link href="/ishlar" className="text-sm font-semibold text-accent hover:underline">
                {uz.works.open}
              </Link>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map(function (w) {
                return <WorkCard key={w.id} work={w} />;
              })}
            </div>
          </div>
        ) : null}
      </Page>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-mist/60 px-6 py-5">
      <p className="text-4xl font-black tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-bold text-ink/45">{label}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("home page user lookup failed:", err);
  }

  // Fetched together rather than one after another, so the page is not
  // waiting on three round trips in a row.
  const [phaseInfo, allWorks] = await Promise.all([getCurrentPhase(), listAllWorks()]);

  // Only looked up once voting has closed -- there is no winner before then.
  const winners = phaseInfo.phase === "after" ? await getWinners() : [];

  const excelCount = allWorks.filter(function (w) {
    return w.competition === "excel";
  }).length;
  const recent = allWorks.slice(-3).reverse();

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      excelCount: excelCount,
      powerbiCount: allWorks.length - excelCount,
      recent: recent,
      winners: winners,
    },
  };
};
