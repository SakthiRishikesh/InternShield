import { NextResponse } from "next/server";
import { getClearAuthCookieOptions } from "@/lib/jwt";

export async function POST(req) {
  const res = NextResponse.json({ message: "Logged out." }, { status: 200 });

  res.cookies.set("token", "", getClearAuthCookieOptions(req));

  return res;
}
