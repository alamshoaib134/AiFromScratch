import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set.");
  }
  // Derive a 256-bit key from the password
  return new TextEncoder().encode(password.padEnd(32, "0").slice(0, 32));
}

/**
 * Create an encrypted session token.
 */
export async function encryptSession(): Promise<string> {
  const secret = getSecret();

  return new SignJWT({ role: "admin", iat: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Decrypt and validate a session token.
 * Returns true if valid, false otherwise.
 */
export async function decryptSession(
  token: string
): Promise<boolean> {
  try {
    const secret = getSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a password against the ADMIN_PASSWORD env var.
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

/**
 * Set the auth cookie on a Response.
 */
export async function setAuthCookie(): Promise<void> {
  const token = await encryptSession();
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear the auth cookie.
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Check if the current request has a valid auth cookie.
 * (For use in middleware)
 */
export async function verifyAuthFromRequest(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return decryptSession(token);
}

/**
 * Check if the current user is authenticated.
 * (For use in Server Components / Server Actions)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return decryptSession(token);
}
