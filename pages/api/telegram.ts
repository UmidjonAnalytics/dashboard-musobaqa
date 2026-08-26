import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage, leaveChat, answerCallbackQuery, editMessageText } from "@/lib/telegramApi";
import { LOGIN_TOKEN_LIFETIME_MS } from "@/lib/config";
import { uz } from "@/lib/uz";

// The bot's one and only webhook. Telegram calls this for everything the
// bot sees; we react to exactly three kinds of update:
//
//   message         -> somebody opened a login deep link (/start <token>)
//   callback_query  -> somebody tapped Confirm or Cancel under our message
//   my_chat_member  -> the bot was added to, or removed from, a group
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    // A browser visiting this URL lands here. Handy for confirming the
    // route deployed at all.
    res.status(200).json({ ok: true, note: "telegram webhook is deployed" });
    return;
  }

  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(401).json({ ok: false });
    return;
  }

  const update = req.body;

  try {
    if (update && update.message) {
      await handleMessage(update.message);
    } else if (update && update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update && update.my_chat_member) {
      await handleMyChatMember(update.my_chat_member);
    }
  } catch (err) {
    // Never fail the response: if Telegram sees an error it retries the
    // same update forever and the queue backs up.
    console.error("webhook handling failed:", err);
  }

  res.status(200).json({ ok: true });
}

// ---------------------------------------------------------------------------
// Login step 1: the student opened  t.me/yourbot?start=<token>
// ---------------------------------------------------------------------------

type Message = {
  chat: { id: number };
  text?: string;
};

async function handleMessage(message: Message) {
  const text = message.text ? message.text.trim() : "";
  if (!text || text.indexOf("/start") !== 0) return;

  const chatId = message.chat.id;
  const parts = text.split(/\s+/);
  const token = parts.length > 1 ? parts[1] : "";

  if (!token) {
    await sendMessage(chatId, uz.bot.noToken);
    return;
  }

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("login_tokens")
    .select("status, created_at")
    .eq("token", token)
    .maybeSingle();

  const tooOld = row ? Date.now() - new Date(row.created_at).getTime() > LOGIN_TOKEN_LIFETIME_MS : false;

  if (!row || row.status !== "pending" || tooOld) {
    await sendMessage(chatId, uz.bot.linkExpired);
    return;
  }

  await sendMessage(chatId, uz.bot.askConfirm, {
    inline_keyboard: [
      [
        { text: uz.bot.confirmYes, callback_data: "confirm:" + token },
        { text: uz.bot.confirmNo, callback_data: "cancel:" + token },
      ],
    ],
  });
}

// ---------------------------------------------------------------------------
// Login step 2: the student tapped Confirm or Cancel
// ---------------------------------------------------------------------------

type CallbackQuery = {
  id: string;
  data?: string;
  from: { id: number; username?: string; first_name?: string };
  message?: { chat: { id: number }; message_id: number };
};

async function handleCallbackQuery(cq: CallbackQuery) {
  const raw = cq.data ? cq.data : "";
  const sep = raw.indexOf(":");
  const action = sep === -1 ? "" : raw.slice(0, sep);
  const token = sep === -1 ? "" : raw.slice(sep + 1);

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

  const tooOld = row ? Date.now() - new Date(row.created_at).getTime() > LOGIN_TOKEN_LIFETIME_MS : false;

  if (!row || row.status !== "pending" || tooOld) {
    await answerCallbackQuery(cq.id, uz.bot.toastExpired);
    return;
  }

  if (action === "cancel") {
    await admin.from("login_tokens").update({ status: "cancelled" }).eq("token", token);
    await answerCallbackQuery(cq.id, uz.bot.toastCancelled);
    if (cq.message) {
      await editMessageText(cq.message.chat.id, cq.message.message_id, uz.bot.cancelled);
    }
    return;
  }

  // The identity recorded here comes from Telegram itself (cq.from), never
  // from anything the browser sent -- so a student cannot confirm a login
  // as somebody else.
  await admin
    .from("login_tokens")
    .update({
      status: "confirmed",
      telegram_id: cq.from.id,
      username: cq.from.username ? cq.from.username : null,
      first_name: cq.from.first_name ? cq.from.first_name : "Talaba",
    })
    .eq("token", token);

  await answerCallbackQuery(cq.id, uz.bot.toastConfirmed);
  if (cq.message) {
    await editMessageText(cq.message.chat.id, cq.message.message_id, uz.bot.confirmed);
  }
}

// ---------------------------------------------------------------------------
// Group approval
// ---------------------------------------------------------------------------

type ChatMemberUpdate = {
  chat: { id: number; title?: string };
  from: { id: number; username?: string; first_name?: string };
  old_chat_member?: { status: string };
  new_chat_member?: { status: string };
};

async function handleMyChatMember(event: ChatMemberUpdate) {
  const oldStatus = event.old_chat_member ? event.old_chat_member.status : "";
  const newStatus = event.new_chat_member ? event.new_chat_member.status : "";

  const wasOut = oldStatus === "left" || oldStatus === "kicked" || oldStatus === "";
  const isIn = newStatus === "member" || newStatus === "administrator";
  const wasIn = oldStatus === "member" || oldStatus === "administrator";
  const isOut = newStatus === "left" || newStatus === "kicked";

  const admin = supabaseAdmin();

  if (wasOut && isIn) {
    await handleBotAdded(admin, event.chat, event.from);
  } else if (wasIn && isOut) {
    await handleBotRemoved(admin, event.chat);
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
  const alreadyApproved = existing ? existing.status === "approved" : false;

  // An already-approved group stays approved no matter who re-adds the bot.
  // Only a brand-new group has to pass the admin check.
  const shouldApprove = addedByIsAdmin || alreadyApproved;

  const previousApprovedAt = existing && existing.approved_at ? existing.approved_at : null;

  await admin.from("telegram_groups").upsert({
    chat_id: chat.id,
    title: chat.title ? chat.title : existing && existing.title ? existing.title : null,
    added_by_telegram_id: addedBy.id,
    status: shouldApprove ? "approved" : "unapproved",
    approved_at: shouldApprove
      ? previousApprovedAt
        ? previousApprovedAt
        : new Date().toISOString()
      : previousApprovedAt,
  });

  if (!shouldApprove) {
    await leaveChat(chat.id).catch(function () {});
    const who = addedBy.username
      ? "@" + addedBy.username
      : addedBy.first_name
        ? addedBy.first_name
        : String(addedBy.id);
    const where = chat.title ? chat.title : String(chat.id);
    await notifyAdmins(
      admin,
      "Diqqat: \"" +
        where +
        "\" guruhiga botni " +
        who +
        " qo'shdi, lekin u tasdiqlangan admin emas. Bot guruhdan avtomatik chiqib ketdi."
    );
  }
}

async function handleBotRemoved(admin: SupabaseClient, chat: { id: number; title?: string }) {
  // Deliberately does NOT change the group's status. Removing the bot from
  // a real class group is usually an accident; re-adding it restores
  // everything with no extra work.
  const where = chat.title ? chat.title : String(chat.id);
  await notifyAdmins(
    admin,
    "Ogohlantirish: bot \"" +
      where +
      "\" guruhidan chiqarib yuborildi. Guruh holati o'zgartirilmadi -- botni qayta qo'shsangiz, hammasi tiklanadi."
  );
}

async function notifyAdmins(admin: SupabaseClient, text: string) {
  const { data: admins } = await admin.from("admins").select("telegram_id");
  const list = admins ? admins : [];
  for (const a of list) {
    await sendMessage(a.telegram_id, text).catch(function () {});
  }
}
