import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";
import { serializeReview } from "@/lib/reviews";
import Review from "@/models/Review";

export async function PATCH(req, { params }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    if (review.userId.toString() !== user.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    if (body.company !== undefined) review.company = body.company.trim();
    if (body.review !== undefined) review.review = body.review.trim();
    if (body.rating !== undefined) review.rating = Math.min(5, Math.max(1, Number(body.rating)));
    if (body.status && ["Safe", "Warning", "Scam"].includes(body.status)) review.status = body.status;

    await review.save();

    return NextResponse.json({ review: serializeReview(review) });
  } catch (err) {
    console.error("[REVIEW PATCH ERROR]", err);
    return NextResponse.json({ error: err.message || "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    if (review.userId.toString() !== user.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    await Review.findByIdAndDelete(id);

    return NextResponse.json({ message: "Review deleted." });
  } catch (err) {
    console.error("[REVIEW DELETE ERROR]", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
