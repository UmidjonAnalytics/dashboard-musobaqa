import type { GetServerSidePropsContext } from "next";
import { SESSION_COOKIE_NAME } from "./config";
import { verifySession } from "./session";
import { supabaseAdmin } from "./supabaseAdmin";

export type PublicUser = {
  telegramId: number;
  username: string | null;
  firstName: string;
  eligible: boolean;
};

// Reads the signed cookie and then looks the person up fresh from the
// database on every page load, so a newly approved group or a hand-granted
// flag takes effect immediately -- nobody has to log out and back in.
export async function getUserFromRequest(
  ctx: GetServerSidePropsContext
): Promise<PublicUser | null> {
  const raw = ctx.req.cookies[SESSION_COOKIE_NAME];
  const session = verifySession(raw);
  if (!session) return null;

  const admin = supabaseAdmin();
  const { data } = await admin
    .from("users")
    .select("telegram_id, username, first_name, manual_eligible, eligible_auto")
    .eq("telegram_id", session.telegramId)
    .maybeSingle();

  if (!data) return null;

  return {
    telegramId: data.telegram_id,
    username: data.username,
    firstName: data.first_name,
    eligible: data.manual_eligible === true || data.eligible_auto === true,
  };
}
