import { supabaseAdmin } from "./supabaseAdmin";
import type { Competition } from "./uploadRules";

// What the public is allowed to see about a submission.
// owner_telegram_id is deliberately absent from this type and from every
// query below, so a student's identity cannot leak through a listing.
export type PublicWork = {
  id: string;
  competition: Competition;
  title: string;
  description: string | null;
  mainImage: string | null;
  images: string[];
};

export async function listWorks(competition: Competition): Promise<PublicWork[]> {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("submissions")
    .select("id, competition, title, description, submission_images(image_url, is_main, position)")
    .eq("competition", competition)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("listWorks failed:", error);
    return [];
  }

  return data.map(toPublicWork);
}

export async function getWork(id: string): Promise<PublicWork | null> {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("submissions")
    .select("id, competition, title, description, submission_images(image_url, is_main, position)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toPublicWork(data);
}

type ImageRow = { image_url: string; is_main: boolean; position: number };

function toPublicWork(row: {
  id: string;
  competition: string;
  title: string;
  description: string | null;
  submission_images: ImageRow[] | null;
}): PublicWork {
  const imgs = (row.submission_images || []).slice().sort(function (a, b) {
    return a.position - b.position;
  });

  const main = imgs.find(function (i) {
    return i.is_main;
  });

  return {
    id: row.id,
    competition: row.competition as Competition,
    title: row.title,
    description: row.description,
    mainImage: main ? main.image_url : imgs.length > 0 ? imgs[0].image_url : null,
    images: imgs.map(function (i) {
      return i.image_url;
    }),
  };
}
