import { NextResponse } from "next/server";
import { getClearAuthCookieOptions } from "@/lib/jwt";
import { verifyToken } from "@/lib/jwt";

export async function GET(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await verifyToken(token);

  if (!user) {
    const res = NextResponse.json({ error: "Session expired." }, { status: 401 });
    res.cookies.set("token", "", getClearAuthCookieOptions(req));
    return res;
  }

  return NextResponse.json({ user });
}
