import Link from "next/link";
import { getCurrentUser, isEligible } from "@/lib/currentUser";
import { uz } from "@/lib/uz";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const eligible = isEligible(user);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink">{uz.siteTitle}</h1>
      <p className="mt-2 text-lg text-ink/70">{uz.tagline}</p>

      <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        {user ? (
          <>
            <p className="text-lg font-medium text-ink">
              {uz.home.welcomeBack(user.username ? `@${user.username}` : user.firstName)}
            </p>
            <p className="mt-2 text-ink/70">{eligible ? uz.home.eligible : uz.home.notEligible}</p>
            <a
              href="/api/auth/logout"
              className="mt-6 inline-block text-sm font-medium text-accent2 underline underline-offset-4"
            >
              {uz.nav.logout}
            </a>
          </>
        ) : (
          <>
            <p className="text-ink/70">{uz.home.notLoggedIn}</p>
            <p className="mt-1 text-ink/70">{uz.home.loginHint}</p>
            <Link
              href="/kirish"
              className="mt-6 inline-block rounded-xl bg-accent2 px-6 py-3 font-medium text-white"
            >
              {uz.nav.login}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
