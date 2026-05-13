"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateResumeFile, RESUME_SCAN_STEPS } from "@/lib/resume";
import { api } from "@/lib/api";
import { openEventStream } from "@/lib/realtime";

export default function ResumePage() {
  const closeStreamRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      closeStreamRef.current?.();
    };
  }, []);

  const closeStream = () => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    const validationError = selectedFile ? validateResumeFile(selectedFile) : "";

    if (validationError) {
      setFile(null);
      setResult(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    const validationError = validateResumeFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsScanning(true);
    setResult(null);
    setScanStep(0);
    setProgress(4);
    setStage("Starting resume analysis...");
    closeStream();

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (jdText.trim()) {
        formData.append("jdText", jdText.trim());
      }

      const data = await api.resume.createJob(formData);
      setProgress(data.job.progress || 0);
      setStage(data.job.stage || "");

      closeStreamRef.current = openEventStream(
        api.resume.eventsUrl(data.job.id, data.streamToken),
        {
          events: {
            job: (job) => {
              setProgress(job.progress || 0);
              setStage(job.stage || "");
              setScanStep(
                Math.min(
                  RESUME_SCAN_STEPS.length - 1,
                  Math.floor(((job.progress || 0) / 100) * RESUME_SCAN_STEPS.length)
                )
              );

              if (job.status === "completed") {
                setResult(job.result);
                setIsScanning(false);
                closeStream();
              }

              if (job.status === "failed") {
                setError(job.error || "We could not analyze this resume.");
                setIsScanning(false);
                closeStream();
              }
            },
            error: (payload) => {
              setError(payload.error || "Resume analysis stream failed.");
              setIsScanning(false);
              closeStream();
            },
          },
          error: () => {
            setError("Realtime resume analysis connection was interrupted.");
            setIsScanning(false);
            closeStream();
          },
        }
      );
    } catch (err) {
      closeStream();
      setError(err.message || "We could not analyze this resume.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-cyan-500/30">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest uppercase border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400">
            Gemini AI Analysis
          </div>
          <h1 className="mb-4 text-4xl font-black md:text-5xl">
            ATS{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Optimiser
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-gray-400">
            Upload your resume and let AI analyze its ATS compatibility with real-time
            scoring, keyword matching, and actionable recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 lg:col-span-5"
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <label className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                1. Upload Resume
              </label>
              <label className="group relative block cursor-pointer">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-10 transition-all group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5">
                  <span className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
                    CV
                  </span>
                  <p className="mb-1 text-sm font-medium text-gray-300">
                    {file?.name ?? "Choose Resume"}
                  </p>
                  <p className="text-xs uppercase tracking-tighter text-gray-500">
                    Supported: text-based PDF (Max 10MB)
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

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <label className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                2. Target Job Description (Optional)
              </label>
              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                placeholder="Paste the job requirements here for keyword analysis..."
                className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm transition-all placeholder:text-gray-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isScanning}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-5 text-sm font-bold uppercase tracking-widest text-white shadow-2xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isScanning ? "Analyzing with Gemini AI..." : "Analyze ATS Performance"}
            </button>
          </motion.div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center"
                >
                  <div className="relative mb-10 h-32 w-32">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-t-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-cyan-400">
                      ATS
                    </div>
                  </div>
                  <motion.p
                    key={scanStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-medium tracking-wide text-cyan-400"
                  >
                    {stage || RESUME_SCAN_STEPS[scanStep]}
                  </motion.p>
                  <div className="mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-cyan-400"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {progress}% complete
                  </p>
                  <p className="mt-3 text-xs text-gray-600">Processing via Gemini AI</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/40 to-black p-8">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">Analysis Verdict</h3>
                        <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                          Gemini AI-Powered ATS Report
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-cyan-400">
                          {result.score}%
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-tighter text-gray-600">
                          ATS Compatibility
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: "Readability", val: result.metrics.readability },
                        { label: "Formatting", val: result.metrics.formatting },
                        { label: "Keywords", val: result.metrics.keywords },
                      ].map((metric) => (
                        <div key={metric.label} className="text-center">
                          <div className="mb-1 text-lg font-bold">{metric.val}%</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-green-500">
                        Strengths
                      </h4>
                      <div className="space-y-3">
                        {result.strengths.map((strength) => (
                          <div key={strength} className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-orange-500">
                        {result.usedJobDescription ? "Missing Keywords" : "Focus Areas"}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] text-orange-400"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-8">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
                      Recommendation
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-300">
                      {result.suggestions}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/5 p-12 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-sm font-black uppercase tracking-[0.3em] opacity-40">
                    ATS
                  </div>
                  <h3 className="text-xl font-bold text-gray-600">Pending Analysis</h3>
                  <p className="mt-2 max-w-xs text-sm uppercase tracking-tighter text-gray-700">
                    Upload your resume and an optional job description to unlock the
                    AI-powered report.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
