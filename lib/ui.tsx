import Link from "next/link";
import { uz } from "./uz";
import type { Phase } from "./phase";

// Shared furniture so every page looks like part of the same site.

export function Header({
  phase,
  forced,
  loggedIn,
  eligible,
}: {
  phase: Phase;
  forced: boolean;
  loggedIn: boolean;
  eligible: boolean;
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-white">
            D
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">{uz.siteTitle}</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/ishlar" className="text-ink/60 transition hover:text-ink">
            {uz.nav.works}
          </Link>
          {loggedIn && eligible && phase === "upload" ? (
            <Link href="/yuklash" className="text-ink/60 transition hover:text-ink">
              {uz.nav.upload}
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <PhaseChip phase={phase} forced={forced} />
          {loggedIn ? (
            <a href="/api/auth-logout" className="text-sm font-semibold text-ink/45 hover:text-ink">
              {uz.nav.logout}
            </a>
          ) : (
            <Link
              href="/kirish"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
            >
              {uz.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function PhaseChip({ phase, forced }: { phase: Phase; forced: boolean }) {
  const label =
    phase === "before"
      ? uz.phaseShort.before
      : phase === "upload"
        ? uz.phaseShort.upload
        : phase === "voting"
          ? uz.phaseShort.voting
          : uz.phaseShort.after;

  const tone =
    phase === "upload"
      ? "bg-emerald-100 text-emerald-800"
      : phase === "voting"
        ? "bg-accent/12 text-accent"
        : "bg-mist text-ink/55";

  return (
    <span className="flex items-center gap-2">
      <span className={"rounded-full px-3 py-1 text-xs font-bold " + tone}>{label}</span>
      {forced ? (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-warn">
          {uz.phaseShort.testing}
        </span>
      ) : null}
    </span>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(16,19,25,0.06)] " +
        (className || "")
      }
    >
      {children}
    </div>
  );
}

export function CompetitionTabs({ active }: { active: "excel" | "powerbi" }) {
  const tabs = [
    { key: "excel", label: uz.upload.excel },
    { key: "powerbi", label: uz.upload.powerbi },
  ] as const;

  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1">
      {tabs.map(function (t) {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={"/ishlar?competition=" + t.key}
            className={
              "rounded-lg px-5 py-2 text-sm font-bold transition " +
              (isActive ? "bg-ink text-white" : "text-ink/55 hover:text-ink")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <Card className="p-14 text-center">
      <p className="text-ink/45">{text}</p>
    </Card>
  );
}
