"use client";

export default function ExplanationBox({
  items = [],
  title = "Why this score?",
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-xl rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-lg">
      <h2 className="mb-3 text-center text-lg font-semibold">{title}</h2>

      <ul className="space-y-2 text-sm text-gray-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
