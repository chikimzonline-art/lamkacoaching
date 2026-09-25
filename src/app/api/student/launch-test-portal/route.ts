import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

export async function GET(req: NextRequest) {
  // 1. Verify student session
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "student") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", "/api/student/launch-test-portal");
    return NextResponse.redirect(loginUrl);
  }

  const studentId = (session.user as any).id;

  // 2. Fetch student details with active cabin bookings & course enrollments
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      bookings: {
        where: { status: "active" },
        orderBy: { endDate: "desc" },
      },
      enrollments: {
        where: { status: "active" },
      },
    },
  });

  if (!student) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // 3. Determine active access entitlement
  const activeBookings = student.bookings || [];
  const activeEnrollments = student.enrollments || [];
  const hasActiveCabin = activeBookings.length > 0;
  const hasActiveCourse = activeEnrollments.length > 0;
  const hasActiveAccess = hasActiveCabin || hasActiveCourse;

  // 4. Calculate latest end date among active bookings & enrollments
  let maxExpiry: Date | null = null;
  for (const b of activeBookings) {
    if (b.endDate) {
      const d = new Date(b.endDate);
      if (!maxExpiry || d.getTime() > maxExpiry.getTime()) {
        maxExpiry = d;
      }
    }
  }
  for (const e of activeEnrollments) {
    if (e.endDate) {
      const d = new Date(e.endDate);
      if (!maxExpiry || d.getTime() > maxExpiry.getTime()) {
        maxExpiry = d;
      }
    }
  }

  // If student has an active course/cabin without explicit end date, default to 90 days validity
  if (hasActiveAccess && !maxExpiry) {
    maxExpiry = new Date();
    maxExpiry.setDate(maxExpiry.getDate() + 90);
  }

  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret) {
    console.error("[SSO Error] SSO_SHARED_SECRET is not configured.");
    return NextResponse.json(
      { error: "SSO_SHARED_SECRET is missing in environment variables." },
      { status: 500 }
    );
  }

  // Fallback email ensures unique identifier even if student was ported by phone only
  const email = student.email?.trim() || `${student.phone}@lamkacoaching.in`;

  // 5. Construct token payload
  const ssoPayload = {
    sub: student.id,
    name: student.name,
    email,
    phone: student.phone,
    avatarUrl: student.avatar || null,
    hasActiveAccess,
    passTier: hasActiveAccess ? "LAMKA_PASS_PRO" : "FREE",
    passExpiry: maxExpiry ? maxExpiry.toISOString() : null,
    targetUrl: "/",
  };

  // 6. Sign JWT with HMAC-SHA256 (expires in 2 minutes)
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT(ssoPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 120)
    .sign(key);

  // 7. Redirect to Test Portal SSO receiver
  const testPortalUrl =
    process.env.NEXT_PUBLIC_TEST_PORTAL_URL || "https://test.lamkacoaching.in";

  const redirectUrl = new URL("/api/auth/sso", testPortalUrl);
  redirectUrl.searchParams.set("token", token);

  return NextResponse.redirect(redirectUrl);
}
