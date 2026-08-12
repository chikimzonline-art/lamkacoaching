import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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
