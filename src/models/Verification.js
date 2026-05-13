import mongoose from "mongoose";
import { GEMINI_MODEL } from "@/lib/gemini";

const VerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    inputText: { type: String, default: "" },
    fileName: { type: String, default: "" },
    score: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Suspicious", "Needs Review", "Likely Safe"],
      required: true,
    },
    tone: {
      type: String,
      enum: ["danger", "warning", "success"],
      required: true,
    },
    reason: { type: String, default: "" },
    factors: [{ type: String }],
    reviews: [
      {
        source: String,
        content: String,
        sentiment: {
          type: String,
          enum: ["danger", "warning", "positive"],
        },
      },
    ],
    model: { type: String, default: GEMINI_MODEL },
  },
  { timestamps: true }
);

export default mongoose.models.Verification ||
  mongoose.model("Verification", VerificationSchema);
