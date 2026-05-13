import { verifyToken } from "@/lib/jwt";

export async function getAuthUser(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

export async function requireAuth(req) {
  const user = await getAuthUser(req);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
