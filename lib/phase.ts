import { supabaseAdmin } from "./supabaseAdmin";

// ============================================================================
// COMPETITION DATES
// ============================================================================
// Written as UTC instants. Tashkent is UTC+5, so 00:00 in Tashkent is 19:00
// UTC on the DAY BEFORE. To change a date, edit the Tashkent time in the
// comment and set the UTC value to match (subtract 5 hours).
//
//   uploads open   27.08.2026 00:00 Tashkent  ->  26.08.2026 19:00 UTC
//   uploads close  11.09.2026 00:00 Tashkent  ->  10.09.2026 19:00 UTC
//                  (so the last moment to upload is 10.09 at 23:59)
//   voting opens   11.09.2026 00:00 Tashkent  ->  10.09.2026 19:00 UTC
//                  (voting runs 11, 12 and 13 September)
//   voting closes  14.09.2026 00:00 Tashkent  ->  13.09.2026 19:00 UTC
//                  (so the last moment to vote is 13.09 at 23:59, and the
//                   winners appear on Monday 14 September)
// ============================================================================

export const UPLOAD_OPENS_UTC = "2026-08-26T19:00:00Z";
export const UPLOAD_CLOSES_UTC = "2026-09-10T19:00:00Z";
export const VOTING_OPENS_UTC = "2026-09-10T19:00:00Z";
export const VOTING_CLOSES_UTC = "2026-09-13T19:00:00Z";

export type Phase = "before" | "upload" | "voting" | "after";

// Works the phase out from the clock alone. There is no column anywhere
// that has to be remembered and switched over by hand.
export function phaseFromClock(now: Date): Phase {
  const t = now.getTime();
  if (t < new Date(UPLOAD_OPENS_UTC).getTime()) return "before";
  if (t < new Date(UPLOAD_CLOSES_UTC).getTime()) return "upload";
  if (t < new Date(VOTING_CLOSES_UTC).getTime()) return "voting";
  return "after";
}

// The real phase, unless a phase has been forced for testing.
// To force one, run this in the Supabase SQL editor:
//     update phase_settings set forced_phase = 'upload' where id = 1;
// To go back to the real dates:
//     update phase_settings set forced_phase = null where id = 1;
export async function getCurrentPhase(): Promise<{ phase: Phase; forced: boolean }> {
  const clockPhase = phaseFromClock(new Date());

  try {
    const admin = supabaseAdmin();
    const { data } = await admin
      .from("phase_settings")
      .select("forced_phase")
      .eq("id", 1)
      .maybeSingle();

    const forced = data && data.forced_phase ? (data.forced_phase as Phase) : null;
    if (forced) return { phase: forced, forced: true };
  } catch (err) {
    console.error("phase lookup failed, falling back to the clock:", err);
  }

  return { phase: clockPhase, forced: false };
}
