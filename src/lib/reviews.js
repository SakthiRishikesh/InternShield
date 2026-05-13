import { connectDB } from "@/lib/db";
import Review from "@/models/Review";

export function serializeReview(review) {
  return {
    id: review._id.toString(),
    userId: review.userId?.toString(),
    userName: review.userName,
    company: review.company,
    rating: review.rating,
    review: review.review,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export async function listReviews({ search = "", page = 1, limit = 20 } = {}) {
  await connectDB();

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;
  const filter = search ? { $text: { $search: search } } : {};

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews: reviews.map(serializeReview),
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}
