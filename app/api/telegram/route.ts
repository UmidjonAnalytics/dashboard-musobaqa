import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage, leaveChat, answerCallbackQuery, editMessageText } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const TOKEN_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

// This is the bot's one and only webhook. Telegram calls it for every kind
// of update; we only react to three of them:
//   - message            -> someone tapped a "log in" deep link (/start <token>)
//   - callback_query     -> someone tapped Confirm/Cancel under the bot's message
//   - my_chat_member     -> the bot was added to or removed from a group
export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json();

  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.my_chat_member) {
      await handleMyChatMember(update.my_chat_member);
    }
  } catch (err) {
    console.error("webhook handling failed:", err);
  }

  // Telegram just wants a fast 200 response; it does not read the body.
  return NextResponse.json({ ok: true });
}

// ----------------------------------------------------------------------------
// Login: "/start <token>" deep link -> ask the person to confirm
// ----------------------------------------------------------------------------

type Message = {
  chat: { id: number };
  text?: string;
};

async function handleMessage(message: Message) {
  const text = message.text?.trim();
  if (!text || !text.startsWith("/start")) return;

  const token = text.split(/\s+/)[1];
  const chatId = message.chat.id;

  if (!token) {
    await sendMessage(chatId, "Saytdagi \"Telegram orqali kirish\" tugmasini bosib qaytadan urining.");
    return;
  }

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("login_tokens")
    .select("status, created_at")
    .eq("token", token)
    .maybeSingle();

  const tooOld = row && Date.now() - new Date(row.created_at).getTime() > TOKEN_LIFETIME_MS;

  if (!row || row.status !== "pending" || tooOld) {
    await sendMessage(chatId, "Bu kirish havolasi eskirgan. Saytga qaytib, qaytadan urinib ko'ring.");
    return;
  }

  await sendMessage(chatId, "Saytga kirishni tasdiqlaysizmi?", {
    inline_keyboard: [
      [
        { text: "Ha, tasdiqlayman", callback_data: `confirm:${token}` },
        { text: "Bekor qilish", callback_data: `cancel:${token}` },
      ],
    ],
  });
}

// ----------------------------------------------------------------------------
// Login: Confirm / Cancel button tap
// ----------------------------------------------------------------------------

type CallbackQuery = {
  id: string;
  data?: string;
  from: { id: number; username?: string; first_name?: string };
  message?: { chat: { id: number }; message_id: number };
};

async function handleCallbackQuery(cq: CallbackQuery) {
  const [action, token] = (cq.data ?? "").split(":");

  if (!token || (action !== "confirm" && action !== "cancel")) {
    await answerCallbackQuery(cq.id);
    return;
  }

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("login_tokens")
    .select("status, created_at")
    .eq("token", token)
    .maybeSingle();

  const tooOld = row && Date.now() - new Date(row.created_at).getTime() > TOKEN_LIFETIME_MS;

  if (!row || row.status !== "pending" || tooOld) {
    await answerCallbackQuery(cq.id, "Bu havola endi amal qilmaydi.");
    return;
  }

  if (action === "cancel") {
    await admin.from("login_tokens").update({ status: "cancelled" }).eq("token", token);
    await answerCallbackQuery(cq.id, "Bekor qilindi.");
    if (cq.message) {
      await editMessageText(cq.message.chat.id, cq.message.message_id, "Kirish bekor qilindi.");
    }
    return;
  }

  await admin
    .from("login_tokens")
    .update({
      status: "confirmed",
      telegram_id: cq.from.id,
      username: cq.from.username ?? null,
      first_name: cq.from.first_name ?? "Talaba",
    })
    .eq("token", token);

  await answerCallbackQuery(cq.id, "Tasdiqlandi!");
  if (cq.message) {
    await editMessageText(
      cq.message.chat.id,
      cq.message.message_id,
      "Tasdiqlandi. Brauzeringizga qayting."
    );
  }
}

// ----------------------------------------------------------------------------
// Group approval (unchanged from before)
// ----------------------------------------------------------------------------

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
