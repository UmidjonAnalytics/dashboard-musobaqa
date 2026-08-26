import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramLogin } from "@/lib/telegram";
import { checkAutoEligibility } from "@/lib/eligibility";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signSession } from "@/lib/session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

// This is the data-auth-url the Telegram Login Widget redirects the
// student's browser to once they approve the login in Telegram.
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const payload = verifyTelegramLogin(params);

  if (!payload) {
    return NextResponse.redirect(`${SITE_URL}/?login=error`);
  }

  const admin = supabaseAdmin();

  // Look up any existing manual grant BEFORE we upsert, so we never
  // overwrite it with the automatic check's result.
  const { data: existingUser } = await admin
    .from("users")
    .select("manual_eligible")
    .eq("telegram_id", payload.id)
    .maybeSingle();

  const autoEligible = await checkAutoEligibility(payload.id);

  // We always record who this Telegram account is -- even if they turn out
  // not to be eligible -- because this is how the teacher finds someone's
  // telegram_id in order to grant access to them by hand.
  await admin.from("users").upsert(
    {
      telegram_id: payload.id,
      username: payload.username ?? null,
      first_name: payload.first_name,
      eligible_auto: autoEligible,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" }
  );

  const manualEligible = existingUser?.manual_eligible ?? false;
  const eligible = autoEligible || manualEligible;

  if (!eligible) {
    // No session is created for ineligible visitors -- they are not logged
    // in, per the site's rules. Their Telegram info is on file now, though,
    // so the teacher can grant them access by hand if that is a mistake.
    return NextResponse.redirect(`${SITE_URL}/?login=not-eligible`);
  }

  const cookieValue = signSession({
    telegramId: payload.id,
    issuedAt: Math.floor(Date.now() / 1000),
  });

  const response = NextResponse.redirect(`${SITE_URL}/`);
  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
