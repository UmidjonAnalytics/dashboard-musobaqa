import Link from "next/link";
import { uz } from "./uz";
import { PlatformBadge } from "./ui";
import type { Winner } from "./voting";

// Shown once voting has closed. Deliberately loud -- this is the moment the
// competition has been building towards, and it should not look like just
// another row in a table.
export default function WinnerBanner({ winners }: { winners: Winner[] }) {
  if (winners.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-ink/55">{uz.winner.none}</p>
      </div>
    );
  }

  return (
    <section>
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">
          {uz.winner.congrats}
        </p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-ink">{uz.winner.title}</h2>
        <p className="mx-auto mt-2.5 max-w-xl text-ink/55">{uz.winner.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {winners.map(function (w) {
          return <WinnerCard key={w.submissionId} winner={w} />;
        })}
      </div>

      <div className="mt-7 text-center">
        <Link
          href="/natijalar"
          className="text-sm font-bold text-accent underline underline-offset-4"
        >
          {uz.winner.allResults}
        </Link>
      </div>
    </section>
  );
}

function WinnerCard({ winner }: { winner: Winner }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-white p-7 shadow-[0_4px_20px_rgba(180,83,9,0.10)]">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40" />

      <div className="relative flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-black tracking-wide text-white">
          <Trophy />
          {uz.winner.badge}
        </span>
        <PlatformBadge competition={winner.competition} />
      </div>

      <h3 className="relative mt-5 text-2xl font-black leading-tight tracking-tight text-ink">
        {winner.title}
      </h3>

      <div className="relative mt-5 flex items-end gap-6">
        <div>
          <p className="text-4xl font-black tabular-nums text-ink">{winner.rating.toFixed(2)}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-ink/40">
            {uz.winner.score}
          </p>
        </div>
        <p className="pb-1.5 text-sm font-semibold text-ink/50">
          {winner.votesCount} {uz.winner.votes}
        </p>
      </div>

      <Link
        href={"/ish?id=" + winner.submissionId}
        className="relative mt-6 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate1"
      >
        {uz.winner.viewWork}
      </Link>
    </div>
  );
}

function Trophy() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 1.5h7v3.2a3.5 3.5 0 1 1-7 0V1.5Z"
        fill="currentColor"
      />
      <path
        d="M3.5 2.5H1.8v1a2 2 0 0 0 1.7 2M10.5 2.5h1.7v1a2 2 0 0 1-1.7 2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M7 8.2v2.3M4.7 12.5h4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
