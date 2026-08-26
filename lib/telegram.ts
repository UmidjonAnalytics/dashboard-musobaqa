import { createHash, createHmac, timingSafeEqual } from "crypto";

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

export async function sendMessage(chatId: number, text: string): Promise<void> {
  await callTelegramApi("sendMessage", { chat_id: chatId, text });
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

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
};

/**
 * Verifies the redirect Telegram sends back after the Login Widget succeeds.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(params: Record<string, string>): TelegramLoginPayload | null {
  const { hash, ...rest } = params;
  if (!hash) return null;

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken()).digest();
  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  let hashMatches: boolean;
  try {
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(computedHash, "hex");
    hashMatches = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    hashMatches = false;
  }
  if (!hashMatches) return null;

  const authDate = Number(rest.auth_date);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > 86400) {
    return null;
  }

  const id = Number(rest.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    first_name: rest.first_name,
    last_name: rest.last_name,
    username: rest.username,
    photo_url: rest.photo_url,
    auth_date: authDate,
  };
}
