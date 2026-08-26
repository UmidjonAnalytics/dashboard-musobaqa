"use client";

import { useEffect, useRef } from "react";

export default function LoginWidget({
  botUsername,
  authUrl,
}: {
  botUsername: string;
  authUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !botUsername) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");
    containerRef.current.appendChild(script);
  }, [botUsername, authUrl]);

  if (!botUsername) {
    return (
      <p className="text-sm text-red-700">
        NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set in Vercel.
      </p>
    );
  }

  return <div ref={containerRef} />;
}
