import { supabaseAdmin } from "./supabaseAdmin";
import { getChatMemberStatus, isMemberStatus } from "./telegram";

// A student is auto-eligible if Telegram confirms they are still a member
// of at least one APPROVED class group. Only approved groups are checked --
// an unapproved one (bot added by a non-admin) never counts.
export async function checkAutoEligibility(telegramUserId: number): Promise<boolean> {
  const admin = supabaseAdmin();
  const { data: groups } = await admin
    .from("telegram_groups")
    .select("chat_id")
    .eq("status", "approved");

  if (!groups || groups.length === 0) return false;

  const statuses = await Promise.all(
    groups.map((g: { chat_id: number }) => getChatMemberStatus(g.chat_id, telegramUserId))
  );

  return statuses.some(isMemberStatus);
}
