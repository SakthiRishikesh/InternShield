"use client";

import ScoreCard from "./ScoreCard";

export default function MatchScore({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-4">
      <ScoreCard title="Trust Score" value={result.trustScore} />
      <ScoreCard title="Verdict" value={result.status} suffix="" />
    </div>
  );
}
