import mongoose from "mongoose";
import { GEMINI_MODEL } from "@/lib/gemini";

const ResumeScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    fileName: { type: String, default: "" },
    jdText: { type: String, default: "" },
    score: { type: Number, required: true },
    metrics: {
      readability: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      keywords: { type: Number, default: 0 },
    },
    strengths: [{ type: String }],
    missingKeywords: [{ type: String }],
    suggestions: { type: String, default: "" },
    model: { type: String, default: GEMINI_MODEL },
  },
  { timestamps: true }
);

export default mongoose.models.ResumeScan ||
  mongoose.model("ResumeScan", ResumeScanSchema);
