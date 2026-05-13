import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, default: "Anonymous" },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: [true, "Review text is required"],
      minlength: [20, "Review must be at least 20 characters"],
    },
    status: {
      type: String,
      enum: ["Safe", "Warning", "Scam"],
      default: "Safe",
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ company: "text", review: "text" });

export default mongoose.models.Review ||
  mongoose.model("Review", ReviewSchema);
