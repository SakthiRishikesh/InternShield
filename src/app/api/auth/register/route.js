import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthCookieOptions, signToken } from "@/lib/jwt";
import { isValidEmail, normalizeEmail, serializeUser } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  try {
    const body = await req.json();
    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email);
    const password = body.password?.trim() ?? "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const user = await User.create({ name, email, password });
    const publicUser = serializeUser(user);
    const token = await signToken(publicUser);

    const res = NextResponse.json(
      { message: "Account created successfully.", user: publicUser },
      { status: 201 }
    );

    res.cookies.set("token", token, getAuthCookieOptions(req));

    return res;
  } catch (err) {
    console.error("[REGISTER ERROR]", err);

    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    if (err?.name === "ValidationError") {
      const message =
        Object.values(err.errors)[0]?.message || "Invalid registration details.";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
