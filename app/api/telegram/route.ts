import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage, leaveChat } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// This is the bot's webhook. Telegram calls it every time something
// happens involving the bot -- we only care about the bot being added to
// or removed from a group (a "my_chat_member" update).
export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json();

  if (update.my_chat_member) {
    try {
      await handleMyChatMember(update.my_chat_member);
    } catch (err) {
      console.error("my_chat_member handling failed:", err);
    }
  }

  // Telegram just wants a fast 200 response; it does not read the body.
  return NextResponse.json({ ok: true });
}

type ChatMemberUpdate = {
  chat: { id: number; title?: string };
  from: { id: number; username?: string; first_name?: string };
  old_chat_member: { status: string };
  new_chat_member: { status: string };
};

async function handleMyChatMember(event: ChatMemberUpdate) {
  const chat = event.chat;
  const addedBy = event.from;
  const oldStatus = event.old_chat_member?.status;
  const newStatus = event.new_chat_member?.status;

  const wasOut = oldStatus === "left" || oldStatus === "kicked" || !oldStatus;
  const isIn = newStatus === "member" || newStatus === "administrator";
  const wasIn = oldStatus === "member" || oldStatus === "administrator";
  const isOut = newStatus === "left" || newStatus === "kicked";

  const admin = supabaseAdmin();

  if (wasOut && isIn) {
    await handleBotAdded(admin, chat, addedBy);
  } else if (wasIn && isOut) {
    await handleBotRemoved(admin, chat);
  }
}

async function handleBotAdded(
  admin: SupabaseClient,
  chat: { id: number; title?: string },
  addedBy: { id: number; username?: string; first_name?: string }
) {
  const { data: existing } = await admin
    .from("telegram_groups")
    .select("status, title, approved_at")
    .eq("chat_id", chat.id)
    .maybeSingle();

  const { data: adminRow } = await admin
    .from("admins")
    .select("telegram_id")
    .eq("telegram_id", addedBy.id)
    .maybeSingle();

  const addedByIsAdmin = !!adminRow;
  const alreadyApproved = existing?.status === "approved";
  // Once approved, a group can never be silently downgraded by someone
  // else re-adding the bot -- only a brand-new group needs the admin check.
  const shouldApprove = addedByIsAdmin || alreadyApproved;

  await admin.from("telegram_groups").upsert({
    chat_id: chat.id,
    title: chat.title ?? existing?.title ?? null,
    added_by_telegram_id: addedBy.id,
    status: shouldApprove ? "approved" : "unapproved",
    approved_at: shouldApprove ? existing?.approved_at ?? new Date().toISOString() : existing?.approved_at ?? null,
  });

  if (!shouldApprove) {
    await leaveChat(chat.id).catch(() => {});
    const who = addedBy.username ? `@${addedBy.username}` : addedBy.first_name ?? String(addedBy.id);
    await notifyAdmins(
      admin,
      `Diqqat: "${chat.title ?? chat.id}" guruhiga botni ${who} qo'shdi, lekin u tasdiqlangan admin emas. Bot guruhdan avtomatik chiqib ketdi.`
    );
  }
}

async function handleBotRemoved(admin: SupabaseClient, chat: { id: number; title?: string }) {
  // The group's approval status is deliberately left untouched here --
  // re-adding the bot later restores everything automatically.
  await notifyAdmins(
    admin,
    `Ogohlantirish: bot "${chat.title ?? chat.id}" guruhidan chiqarib yuborildi (yoki chiqib ketdi). Guruh holati o'zgartirilmadi -- botni qayta qo'shsangiz, hammasi tiklanadi.`
  );
}

async function notifyAdmins(admin: SupabaseClient, text: string) {
  const { data: admins } = await admin.from("admins").select("telegram_id");
  for (const a of admins ?? []) {
    await sendMessage(a.telegram_id, text).catch(() => {});
  }
}
