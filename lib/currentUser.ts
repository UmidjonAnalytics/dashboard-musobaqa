import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./config";
import { verifySession } from "./session";
import { supabaseAdmin } from "./supabaseAdmin";

export type CurrentUser = {
  telegramId: number;
  username: string | null;
  firstName: string;
  manualEligible: boolean;
  eligibleAuto: boolean;
};

// Reads the session cookie (if any) and looks the person up fresh from the
// database every time -- eligibility can change (a group gets approved, or
// the teacher grants access by hand) without anyone needing to log in again.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
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
    manualEligible: data.manual_eligible,
    eligibleAuto: data.eligible_auto,
  };
}

export function isEligible(user: CurrentUser | null): boolean {
  return !!user && (user.manualEligible || user.eligibleAuto);
}
