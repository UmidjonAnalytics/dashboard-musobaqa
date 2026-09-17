// Browser-side helper: asks our server for a signed URL, then sends the
// file straight to Supabase Storage. The file never touches our own server.

export type SignedTarget = {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
};

export async function requestSignedUrl(params: {
  competition: string;
  submissionId: string;
  kind: "dashboard" | "image";
  ext: string;
}): Promise<SignedTarget> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data && data.error ? String(data.error) : "upload_url_failed");
  }
  return data as SignedTarget;
}

export async function uploadToSignedUrl(target: SignedTarget, file: File): Promise<void> {
  const res = await fetch(target.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error("storage_upload_failed_" + res.status + (detail ? ": " + detail : ""));
  }
}
