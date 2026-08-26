"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { uz } from "@/lib/uz";
import { TELEGRAM_BOT_USERNAME } from "@/lib/config";

type Status = "loading" | "pending" | "not-eligible" | "cancelled" | "expired" | "error";

export default function LoginPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    start();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function start() {
    stopPolling();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/start", { method: "POST" });
      const data = await res.json();
      if (!data.token) {
        setStatus("error");
        return;
      }
      setToken(data.token);
      setStatus("pending");
      pollTimer.current = setInterval(() => poll(data.token), 1500);
    } catch {
      setStatus("error");
    }
  }

  async function poll(tok: string) {
    try {
      const res = await fetch(`/api/auth/poll?token=${tok}`);
      const data = await res.json();
      if (data.status === "pending") return;

      stopPolling();
      if (data.status === "confirmed" && data.eligible) {
        window.location.href = "/";
      } else if (data.status === "confirmed") {
        setStatus("not-eligible");
      } else if (data.status === "cancelled") {
        setStatus("cancelled");
      } else if (data.status === "expired" || data.status === "invalid") {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    } catch {
      // Network hiccup -- keep polling, the interval will try again.
    }
  }

  const deepLink = token ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}` : "#";

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">{uz.login.title}</h1>

      {status === "loading" && <p className="mt-6 text-ink/70">{uz.login.preparing}</p>}

      {status === "pending" && (
        <>
          <p className="mt-6 text-ink/70">{uz.login.instructions}</p>
          
            href={deepLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-xl bg-accent2 px-6 py-3 font-medium text-white"
          >
            {uz.login.openTelegram}
          </a>
          <p className="mt-4 text-sm text-ink/50">{uz.login.waiting}</p>
        </>
      )}

      {status === "not-eligible" && <p className="mt-6 text-amber-900">{uz.home.notEligible}</p>}

      {status === "cancelled" && (
        <>
          <p className="mt-6 text-ink/70">{uz.login.cancelled}</p>
          <button onClick={start} className="mt-4 font-medium text-accent2 underline">
            {uz.login.retry}
          </button>
        </>
      )}

      {(status === "expired" || status === "error") && (
        <>
          <p className="mt-6 text-red-800">{uz.login.expired}</p>
          <button onClick={start} className="mt-4 font-medium text-accent2 underline">
            {uz.login.retry}
          </button>
        </>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm text-ink/50 underline">
          {uz.nav.home}
        </Link>
      </div>
    </main>
  );
}
