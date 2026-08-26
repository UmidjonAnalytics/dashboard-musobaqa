import { getCurrentUser, isEligible } from "@/lib/currentUser";
import { uz } from "@/lib/uz";
import { TELEGRAM_BOT_USERNAME, SITE_URL } from "@/lib/config";
import LoginWidget from "@/components/LoginWidget";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const params = await searchParams;
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

            {params.login === "not-eligible" && (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {uz.home.notEligible}
              </p>
            )}
            {params.login === "error" && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900">
                {uz.loginError.badRequest}
              </p>
            )}

            <div className="mt-6">
              <LoginWidget
                botUsername={TELEGRAM_BOT_USERNAME}
                authUrl={`${SITE_URL}/api/auth/telegram`}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
