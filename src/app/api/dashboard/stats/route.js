import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { getDashboardStats } from "@/lib/dashboardStats";

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    return NextResponse.json(await getDashboardStats(user.id));
  } catch (err) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DASHBOARD STATS ERROR]", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
