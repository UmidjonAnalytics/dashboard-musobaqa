import { createHmac, timingSafeEqual } from "crypto";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set.");
  return token;
}

async function callTelegramApi<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error in ${method}: ${JSON.stringify(data)}`);
  }
  return data.result as T;
}

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data: string }[][];
};

export async function sendMessage(
  chatId: number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export async function editMessageText(chatId: number, messageId: number, text: string): Promise<void> {
  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export async function leaveChat(chatId: number): Promise<void> {
  await callTelegramApi("leaveChat", { chat_id: chatId });
}

export type ChatMemberStatus =
  | "creator"
  | "administrator"
  | "member"
  | "restricted"
  | "left"
  | "kicked";

const STILL_A_MEMBER = new Set<ChatMemberStatus>(["creator", "administrator", "member", "restricted"]);

export function isMemberStatus(status: ChatMemberStatus | null): boolean {
  return status !== null && STILL_A_MEMBER.has(status);
}

export async function getChatMemberStatus(
  chatId: number,
  userId: number
): Promise<ChatMemberStatus | null> {
  try {
    const result = await callTelegramApi<{ status: ChatMemberStatus }>("getChatMember", {
      chat_id: chatId,
      user_id: userId,
    });
    return result.status;
  } catch {
    // Bot may no longer be in that group, or the person was never in it.
    return null;
  }
}
