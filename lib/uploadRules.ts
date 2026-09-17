// Shared rules about what may be uploaded. Used by BOTH the browser (to
// warn early) and the server (to actually enforce), so the two can never
// drift apart.

export const DASHBOARD_BUCKET = "dashboards"; // private
export const SCREENSHOT_BUCKET = "screenshots"; // public

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB -- must match
// the CHECK constraint on submissions.file_size_bytes AND the dashboards
// bucket file_size_limit in Supabase. Change all three together.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per screenshot

export const EXCEL_EXTS = ["xlsx", "xlsm", "xls"];
export const POWERBI_EXTS = ["pbix"];
export const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];

export const MAX_IMAGES = 4;
export const MIN_IMAGES = 1;

export type Competition = "excel" | "powerbi";

export function isCompetition(value: unknown): value is Competition {
  return value === "excel" || value === "powerbi";
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export function allowedDashboardExts(competition: Competition): string[] {
  return competition === "excel" ? EXCEL_EXTS : POWERBI_EXTS;
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

// Storage paths are built only from the competition, the submission's uuid
// and a random name. No part of a student's name or their original
// filename ever reaches the path.
export function buildStoragePath(
  competition: Competition,
  submissionId: string,
  randomName: string,
  ext: string
): string {
  return competition + "/" + submissionId + "/" + randomName + "." + ext;
}

export function publicImageUrl(supabaseUrl: string, path: string): string {
  return supabaseUrl.replace(/\/+$/, "") + "/storage/v1/object/public/" + SCREENSHOT_BUCKET + "/" + path;
}

// ---------------------------------------------------------------------------
// Power BI embeds
// ---------------------------------------------------------------------------

export const MAX_EMBED_LENGTH = 2000;

// Only real Power BI addresses may be placed in an iframe on the site.
// Anything else -- a look-alike login page, say -- would appear to be part
// of the competition, so it is refused here and again by the database.
const POWERBI_HOST = /^https:\/\/(app\.powerbi\.com|[a-z0-9-]+\.powerbi\.com|powerbi\.com)\//i;

// Students paste whatever the Power BI "Embed" dialog gives them, which is
// usually a whole <iframe ...> tag. This pulls the address out of it, and
// also accepts a plain link if that is what they pasted.
export function extractEmbedUrl(pasted: string): string | null {
  const text = (pasted || "").trim();
  if (!text) return null;

  let candidate = text;

  const srcMatch = text.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) {
    candidate = srcMatch[1].trim();
  }

  candidate = candidate.replace(/&amp;/g, "&");

  if (candidate.length > MAX_EMBED_LENGTH) return null;
  if (!POWERBI_HOST.test(candidate)) return null;

  return candidate;
}
