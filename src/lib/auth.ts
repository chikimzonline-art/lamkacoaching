import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error('JWT_SECRET environment variable is not set. Please add it to your .env file.');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export function getTokenFromCookie(cookies: { get: (name: string) => { value: string } | undefined }): string | null {
  const token = cookies.get('auth-token');
  return token?.value || null;
}

/**
 * Shared helper — verifies the auth-token cookie and returns the authenticated user.
 * Returns null if token is missing or invalid.
 */
export async function getAuthUser(cookiesStore: { get: (name: string) => { value: string } | undefined }): Promise<AuthUser | null> {
  const token = cookiesStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
