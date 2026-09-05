import { useState } from "react";
import { uz } from "./uz";

const MIN_SUGGESTION = 20;

const CRITERIA = [
  { key: "design", label: uz.vote.design },
  { key: "diagrams", label: uz.vote.diagrams },
  { key: "problemSolving", label: uz.vote.problem },
] as const;

type Scores = { design: number; diagrams: number; problemSolving: number };

export default function VoteForm({
  submissionId,
  onVoted,
}: {
  submissionId: string;
  onVoted: () => void;
}) {
  const [scores, setScores] = useState<Scores>({ design: 0, diagrams: 0, problemSolving: 0 });
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const trimmedLength = suggestion.trim().length;
  const ready =
    scores.design > 0 &&
    scores.diagrams > 0 &&
    scores.problemSolving > 0 &&
    trimmedLength >= MIN_SUGGESTION;

  const average =
    scores.design > 0 && scores.diagrams > 0 && scores.problemSolving > 0
      ? (scores.design + scores.diagrams + scores.problemSolving) / 3
      : null;

  async function submit() {
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          design: scores.design,
          diagrams: scores.diagrams,
          problemSolving: scores.problemSolving,
          suggestion: suggestion.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const code = data && data.error ? String(data.error) : "";
        setError(messageFor(code));
        setBusy(false);
        return;
      }

      onVoted();
    } catch {
      setError(uz.voteError.generic);
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="text-lg font-extrabold tracking-tight text-ink">{uz.vote.title}</h2>

      <div className="mt-6 space-y-5">
        {CRITERIA.map(function (c) {
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink/80">{c.label}</span>
                <span className="text-sm font-bold text-ink/35">
                  {scores[c.key] > 0 ? scores[c.key] : "—"}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map(function (n) {
                  const selected = scores[c.key] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={function () {
                        setScores(function (prev) {
                          const next = { ...prev };
                          next[c.key] = n;
                          return next;
                        });
                      }}
                      className={
                        "h-11 flex-1 rounded-xl border font-bold transition " +
                        (selected
                          ? "border-accent bg-accent text-white"
                          : "border-line bg-white text-ink/50 hover:border-accent hover:text-ink")
                      }
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {average !== null ? (
        <p className="mt-5 text-sm font-bold text-ink/45">
          {uz.vote.yourScore}: {average.toFixed(2)}
        </p>
      ) : null}

      <div className="mt-6">
        <label className="block font-semibold text-ink/80">{uz.vote.suggestion}</label>
        <p className="mb-2 mt-1 text-sm text-ink/45">{uz.vote.suggestionHint}</p>
        <textarea
          value={suggestion}
          rows={4}
          maxLength={2000}
          onChange={function (e) {
            setSuggestion(e.target.value);
          }}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-accent"
        />
        <p
          className={
            "mt-1.5 text-sm font-semibold " +
            (trimmedLength >= MIN_SUGGESTION ? "text-emerald-700" : "text-ink/40")
          }
        >
          {trimmedLength} / {MIN_SUGGESTION} {uz.vote.suggestionCount}
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!ready || busy}
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-accent px-6 py-3.5 font-bold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? uz.vote.submitting : uz.vote.submit}
      </button>
    </div>
  );
}

function messageFor(code: string): string {
  if (code === "already_voted") return uz.voteError.alreadyVoted;
  if (code === "own_work" || code === "rejected_by_rules") return uz.voteError.ownWork;
  if (code === "not_voting_phase") return uz.voteError.notVotingPhase;
  if (code === "suggestion_too_short") return uz.voteError.tooShort;
  if (code === "bad_scores") return uz.voteError.badScores;
  return uz.voteError.generic;
}
