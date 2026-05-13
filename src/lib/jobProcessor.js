import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { analyzeResumeWithAI, analyzeVerificationWithAI } from "@/lib/aiScans";
import { GEMINI_MODEL } from "@/lib/gemini";
import { extractTextFromUpload } from "@/lib/fileExtraction";
import { getAuthUser } from "@/lib/authGuard";
import AiJob from "@/models/AiJob";
import ResumeScan from "@/models/ResumeScan";
import Verification from "@/models/Verification";

export function createClientToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function serializeJob(job) {
  return {
    id: job._id.toString(),
    type: job.type,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    fileName: job.fileName,
    error: job.error,
    resultId: job.resultId?.toString?.() || null,
    result: job.result,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function updateJob(jobId, patch) {
  await connectDB();
  return AiJob.findByIdAndUpdate(
    jobId,
    { ...patch, updatedAt: new Date() },
    { returnDocument: "after" }
  );
}

export async function createAiJob({ req, type, fileName = "", inputText = "", jdText = "" }) {
  await connectDB();
  const user = await getAuthUser(req);
  const clientToken = createClientToken();
  const job = await AiJob.create({
    type,
    userId: user?.id || null,
    clientToken,
    status: "queued",
    stage: "Queued for analysis",
    progress: 5,
    fileName,
    inputText: inputText.slice(0, 7000),
    jdText: jdText.slice(0, 3000),
    model: GEMINI_MODEL,
  });

  return { job, clientToken, user };
}

export async function canReadJob(req, jobId, token) {
  await connectDB();
  const job = await AiJob.findById(jobId).select("+clientToken");

  if (!job) return { allowed: false, job: null, status: 404 };

  if (token && token === job.clientToken) {
    return { allowed: true, job };
  }

  const user = await getAuthUser(req);
  if (user && job.userId?.toString() === user.id) {
    return { allowed: true, job };
  }

  return { allowed: false, job: null, status: 403 };
}

export async function processVerificationJob(jobId, { text = "", file = null } = {}) {
  try {
    await updateJob(jobId, {
      status: "processing",
      stage: file ? "Extracting offer document" : "Preparing offer details",
      progress: 18,
      error: "",
    });

    let fileName = "";
    let extractedText = "";
    let fileSummary = "";

    if (file && file.name) {
      const extracted = await extractTextFromUpload(file, {
        label: "offer document",
        maxChars: 5000,
      });
      fileName = extracted.fileName;
      extractedText = extracted.extractedText;
      fileSummary = extracted.summary;
    }

    const inputText = [text.trim(), fileSummary, extractedText && `Extracted file content:\n${extractedText}`]
      .filter(Boolean)
      .join("\n\n");

    if (!inputText.trim()) {
      throw new Error("Provide details or upload a readable PDF before running the scan.");
    }

    await updateJob(jobId, {
      stage: "Analyzing internship risk signals with Gemini AI",
      progress: 52,
      inputText: inputText.slice(0, 7000),
      fileName,
    });

    const safeResult = await analyzeVerificationWithAI(inputText);

    await updateJob(jobId, {
      stage: "Saving verification result",
      progress: 84,
    });

    await connectDB();
    const job = await AiJob.findById(jobId);
    const saved = await Verification.create({
      userId: job.userId || null,
      inputText: inputText.slice(0, 5000),
      fileName,
      ...safeResult,
      model: GEMINI_MODEL,
    });

    await updateJob(jobId, {
      status: "completed",
      stage: "Verification complete",
      progress: 100,
      resultId: saved._id,
      result: {
        ...safeResult,
        id: saved._id.toString(),
        createdAt: saved.createdAt,
      },
      error: "",
    });
  } catch (err) {
    await updateJob(jobId, {
      status: "failed",
      stage: "Verification failed",
      progress: 100,
      error: err.message || "Verification failed.",
    });
  }
}

export async function processResumeJob(jobId, { file, jdText = "" } = {}) {
  try {
    await updateJob(jobId, {
      status: "processing",
      stage: "Extracting resume PDF",
      progress: 18,
      error: "",
    });

    if (!file || !file.name) {
      throw new Error("Upload a resume before starting the scan.");
    }

    const extracted = await extractTextFromUpload(file, {
      label: "resume",
      maxChars: 7000,
    });

    const resumeInfo = `${extracted.summary}\n\nExtracted resume content:\n${extracted.extractedText}`;

    await updateJob(jobId, {
      stage: "Matching resume content against ATS signals",
      progress: 46,
      fileName: extracted.fileName,
      inputText: extracted.extractedText.slice(0, 7000),
      jdText: jdText.slice(0, 3000),
    });

    const safeResult = await analyzeResumeWithAI({
      resumeInfo,
      jdText,
    });

    await updateJob(jobId, {
      stage: "Saving ATS report",
      progress: 84,
    });

    await connectDB();
    const job = await AiJob.findById(jobId);
    const saved = await ResumeScan.create({
      userId: job.userId || null,
      fileName: extracted.fileName,
      jdText: jdText.slice(0, 3000),
      ...safeResult,
      model: GEMINI_MODEL,
    });

    await updateJob(jobId, {
      status: "completed",
      stage: "ATS analysis complete",
      progress: 100,
      resultId: saved._id,
      result: {
        ...safeResult,
        id: saved._id.toString(),
        createdAt: saved.createdAt,
      },
      error: "",
    });
  } catch (err) {
    await updateJob(jobId, {
      status: "failed",
      stage: "Resume analysis failed",
      progress: 100,
      error: err.message || "Resume analysis failed.",
    });
  }
}
