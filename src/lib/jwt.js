import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in .env.local");
}

const SECRET = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const BASE_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
};

function isHttpsRequest(req) {
  if (process.env.AUTH_COOKIE_SECURE) {
    return process.env.AUTH_COOKIE_SECURE === "true";
  }

  const forwardedProto = req?.headers?.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  if (req?.nextUrl?.protocol) {
    return req.nextUrl.protocol === "https:";
  }

  if (req?.url) {
    try {
      return new URL(req.url).protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}

export function getAuthCookieOptions(req) {
  return {
    ...BASE_AUTH_COOKIE_OPTIONS,
    secure: isHttpsRequest(req),
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function getClearAuthCookieOptions(req) {
  return {
    ...BASE_AUTH_COOKIE_OPTIONS,
    secure: isHttpsRequest(req),
    expires: new Date(0),
  };
}

export const AUTH_COOKIE_OPTIONS = {
  ...BASE_AUTH_COOKIE_OPTIONS,
  secure: process.env.AUTH_COOKIE_SECURE === "true",
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export const CLEAR_AUTH_COOKIE_OPTIONS = {
  ...BASE_AUTH_COOKIE_OPTIONS,
  secure: process.env.AUTH_COOKIE_SECURE === "true",
  expires: new Date(0),
};

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}
