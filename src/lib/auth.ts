import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export type UserRole = "admin" | "staff" | "student";

export interface AuthUser {
  id: string;
  username?: string;
  name?: string;
  role: UserRole;
}

export async function verifyToken(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    return {
      id: (session.user as any).id,
      role: (session.user as any).role as UserRole,
      username: (session.user as any).username,
      name: session.user.name || undefined,
    };
  } catch (error) {
    console.error("Auth verification failed", error);
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  return verifyToken();
}

export type AuthResult =
  | { user: AuthUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthUser();
  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireRoles(allowedRoles: UserRole[]): Promise<AuthResult> {
  const user = await getAuthUser();
  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!allowedRoles.includes(user.role)) {
    return { errorResponse: NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 }) };
  }
  return { user };
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireRoles(["admin"]);
}

export async function requireStaffOrAdmin(): Promise<AuthResult> {
  return requireRoles(["admin", "staff"]);
}
