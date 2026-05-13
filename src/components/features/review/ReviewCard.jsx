"use client";

export default function ReviewCard({
  company,
  rating,
  review,
  status,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-cyan-500/30">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold transition-colors group-hover:text-cyan-400">
            {company}
          </h3>
          <p className="mt-1 text-sm text-yellow-400">
            Rating {rating.toFixed(1)} / 5.0
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              status === "Safe"
                ? "border border-green-500/20 bg-green-500/10 text-green-400"
                : status === "Scam"
                  ? "border border-red-500/20 bg-red-500/10 text-red-400"
                  : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {status}
          </span>

          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onEdit}
              className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              title="Edit Review"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20"
              title="Delete Review"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm italic leading-relaxed text-gray-400">{review}</p>
    </div>
  );
}
