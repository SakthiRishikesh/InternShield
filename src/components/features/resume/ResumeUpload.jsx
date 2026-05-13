"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { openEventStream } from "@/lib/realtime";
import { validateResumeFile } from "@/lib/resume";

export default function ResumeUpload() {
  const closeStreamRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => closeStreamRef.current?.();
  }, []);

  const closeStream = () => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    const validationError = selectedFile ? validateResumeFile(selectedFile) : "";

    closeStream();
    setResult(null);
    setProgress(0);
    setStage("");

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleAnalyze = async () => {
    const validationError = validateResumeFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(4);
    setStage("Starting resume analysis...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.resume.createJob(formData);

      closeStreamRef.current = openEventStream(
        api.resume.eventsUrl(data.job.id, data.streamToken),
        {
          events: {
            job: (job) => {
              setProgress(job.progress || 0);
              setStage(job.stage || "");

              if (job.status === "completed") {
                setResult(job.result);
                setLoading(false);
                closeStream();
              }

              if (job.status === "failed") {
                setError(job.error || "Resume analysis failed.");
                setLoading(false);
                closeStream();
              }
            },
          },
        }
      );
    } catch (err) {
      setError(err.message || "Resume analysis failed.");
      setLoading(false);
      closeStream();
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white/10 p-6 text-center shadow-xl backdrop-blur-lg">
      <h2 className="mb-4 text-xl font-semibold">Upload Resume</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="mb-4 text-sm text-gray-300"
      />

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {file && <p className="mb-2 text-gray-400">Selected: {file.name}</p>}

      {file && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mb-4 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      )}

      {loading && (
        <div className="mb-3 text-sm text-cyan-300">
          {stage || "Processing..."} ({progress}%)
        </div>
      )}

      {result && (
        <p className="font-semibold text-cyan-400">Resume Score: {result.score}</p>
      )}
    </div>
  );
}
