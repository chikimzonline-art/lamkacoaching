import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

// Initialize Redis and Limiters
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, "1 m"),
  ephemeralCache: new Map(),
});

const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  ephemeralCache: new Map(),
});

// Original NextAuth Middleware
const authProxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isStudentRoute = req.nextUrl.pathname.startsWith("/dashboard");

    if (token && isAuthRoute) {
      if (token.role === "admin" || token.role === "staff") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (token.role === "student") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (isStudentRoute) {
      if (!token) return NextResponse.redirect(new URL("/login", req.url));
      if (token.role === "admin" || token.role === "staff") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    if (isAdminRoute) {
      if (!token) return NextResponse.redirect(new URL("/login", req.url));
      if (token.role === "student") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

// Main Proxy Wrapper: Runs Rate Limiter FIRST, then auth
export default async function proxy(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const pathname = request.nextUrl.pathname;

  // Rate Limiting Logic for API routes
  if (
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/auth/callback/credentials")
  ) {
    const { success } = await strictLimiter.limit(`strict_${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before making another payment or login attempt." },
        { status: 429 }
      );
    }
  } else if (pathname.startsWith("/api/")) {
    const { success } = await generalLimiter.limit(`general_${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }
  }

  // If rate limit passes, hand over to NextAuth
  // NextAuth expects NextRequestWithAuth, but passing request and event handles it correctly
  return authProxy(request as any, {} as any);
}

export const config = {
  matcher: [
    // Removed 'api' from the ignore list so the proxy intercepts API routes for rate limiting
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
