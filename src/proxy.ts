import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isStudentRoute = req.nextUrl.pathname.startsWith("/dashboard");

    // Redirect authenticated users away from login pages
    if (token && isAuthRoute) {
      if (token.role === "admin" || token.role === "staff") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (token.role === "student") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Protect student dashboard routes
    if (isStudentRoute) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role === "admin" || token.role === "staff") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    // Protect admin routes
    if (isAdminRoute) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role === "student") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // We handle authorization logic in the middleware function above,
        // so we always return true here to let the middleware run.
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
