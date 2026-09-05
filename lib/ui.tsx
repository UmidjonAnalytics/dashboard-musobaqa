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
          {loggedIn && eligible && phase === "voting" ? (
            <Link href="/ovoz" className="text-ink/60 transition hover:text-ink">
              {uz.nav.vote}
            </Link>
          ) : null}
          {phase === "voting" || phase === "after" ? (
            <Link href="/natijalar" className="text-ink/60 transition hover:text-ink">
              {uz.nav.results}
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

// A small corner marker showing which platform an entry was built on, so
// the two competitions can be listed together without confusion.
export function PlatformBadge({
  competition,
  floating,
}: {
  competition: "excel" | "powerbi";
  floating?: boolean;
}) {
  const isExcel = competition === "excel";
  const tone = isExcel
    ? "bg-emerald-600 text-white"
    : "bg-amber-500 text-white";
  const label = isExcel ? "Excel" : "Power BI";

  const base =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold " + tone;

  const positioned = floating
    ? "absolute right-3 top-3 shadow-[0_2px_8px_rgba(16,19,25,0.25)] " + base
    : base;

  return (
    <span className={positioned}>
      <PlatformIcon competition={competition} />
      {label}
    </span>
  );
}

function PlatformIcon({ competition }: { competition: "excel" | "powerbi" }) {
  if (competition === "excel") {
    // A grid, for a spreadsheet.
    return (
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" stroke="currentColor" />
        <path d="M0.5 4.5h11M0.5 7.5h11M4.5 0.5v11" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  // Rising bars, for a report.
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="7" width="3" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="4" width="3" height="7.5" rx="0.5" fill="currentColor" />
      <rect x="8.5" y="0.5" width="3" height="11" rx="0.5" fill="currentColor" />
    </svg>
  );
}

// The tile shown when an entry has no screenshot -- which is allowed for
// Power BI, where the live embed is the real showcase.
export function PlaceholderTile({
  competition,
  text,
}: {
  competition: "excel" | "powerbi";
  text: string;
}) {
  return (
    <div
      className={
        "flex h-full flex-col items-center justify-center gap-2 " +
        (competition === "powerbi"
          ? "bg-gradient-to-br from-amber-50 to-amber-100"
          : "bg-gradient-to-br from-emerald-50 to-emerald-100")
      }
    >
      <span className={competition === "powerbi" ? "text-amber-600" : "text-emerald-600"}>
        <svg width="30" height="30" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="0.5" y="7" width="3" height="4.5" rx="0.5" fill="currentColor" />
          <rect x="4.5" y="4" width="3" height="7.5" rx="0.5" fill="currentColor" />
          <rect x="8.5" y="0.5" width="3" height="11" rx="0.5" fill="currentColor" />
        </svg>
      </span>
      <span
        className={
          "text-xs font-bold " +
          (competition === "powerbi" ? "text-amber-700" : "text-emerald-700")
        }
      >
        {text}
      </span>
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
