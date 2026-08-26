import type { GetServerSideProps } from "next";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { listWorks, PublicWork } from "@/lib/works";
import { Header, Page, Card, CompetitionTabs, Empty } from "@/lib/ui";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  competition: "excel" | "powerbi";
  works: PublicWork[];
};

// The gallery. Open to everyone, no account needed, in every phase.
export default function IshlarPage({ user, phase, forced, competition, works }: Props) {
  return (
    <>
      <Header
        phase={phase}
        forced={forced}
        loggedIn={!!user}
        eligible={!!user && user.eligible}
      />
      <Page>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.works.title}</h1>
            <p className="mt-1.5 text-ink/55">{uz.works.subtitle}</p>
          </div>
          <CompetitionTabs active={competition} />
        </div>

        <p className="mt-6 text-sm font-semibold text-ink/45">
          {works.length} {uz.works.count} &middot; {uz.works.anonymousNote}
        </p>

        <div className="mt-5">
          {works.length === 0 ? (
            <Empty text={uz.works.empty} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {works.map(function (w) {
                return <WorkCard key={w.id} work={w} />;
              })}
            </div>
          )}
        </div>
      </Page>
    </>
  );
}

function WorkCard({ work }: { work: PublicWork }) {
  return (
    <Card className="flex flex-col overflow-hidden transition hover:border-accent/50 hover:shadow-[0_4px_16px_rgba(16,19,25,0.08)]">
      <Link href={"/ish?id=" + work.id} className="block">
        <div className="aspect-[16/10] w-full overflow-hidden bg-mist">
          {work.mainImage ? (
            // A plain img tag on purpose: these come from Supabase Storage
            // and from links students paste, so Next's image optimiser
            // would need every host allow-listed in advance.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={work.mainImage}
              alt={work.title}
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center text-ink/25">—</div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={"/ish?id=" + work.id}>
          <h2 className="font-bold leading-snug text-ink hover:text-accent">{work.title}</h2>
        </Link>
        {work.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink/55">{work.description}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-4 pt-1 text-sm font-semibold">
          <Link href={"/ish?id=" + work.id} className="text-accent hover:underline">
            {uz.works.open}
          </Link>
          <a href={"/api/download?id=" + work.id} className="text-ink/45 hover:text-ink">
            {uz.works.download}
          </a>
        </div>
      </div>
    </Card>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  const raw = ctx.query.competition;
  const competition = raw === "powerbi" ? "powerbi" : "excel";

  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("ishlar user lookup failed:", err);
  }

  const [phaseInfo, works] = await Promise.all([getCurrentPhase(), listWorks(competition)]);

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      competition: competition,
      works: works,
    },
  };
};
