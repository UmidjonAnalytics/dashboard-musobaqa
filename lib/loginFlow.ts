import { supabaseAdmin } from "./supabaseAdmin";
import { checkAutoEligibility } from "./eligibility";

export type TelegramIdentity = {
  id: number;
  username: string | null;
  first_name: string;
};

// Records who this Telegram account is -- even when they turn out not to be
// eligible, because that row is how the teacher looks up someone's
// telegram_id in order to grant access by hand.
//
// Note carefully: manual_eligible is READ before the upsert and is never
// included IN the upsert. That is what guarantees the automatic group check
// can never overwrite a manual grant.
export async function recordLoginAndCheckEligibility(person: TelegramIdentity): Promise<boolean> {
  const admin = supabaseAdmin();

  const { data: existing } = await admin
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

  const manualEligible = existing ? existing.manual_eligible === true : false;
  return autoEligible || manualEligible;
}
