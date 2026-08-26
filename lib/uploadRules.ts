// Shared rules about what may be uploaded. Used by BOTH the browser (to
// warn early) and the server (to actually enforce), so the two can never
// drift apart.

export const DASHBOARD_BUCKET = "dashboards"; // private
export const SCREENSHOT_BUCKET = "screenshots"; // public

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
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
