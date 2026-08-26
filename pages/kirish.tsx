import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { TELEGRAM_BOT_USERNAME } from "@/lib/config";

type Status = "loading" | "pending" | "notEligible" | "cancelled" | "expired" | "error";

export default function KirishPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // True while a check is already on its way to the server. Without this,
  // a slow check (the eligibility lookup talks to Telegram and can take a
  // couple of seconds) would still be running when the next tick fires,
  // and the two answers would fight over what the page shows.
  const inFlightRef = useRef(false);
  // Once we have a final answer, ignore anything that arrives afterwards.
  const finishedRef = useRef(false);

  useEffect(function () {
    start();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function finish(next: Status) {
    finishedRef.current = true;
    stopPolling();
    setStatus(next);
  }

  async function start() {
    stopPolling();
    finishedRef.current = false;
    inFlightRef.current = false;
    setStatus("loading");
    setToken("");

    try {
      const res = await fetch("/api/auth-start", { method: "POST" });
      const data = await res.json();
      if (!data || !data.token) {
        finish("error");
        return;
      }
      setToken(data.token);
      setStatus("pending");
      timerRef.current = setInterval(function () {
        poll(data.token);
      }, 1500);
    } catch {
      finish("error");
    }
  }

  async function poll(tok: string) {
    if (finishedRef.current || inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const res = await fetch("/api/auth-poll?token=" + encodeURIComponent(tok));
      const data = await res.json();

      // A late answer that arrives after we already finished is ignored.
      if (finishedRef.current) return;
      if (!data || data.status === "pending") return;

      if (data.status === "confirmed" && data.eligible === true) {
        finishedRef.current = true;
        stopPolling();
        window.location.href = "/";
      } else if (data.status === "confirmed") {
        finish("notEligible");
      } else if (data.status === "cancelled") {
        finish("cancelled");
      } else if (data.status === "expired" || data.status === "invalid") {
        finish("expired");
      } else {
        finish("error");
      }
    } catch {
      // A dropped request is fine -- the next tick tries again.
    } finally {
      inFlightRef.current = false;
    }
  }

  const deepLink = token
    ? "https://t.me/" + TELEGRAM_BOT_USERNAME + "?start=" + token
    : "#";

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_1px_3px_rgba(16,19,25,0.06)]">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{uz.login.title}</h1>

        {status === "loading" ? <p className="mt-6 text-ink/60">{uz.login.preparing}</p> : null}

        {status === "pending" ? (
          <div className="mt-6">
            <p className="text-ink/70">{uz.login.step1}</p>
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accentDark"
            >
              {uz.login.openTelegram}
            </a>
            <p className="mt-6 text-ink/70">{uz.login.step2}</p>
            <p className="mt-5 flex items-center gap-2 text-sm text-ink/45">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              {uz.login.waiting}
            </p>
          </div>
        ) : null}

        {status === "notEligible" ? (
          <div className="mt-6">
            <p className="text-warn">{uz.home.notEligible}</p>
            <Link
              href="/"
              className="mt-4 inline-block font-semibold text-accent underline underline-offset-4"
            >
              {uz.nav.home}
            </Link>
          </div>
        ) : null}

        {status === "cancelled" ? (
          <div className="mt-6">
            <p className="text-ink/70">{uz.login.cancelled}</p>
            <button
              onClick={start}
              className="mt-4 font-semibold text-accent underline underline-offset-4"
            >
              {uz.login.retry}
            </button>
          </div>
        ) : null}

        {status === "expired" || status === "error" ? (
          <div className="mt-6">
            <p className="text-warn">{uz.login.expired}</p>
            <button
              onClick={start}
              className="mt-4 font-semibold text-accent underline underline-offset-4"
            >
              {uz.login.retry}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-ink/45 underline underline-offset-4">
          {uz.nav.home}
        </Link>
      </div>
    </main>
  );
}
