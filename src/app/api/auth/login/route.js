import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthCookieOptions, signToken } from "@/lib/jwt";
import { isValidEmail, normalizeEmail, serializeUser } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = body.password?.trim() ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const publicUser = serializeUser(user);
    const token = await signToken(publicUser);

    const res = NextResponse.json(
      { message: "Login successful.", user: publicUser },
      { status: 200 }
    );

    res.cookies.set("token", token, getAuthCookieOptions(req));

    return res;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
