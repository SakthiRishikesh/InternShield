"use client";

import { useState } from "react";
import MatchScore from "./MatchScore";
import ExplanationBox from "./ExplanationBox";
import { useVerification } from "@/hooks/useVerification";

export default function VerificationForm() {
  const [text, setText] = useState("");
  const { analyze, result, error, loading, clearError } = useVerification();

  const scoreSummary = result
    ? {
        trustScore: result.score,
        status: result.status,
        tone: result.tone,
      }
    : null;

  return (
    <div className="text-center">
      <h1 className="mb-4 text-5xl font-bold">InternShield</h1>

      <p className="mb-6 text-gray-400">
        Detect fake internships, verify offer signals, and review risk before you
        reply.
      </p>

      <div className="mx-auto max-w-xl space-y-4">
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            clearError();
          }}
          placeholder="Paste internship details..."
          className="h-32 w-full resize-none rounded-xl border border-cyan-500/30 bg-black/40 p-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={() => analyze({ text, file: null })}
          className="rounded-lg bg-cyan-500 px-6 py-3 text-black transition hover:bg-cyan-400"
          disabled={loading}
        >
          {loading ? "Running scan..." : "Run Verification"}
        </button>
      </div>

      <MatchScore result={scoreSummary} />
      <ExplanationBox items={result?.factors ?? []} />
    </div>
  );
}
