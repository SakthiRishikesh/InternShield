import mongoose from "mongoose";
import { GEMINI_MODEL } from "@/lib/gemini";

const AiJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["verification", "resume_scan"],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    clientToken: {
      type: String,
      required: true,
      index: true,
      select: false,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    stage: { type: String, default: "Queued for analysis" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    inputText: { type: String, default: "" },
    fileName: { type: String, default: "" },
    jdText: { type: String, default: "" },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: { type: String, default: "" },
    model: { type: String, default: GEMINI_MODEL },
  },
  { timestamps: true }
);

AiJobSchema.index({ userId: 1, createdAt: -1 });
AiJobSchema.index({ type: 1, updatedAt: -1 });

export default mongoose.models.AiJob || mongoose.model("AiJob", AiJobSchema);
