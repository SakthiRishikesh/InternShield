"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { openEventStream } from "@/lib/realtime";

export function useVerification() {
  const closeStreamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [job, setJob] = useState(null);

  useEffect(() => {
    return () => {
      closeStreamRef.current?.();
    };
  }, []);

  const closeStream = () => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  };

  const clearState = () => {
    closeStream();
    setLoading(false);
    setError("");
    setProgress(0);
    setStage("");
    setJob(null);
  };

  const analyze = async ({ text, file }) => {
    const trimmedText = text?.trim() ?? "";

    if (!trimmedText && !file) {
      setResult(null);
      setError("Provide details or upload a readable PDF before running the scan.");
      return false;
    }

    clearState();
    setResult(null);
    setLoading(true);
    setStage("Starting verification job...");
    setProgress(4);

    try {
      const formData = new FormData();
      formData.append("text", trimmedText);
      if (file) {
        formData.append("file", file);
      }

      const data = await api.verify.createJob(formData);
      setJob(data.job);
      setStage(data.job.stage);
      setProgress(data.job.progress || 0);

      closeStreamRef.current = openEventStream(
        api.verify.eventsUrl(data.job.id, data.streamToken),
        {
          events: {
            job: (nextJob) => {
              setJob(nextJob);
              setStage(nextJob.stage || "");
              setProgress(nextJob.progress || 0);

              if (nextJob.status === "completed") {
                setResult(nextJob.result);
                setError("");
                setLoading(false);
                closeStream();
              }

              if (nextJob.status === "failed") {
                setResult(null);
                setError(nextJob.error || "We could not finish the scan.");
                setLoading(false);
                closeStream();
              }
            },
            error: (payload) => {
              setError(payload.error || "Verification stream failed.");
              setLoading(false);
              closeStream();
            },
          },
          error: () => {
            setError("Realtime verification connection was interrupted.");
            setLoading(false);
            closeStream();
          },
        }
      );

      return true;
    } catch (err) {
      setResult(null);
      setError(err.message || "We could not start the scan.");
      setLoading(false);
      closeStream();
      return false;
    }
  };

  const clearError = () => {
    setError("");
  };

  return {
    result,
    error,
    loading,
    progress,
    stage,
    job,
    analyze,
    clearError,
    reset: clearState,
  };
}
