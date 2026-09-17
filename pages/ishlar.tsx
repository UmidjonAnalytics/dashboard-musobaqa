import type { GetServerSideProps } from "next";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { listAllWorks, PublicWork } from "@/lib/works";
import { Header, Page, Empty } from "@/lib/ui";
import WorkCard from "@/lib/WorkCard";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  works: PublicWork[];
};

// The gallery. Open to everyone, no account needed, in every phase.
// Both competitions are listed together; the badge on each card says which
// platform the entry was built on.
export default function IshlarPage({ user, phase, forced, works }: Props) {
  const excelCount = works.filter(function (w) {
    return w.competition === "excel";
  }).length;
  const powerbiCount = works.length - excelCount;

  return (
    <>
      <Header phase={phase} forced={forced} loggedIn={!!user} eligible={!!user && user.eligible} />
      <Page>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{uz.works.title}</h1>
        <p className="mt-1.5 text-ink/55">{uz.works.subtitle}</p>

        <p className="mt-6 text-sm font-semibold text-ink/45">
          {works.length} {uz.works.count} &middot; {excelCount} Excel &middot; {powerbiCount} Power
          BI &middot; {uz.works.anonymousNote}
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

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("ishlar user lookup failed:", err);
  }

  const [phaseInfo, works] = await Promise.all([getCurrentPhase(), listAllWorks()]);

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      works: works,
    },
  };
};
