"use client";

export default function ScoreCard({ title, value, suffix = "%" }) {
  return (
    <div className="w-40 rounded-xl bg-white/10 p-5 text-center shadow-lg backdrop-blur-lg">
      <h3 className="mb-2 text-sm text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-cyan-400">
        {typeof value === "number" ? Math.round(value) : value}
        {suffix}
      </p>
    </div>
  );
}
