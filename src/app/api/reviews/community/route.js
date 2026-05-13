import { NextResponse } from "next/server";
import {
  fetchCompanyInsights,
  fetchCommunitySignals,
  searchGlassdoorCompany,
  searchRedditPosts,
} from "@/lib/rapidapi";

export const runtime = "nodejs";

/**
 * GET /api/reviews/community?q=CompanyName
 *
 * Fetches community signals from Reddit and Glassdoor for a given company query.
 * Use mode=insights for a culture/review/reputation summary.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const source = searchParams.get("source") || "all";
    const mode = searchParams.get("mode") || "signals";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 }
      );
    }

    if (mode === "insights") {
      const result = await fetchCompanyInsights(query.trim());
      return NextResponse.json(result);
    }

    // Optionally target a single source
    if (source === "reddit") {
      const result = await searchRedditPosts(`${query.trim()} internship`, { limit: 5 });
      return NextResponse.json(result);
    }

    if (source === "glassdoor") {
      const result = await searchGlassdoorCompany(query.trim());
      return NextResponse.json(result);
    }

    // Default: fetch from all sources
    const result = await fetchCommunitySignals(query.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("[COMMUNITY SIGNALS ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch community signals." },
      { status: 500 }
    );
  }
}
