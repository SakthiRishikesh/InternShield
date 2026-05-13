import { connectDB } from "@/lib/db";
import ResumeScan from "@/models/ResumeScan";
import Review from "@/models/Review";
import Verification from "@/models/Verification";

export async function getDashboardStats(userId) {
  await connectDB();

  const [verifications, scamsBlocked, reviews, resumeScans] = await Promise.all([
    Verification.countDocuments({ userId }),
    Verification.countDocuments({ userId, tone: "danger" }),
    Review.countDocuments({ userId }),
    ResumeScan.countDocuments({ userId }),
  ]);

  const recentActivity = [];

  const [recentVerifications, recentReviews, recentScans] = await Promise.all([
    Verification.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
    Review.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
    ResumeScan.find({ userId }).sort({ createdAt: -1 }).limit(2).lean(),
  ]);

  recentVerifications.forEach((verification) => {
    recentActivity.push({
      type: "verification",
      text: `Scanned: ${verification.status} (${verification.score}%)`,
      detail: verification.inputText?.slice(0, 60) || verification.fileName || "Offer scan",
      time: verification.createdAt,
      icon: verification.tone === "danger" ? "!" : verification.tone === "success" ? "OK" : "?",
    });
  });

  recentReviews.forEach((review) => {
    recentActivity.push({
      type: "review",
      text: `Reviewed ${review.company}`,
      detail: `${review.rating} stars - ${review.status}`,
      time: review.createdAt,
      icon: "RV",
    });
  });

  recentScans.forEach((scan) => {
    recentActivity.push({
      type: "resume",
      text: `Resume scan: ${scan.score}%`,
      detail: scan.fileName || "Resume analyzed",
      time: scan.createdAt,
      icon: "CV",
    });
  });

  recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

  return {
    stats: {
      verifications,
      scamsBlocked,
      reviews,
      resumeScans,
    },
    activity: recentActivity.slice(0, 6),
  };
}
