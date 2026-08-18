import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { UserRole } from "./auth";
import { env } from "@/env";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username / Email / Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const identifier = credentials.username;
        const password = credentials.password;

        // 1. Check if it's an Admin/Staff
        const user = await db.user.findFirst({
          where: {
            OR: [
              { username: identifier },
            ],
            active: true
          }
        });

        if (user) {
          const isValid = await bcrypt.compare(password, user.password);
          if (isValid) {
            return {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role as UserRole,
              image: user.avatar || null
            };
          }
        }

        // 2. Check if it's a Student
        const student = await db.student.findFirst({
          where: {
            OR: [
              { username: identifier },
              { phone: identifier },
              { email: identifier }
            ]
          }
        });

        if (student) {
          if (student.password) {
             const isValid = await bcrypt.compare(password, student.password);
             if (isValid) {
               return {
                 id: student.id,
                 name: student.name,
                 username: student.username,
                 email: student.email,
                 role: "student" as UserRole,
                 image: student.avatar || null
               };
             }
          }
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.username = (user as any).username;
        token.picture = (user as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.NEXTAUTH_SECRET,
};
