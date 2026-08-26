import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const TOKEN_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

// Called when a visitor lands on /kirish. Creates a one-time, single-use
// ticket that will link this browser tab to whatever happens next in
// Telegram.
export async function POST() {
  const admin = supabaseAdmin();

  // Light housekeeping so this table never grows without bound.
  await admin
    .from("login_tokens")
    .delete()
    .lt("created_at", new Date(Date.now() - TOKEN_LIFETIME_MS).toISOString());

  const token = randomBytes(24).toString("hex");
  const { error } = await admin.from("login_tokens").insert({ token });

  if (error) {
    return NextResponse.json({ error: "could not create login token" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
