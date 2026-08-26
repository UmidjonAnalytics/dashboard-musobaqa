import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recordLoginAndCheckEligibility } from "@/lib/loginFlow";
import { signSession } from "@/lib/session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/config";

export const dynamic = "force-dynamic";

const TOKEN_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

// The /kirish page calls this every ~1.5s while it waits for the person to
// confirm inside Telegram.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("login_tokens")
    .select("status, telegram_id, username, first_name, created_at")
    .eq("token", token)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ status: "invalid" });
  }

  const ageMs = Date.now() - new Date(row.created_at).getTime();

  if (row.status === "pending") {
    if (ageMs > TOKEN_LIFETIME_MS) {
      await admin.from("login_tokens").delete().eq("token", token);
      return NextResponse.json({ status: "expired" });
    }
    return NextResponse.json({ status: "pending" });
  }

  if (row.status === "cancelled") {
    await admin.from("login_tokens").delete().eq("token", token);
    return NextResponse.json({ status: "cancelled" });
  }

  // row.status === "confirmed"
  await admin.from("login_tokens").delete().eq("token", token);

  if (row.telegram_id == null) {
    return NextResponse.json({ status: "invalid" });
  }

  const eligible = await recordLoginAndCheckEligibility({
    id: row.telegram_id,
    username: row.username ?? null,
    first_name: row.first_name ?? "Talaba",
  });

  if (!eligible) {
    return NextResponse.json({ status: "confirmed", eligible: false });
  }

  const cookieValue = signSession({
    telegramId: row.telegram_id,
    issuedAt: Math.floor(Date.now() / 1000),
  });

  const response = NextResponse.json({ status: "confirmed", eligible: true });
  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
