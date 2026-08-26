import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { uz } from "@/lib/uz";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
};

export default function HomePage({ user, phase, forced }: Props) {
  const phaseText =
    phase === "before"
      ? uz.phase.before
      : phase === "upload"
        ? uz.phase.uploadOpen
        : phase === "voting"
          ? uz.phase.votingOpen
          : uz.phase.after;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-l-4 border-accent pl-5">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{uz.siteTitle}</h1>
        <p className="mt-2 text-lg text-ink/60">{uz.tagline}</p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-white">
          {phaseText}
        </span>
        {forced ? (
          <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-warn">
            {uz.phase.testingBanner}
          </span>
        ) : null}
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-white p-8 shadow-[0_1px_3px_rgba(16,19,25,0.06)]">
        {user ? (
          <div>
            <p className="text-xl font-bold text-ink">
              {uz.home.welcomeBack}, {user.username ? "@" + user.username : user.firstName}
            </p>
            <p className={"mt-3 " + (user.eligible ? "text-ink/70" : "text-warn")}>
              {user.eligible ? uz.home.eligible : uz.home.notEligible}
            </p>

            {user.eligible && phase === "upload" ? (
              <Link
                href="/yuklash"
                className="mt-7 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accentDark"
              >
                {uz.upload.title}
              </Link>
            ) : null}

            <div className="mt-8">
              <a
                href="/api/auth-logout"
                className="text-sm font-semibold text-accent underline underline-offset-4"
              >
                {uz.nav.logout}
              </a>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-ink">{uz.home.notLoggedIn}</p>
            <p className="mt-2 text-ink/60">{uz.home.loginHint}</p>
            <Link
              href="/kirish"
              className="mt-8 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accentDark"
            >
              {uz.nav.login}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("home page user lookup failed:", err);
  }

  const phaseInfo = await getCurrentPhase();

  return {
    props: { user: user, phase: phaseInfo.phase, forced: phaseInfo.forced },
  };
};
