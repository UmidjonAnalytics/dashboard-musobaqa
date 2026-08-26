import { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { uz } from "@/lib/uz";
import { getUserFromRequest, PublicUser } from "@/lib/getUser";
import { getCurrentPhase, Phase } from "@/lib/phase";
import { requestSignedUrl, uploadToSignedUrl } from "@/lib/uploadClient";
import {
  MAX_FILE_BYTES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  EXCEL_EXTS,
  POWERBI_EXTS,
  IMAGE_EXTS,
  extensionOf,
} from "@/lib/uploadRules";

type Props = {
  user: PublicUser | null;
  phase: Phase;
  forced: boolean;
  supabaseUrl: string;
};

type ImageSlot = {
  key: string;
  file: File | null;
  url: string;
  isMain: boolean;
};

function newSlot(isMain: boolean): ImageSlot {
  return {
    key: Math.random().toString(36).slice(2) + Date.now().toString(36),
    file: null,
    url: "",
    isMain: isMain,
  };
}

export default function YuklashPage({ user, phase, forced, supabaseUrl }: Props) {
  const [competition, setCompetition] = useState<"excel" | "powerbi">("excel");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<ImageSlot[]>([newSlot(true)]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <Shell>
        <p className="text-warn">{uz.uploadError.notLoggedIn}</p>
        <Link href="/kirish" className="mt-4 inline-block font-semibold text-accent underline">
          {uz.nav.login}
        </Link>
      </Shell>
    );
  }

  if (!user.eligible) {
    return (
      <Shell>
        <p className="text-warn">{uz.home.notEligible}</p>
      </Shell>
    );
  }

  if (phase !== "upload") {
    return (
      <Shell>
        <p className="text-warn">{uz.uploadError.notUploadPhase}</p>
        <p className="mt-2 text-ink/60">
          {phase === "before"
            ? uz.phase.before
            : phase === "voting"
              ? uz.phase.votingOpen
              : uz.phase.after}
        </p>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <p className="text-lg font-bold text-ink">{uz.upload.success}</p>
        <p className="mt-2 text-ink/60">{uz.upload.successHint}</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-accent underline">
          {uz.nav.home}
        </Link>
      </Shell>
    );
  }

  function setMain(index: number) {
    setSlots(function (prev) {
      return prev.map(function (s, i) {
        return { ...s, isMain: i === index };
      });
    });
  }

  function updateSlot(index: number, patch: Partial<ImageSlot>) {
    setSlots(function (prev) {
      return prev.map(function (s, i) {
        return i === index ? { ...s, ...patch } : s;
      });
    });
  }

  function addSlot() {
    setSlots(function (prev) {
      if (prev.length >= MAX_IMAGES) return prev;
      return prev.concat([newSlot(false)]);
    });
  }

  function removeSlot(index: number) {
    setSlots(function (prev) {
      if (prev.length <= 1) return prev;
      const next = prev.filter(function (_s, i) {
        return i !== index;
      });
      // If the main image was the one removed, promote the first remaining.
      const hasMain = next.some(function (s) {
        return s.isMain;
      });
      if (!hasMain && next.length > 0) next[0] = { ...next[0], isMain: true };
      return next;
    });
  }

  async function handleSubmit() {
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(uz.uploadError.noTitle);
      return;
    }
    if (!file) {
      setError(uz.uploadError.noFile);
      return;
    }

    const ext = extensionOf(file.name);
    const allowed = competition === "excel" ? EXCEL_EXTS : POWERBI_EXTS;
    if (allowed.indexOf(ext) === -1) {
      setError(uz.uploadError.badExtension);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(uz.uploadError.fileTooBig);
      return;
    }

    const filled = slots.filter(function (s) {
      return s.file !== null || s.url.trim().length > 0;
    });
    if (filled.length < 1) {
      setError(uz.uploadError.noImages);
      return;
    }
    if (filled.length > MAX_IMAGES) {
      setError(uz.uploadError.tooManyImages);
      return;
    }
    const mainCount = filled.filter(function (s) {
      return s.isMain;
    }).length;
    if (mainCount !== 1) {
      setError(uz.uploadError.noMain);
      return;
    }
    for (const s of filled) {
      if (s.file) {
        if (s.file.size > MAX_IMAGE_BYTES) {
          setError(uz.uploadError.imageTooBig);
          return;
        }
        if (IMAGE_EXTS.indexOf(extensionOf(s.file.name)) === -1) {
          setError(uz.uploadError.badExtension);
          return;
        }
      }
    }

    setBusy(true);

    try {
      // The submission's id is made here in the browser and reused as the
      // storage folder name, so the two can never disagree.
      const submissionId = makeUuid();

      setProgress(uz.upload.uploadingFile);
      const dashTarget = await requestSignedUrl({
        competition: competition,
        submissionId: submissionId,
        kind: "dashboard",
        ext: ext,
      });
      await uploadToSignedUrl(dashTarget, file);

      setProgress(uz.upload.uploadingImages);
      const imagePayload: Array<{ url: string; isMain: boolean }> = [];

      for (const slot of filled) {
        if (slot.file) {
          const imgExt = extensionOf(slot.file.name);
          const target = await requestSignedUrl({
            competition: competition,
            submissionId: submissionId,
            kind: "image",
            ext: imgExt,
          });
          await uploadToSignedUrl(target, slot.file);
          const publicUrl =
            supabaseUrl.replace(/\/+$/, "") +
            "/storage/v1/object/public/screenshots/" +
            target.path;
          imagePayload.push({ url: publicUrl, isMain: slot.isMain });
        } else {
          imagePayload.push({ url: slot.url.trim(), isMain: slot.isMain });
        }
      }

      setProgress(uz.upload.saving);
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          competition: competition,
          title: trimmedTitle,
          description: description.trim(),
          filePath: dashTarget.path,
          fileSize: file.size,
          images: imagePayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(messageForError(data && data.error ? String(data.error) : ""));
        setBusy(false);
        setProgress("");
        return;
      }

      setDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(messageForError(raw));
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{uz.upload.title}</h1>
      {forced ? (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-warn">
          {uz.phase.testingBanner}
        </p>
      ) : null}

      <div className="mt-8 space-y-7">
        <Field label={uz.upload.competition}>
          <div className="flex gap-3">
            {(["excel", "powerbi"] as const).map(function (c) {
              return (
                <button
                  key={c}
                  type="button"
                  onClick={function () {
                    setCompetition(c);
                    setFile(null);
                  }}
                  className={
                    "rounded-xl border px-5 py-2.5 font-semibold transition " +
                    (competition === c
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-white text-ink/70 hover:border-accent")
                  }
                >
                  {c === "excel" ? uz.upload.excel : uz.upload.powerbi}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={uz.upload.dashTitle} hint={uz.upload.dashTitleHint}>
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={function (e) {
              setTitle(e.target.value);
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-accent"
          />
        </Field>

        <Field label={uz.upload.description}>
          <textarea
            value={description}
            maxLength={2000}
            rows={3}
            onChange={function (e) {
              setDescription(e.target.value);
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-accent"
          />
        </Field>

        <Field
          label={uz.upload.file}
          hint={competition === "excel" ? uz.upload.fileHintExcel : uz.upload.fileHintPowerbi}
        >
          <input
            type="file"
            accept={
              competition === "excel"
                ? ".xlsx,.xlsm,.xls"
                : ".pbix"
            }
            onChange={function (e) {
              const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
              setFile(f);
            }}
            className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {file ? (
            <p className="mt-2 text-sm text-ink/50">
              {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          ) : null}
        </Field>

        <Field label={uz.upload.images} hint={uz.upload.imagesHint}>
          <div className="space-y-3">
            {slots.map(function (slot, index) {
              return (
                <div key={slot.key} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink/70">
                      <input
                        type="radio"
                        name="mainImage"
                        checked={slot.isMain}
                        onChange={function () {
                          setMain(index);
                        }}
                      />
                      {uz.upload.mainImage}
                    </label>
                    {slots.length > 1 ? (
                      <button
                        type="button"
                        onClick={function () {
                          removeSlot(index);
                        }}
                        className="ml-auto text-sm text-ink/45 underline"
                      >
                        {uz.upload.removeImage}
                      </button>
                    ) : null}
                  </div>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={function (e) {
                      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      updateSlot(index, { file: f, url: f ? "" : slot.url });
                    }}
                    className="mt-3 block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
                  />

                  <input
                    type="text"
                    value={slot.url}
                    placeholder={uz.upload.imageUrlPlaceholder}
                    onChange={function (e) {
                      updateSlot(index, { url: e.target.value, file: null });
                    }}
                    className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              );
            })}
          </div>

          {slots.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={addSlot}
              className="mt-3 font-semibold text-accent underline underline-offset-4"
            >
              {uz.upload.addImage}
            </button>
          ) : null}
        </Field>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>
        ) : null}

        {busy && progress ? (
          <p className="flex items-center gap-2 text-sm text-ink/60">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
            {progress}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-accent px-6 py-3.5 font-bold text-white transition hover:bg-accentDark disabled:opacity-50"
        >
          {busy ? uz.upload.submitting : uz.upload.submit}
        </button>
      </div>
    </Shell>
  );
}

function messageForError(code: string): string {
  if (code.indexOf("already_submitted") !== -1) return uz.uploadError.alreadySubmitted;
  if (code.indexOf("not_eligible") !== -1) return uz.uploadError.notEligible;
  if (code.indexOf("not_logged_in") !== -1) return uz.uploadError.notLoggedIn;
  if (code.indexOf("not_upload_phase") !== -1) return uz.uploadError.notUploadPhase;
  if (code.indexOf("bad_extension") !== -1) return uz.uploadError.badExtension;
  if (code.indexOf("bad_file_size") !== -1) return uz.uploadError.fileTooBig;
  if (code.indexOf("need_exactly_one_main") !== -1) return uz.uploadError.noMain;
  if (code.indexOf("bad_image_count") !== -1) return uz.uploadError.noImages;
  if (code) return uz.uploadError.generic + " (" + code + ")";
  return uz.uploadError.generic;
}

// crypto.randomUUID exists in every current browser, but this keeps working
// on older ones rather than failing at the worst moment.
function makeUuid(): string {
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-semibold text-ink">{label}</label>
      {hint ? <p className="mb-2 mt-1 text-sm text-ink/50">{hint}</p> : <div className="mb-2" />}
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_1px_3px_rgba(16,19,25,0.06)]">
        {children}
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-ink/45 underline underline-offset-4">
          {uz.nav.home}
        </Link>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  let user: PublicUser | null = null;
  try {
    user = await getUserFromRequest(ctx);
  } catch (err) {
    console.error("yuklash user lookup failed:", err);
  }

  const phaseInfo = await getCurrentPhase();

  return {
    props: {
      user: user,
      phase: phaseInfo.phase,
      forced: phaseInfo.forced,
      supabaseUrl: process.env.SUPABASE_URL || "",
    },
  };
};
