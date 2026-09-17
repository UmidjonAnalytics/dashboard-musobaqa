import { supabaseAdmin } from "./supabaseAdmin";
import { getChatMemberStatus, isMemberStatus } from "./telegramApi";

// A student is automatically eligible if Telegram confirms they are still
// a member of at least one APPROVED class group. Groups marked unapproved
// never count, so someone who added the bot to their own group gains
// nothing from it.
export async function checkAutoEligibility(telegramUserId: number): Promise<boolean> {
  const admin = supabaseAdmin();

  const { data: groups } = await admin
    .from("telegram_groups")
    .select("chat_id")
    .eq("status", "approved");

  if (!groups || groups.length === 0) return false;

  const checks = groups.map(function (g: { chat_id: number }) {
    return getChatMemberStatus(g.chat_id, telegramUserId);
  });

  const statuses = await Promise.all(checks);

  for (const status of statuses) {
    if (isMemberStatus(status)) return true;
  }
  return false;
}
