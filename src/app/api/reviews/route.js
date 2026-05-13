import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";
import { listReviews, serializeReview } from "@/lib/reviews";
import Review from "@/models/Review";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    return NextResponse.json(await listReviews({ search, page, limit }));
  } catch (err) {
    console.error("[REVIEWS GET ERROR]", err);
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const company = (body.company || "").trim();
    const reviewText = (body.review || "").trim();
    const rating = Number(body.rating) || 5;
    const status = ["Safe", "Warning", "Scam"].includes(body.status) ? body.status : "Safe";

    if (!company || company.length < 2) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    if (!reviewText || reviewText.length < 20) {
      return NextResponse.json(
        { error: "Review must be at least 20 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.create({
      userId: user.id,
      userName: user.name || "Anonymous",
      company,
      rating: Math.min(5, Math.max(1, rating)),
      review: reviewText,
      status,
    });

    return NextResponse.json(
      {
        review: serializeReview(review),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REVIEWS POST ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create review." },
      { status: 500 }
    );
  }
}
