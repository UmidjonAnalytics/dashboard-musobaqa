// Every call this project makes to Telegram lives in this file.

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set in Vercel.");
  return token;
}

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch("https://api.telegram.org/bot" + botToken() + "/" + method, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error("Telegram API error in " + method + ": " + JSON.stringify(data));
  }
  return data.result as T;
}

export type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

export async function sendMessage(
  chatId: number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  const body: Record<string, unknown> = { chat_id: chatId, text: text };
  if (keyboard) body.reply_markup = keyboard;
  await callTelegram("sendMessage", body);
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string
): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: text,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) body.text = text;
  await callTelegram("answerCallbackQuery", body);
}

export async function leaveChat(chatId: number): Promise<void> {
  await callTelegram("leaveChat", { chat_id: chatId });
}

export type ChatMemberStatus =
  | "creator"
  | "administrator"
  | "member"
  | "restricted"
  | "left"
  | "kicked";

// "restricted" still means present in the group (just muted or limited),
// so it counts as membership.
const PRESENT: ChatMemberStatus[] = ["creator", "administrator", "member", "restricted"];

export function isMemberStatus(status: ChatMemberStatus | null): boolean {
  return status !== null && PRESENT.indexOf(status) !== -1;
}

export async function getChatMemberStatus(
  chatId: number,
  userId: number
): Promise<ChatMemberStatus | null> {
  try {
    const result = await callTelegram<{ status: ChatMemberStatus }>("getChatMember", {
      chat_id: chatId,
      user_id: userId,
    });
    return result.status;
  } catch {
    // The bot may no longer be in that group, or this person was never in it.
    return null;
  }
}
