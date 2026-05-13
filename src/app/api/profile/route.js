import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";
import User from "@/models/User";

export async function GET(req) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const user = await User.findById(authUser.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role || "Student",
        university: user.university || "",
        gradYear: user.gradYear || "",
        preferences: user.preferences || { location: "Remote", domain: "", salary: "" },
      },
    });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PROFILE GET ERROR]", err);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    await connectDB();

    const allowed = ["name", "phone", "role", "university", "gradYear", "preferences"];
    const updates = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const user = await User.findByIdAndUpdate(authUser.id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role || "Student",
        university: user.university || "",
        gradYear: user.gradYear || "",
        preferences: user.preferences || { location: "Remote", domain: "", salary: "" },
      },
    });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PROFILE PATCH ERROR]", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
