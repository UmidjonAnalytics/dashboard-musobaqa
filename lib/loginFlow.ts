import { supabaseAdmin } from "./supabaseAdmin";
import { checkAutoEligibility } from "./eligibility";

export type TelegramIdentity = {
  id: number;
  username: string | null;
  first_name: string;
};

// Records who this Telegram account is (even if not eligible -- that is how
// the teacher finds someone's telegram_id to grant access by hand) and
// returns whether they are currently eligible to upload/vote.
// manual_eligible is deliberately read BEFORE the upsert and never included
// in it, so the automatic check can never overwrite a manual grant.
export async function recordLoginAndCheckEligibility(person: TelegramIdentity): Promise<boolean> {
  const admin = supabaseAdmin();

  const { data: existingUser } = await admin
    .from("users")
    .select("manual_eligible")
    .eq("telegram_id", person.id)
    .maybeSingle();

  const autoEligible = await checkAutoEligibility(person.id);

  await admin.from("users").upsert(
    {
      telegram_id: person.id,
      username: person.username,
      first_name: person.first_name,
      eligible_auto: autoEligible,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" }
  );

  const manualEligible = existingUser?.manual_eligible ?? false;
  return autoEligible || manualEligible;
}
