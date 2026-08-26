import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { uz } from "@/lib/uz";

type Props = { user: PublicUser | null };

export default function HomePage({ user }: Props) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-l-4 border-accent pl-5">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{uz.siteTitle}</h1>
        <p className="mt-2 text-lg text-ink/60">{uz.tagline}</p>
      </header>

      <section className="mt-12 rounded-2xl border border-line bg-white p-8 shadow-[0_1px_3px_rgba(16,19,25,0.06)]">
        {user ? (
          <div>
            <p className="text-xl font-bold text-ink">
              {uz.home.welcomeBack}, {user.username ? "@" + user.username : user.firstName}
            </p>
            <p className={"mt-3 " + (user.eligible ? "text-ink/70" : "text-warn")}>
              {user.eligible ? uz.home.eligible : uz.home.notEligible}
            </p>
            <a
              href="/api/auth-logout"
              className="mt-8 inline-block text-sm font-semibold text-accent underline underline-offset-4"
            >
              {uz.nav.logout}
            </a>
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
  return { props: { user: user } };
};
