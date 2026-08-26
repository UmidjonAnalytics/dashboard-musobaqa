import type { Metadata } from "next";
import "./globals.css";
import { uz } from "@/lib/uz";

export const metadata: Metadata = {
  title: uz.siteTitle,
  description: uz.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
