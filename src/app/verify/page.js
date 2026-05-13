"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import MatrixBackground from "@/components/MatrixBackground";
import { useVerification } from "@/hooks/useVerification";

function getStatusStyles(tone) {
  if (tone === "danger") {
    return {
      score: "text-red-500",
      icon: "bg-red-500/20 text-red-500",
      bullet: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    };
  }

  if (tone === "warning") {
    return {
      score: "text-yellow-400",
      icon: "bg-yellow-500/20 text-yellow-400",
      bullet: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]",
    };
  }

  return {
    score: "text-green-500",
    icon: "bg-green-500/20 text-green-500",
    bullet: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
  };
}

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const { result, error, loading, progress, stage, analyze, clearError } = useVerification();
  const statusStyles = getStatusStyles(result?.tone);

  const handleVerify = () => {
    analyze({ text, file });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    clearError();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <MatrixBackground />
      <Navbar />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-start px-4 pb-20 pt-28">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest uppercase border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400">
            Powered by Gemini AI
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Offer Verification
          </h1>
          <p className="mx-auto max-w-lg text-gray-400">
            Scan internship details using AI-powered analysis. Our system detects scam patterns, verifies trust signals,
            and provides real-time risk assessment.
          </p>
        </motion.div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-fit rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Offer Details
              </label>
              <textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  clearError();
                }}
                placeholder="Paste the internship email, role summary, or recruiter message here..."
                className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm transition-all placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Upload Document
              </label>
              <label className="group relative block cursor-pointer">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-8 transition-all group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5">
                  <span className="mb-1 max-w-[220px] truncate text-sm font-medium text-gray-300">
                    {file?.name ?? "Upload Document"}
                  </span>
                  <p className="text-xs text-gray-500">
                    Text-based PDF (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {error && (
              <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {loading && (
              <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                  <span>{stage || "Analyzing..."}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/40">
                  <motion.div
                    className="h-full rounded-full bg-cyan-400"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-sm font-bold uppercase tracking-widest shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing with Gemini AI..." : "Run AI Scan"}
            </button>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-3xl">
                    <div className="absolute right-0 top-0 p-6">
                      <div className="text-xs font-bold uppercase tracking-tighter text-gray-500">
                        Trust Score
                      </div>
                      <div className={`text-4xl font-black ${statusStyles.score}`}>
                        {result.score}%
                      </div>
                    </div>

                    <div className="mb-6 flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black ${statusStyles.icon}`}
                      >
                        {result.tone === "danger"
                          ? "!"
                          : result.tone === "warning"
                            ? "?"
                            : "OK"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{result.status}</h3>
                        <p className="text-xs uppercase tracking-widest text-gray-400">
                          Scan Verdict
                        </p>
                      </div>
                    </div>

                    <p className="mb-6 text-sm leading-relaxed text-gray-300">
                      {result.reason}
                    </p>

                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                        Signal Summary
                      </div>
                      {result.factors.map((factor) => (
                        <div key={factor} className="flex items-center gap-3 text-sm text-gray-400">
                          <div className={`h-1.5 w-1.5 rounded-full ${statusStyles.bullet}`} />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-black/40 p-8 backdrop-blur-2xl">
                    <div className="mb-6 flex items-center justify-between">
                      <h4 className="text-lg font-bold">Context Signals</h4>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-gray-400">
                        Heuristic
                      </span>
                    </div>

                    <div className="space-y-4">
                      {result.reviews.map((review, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-500">
                              {review.source}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                review.sentiment === "danger"
                                  ? "bg-red-500/20 text-red-400"
                                  : review.sentiment === "warning"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {review.sentiment}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-gray-400">
                            {review.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 p-8 text-center"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-sm font-black uppercase tracking-[0.3em] opacity-30">
                    Scan
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-500">Ready for Scan</h3>
                  <p className="max-w-xs text-sm uppercase tracking-tighter text-gray-600">
                    Results will appear here after the trust scan finishes.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
