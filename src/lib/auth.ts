import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    Credentials({
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        console.log("AUTH_DEBUG_EMAIL:", parsed.data.email);
        const user = await prisma.user.findFirst({
          where: { email: parsed.data.email },
        });

        if (!user) {
          console.log("AUTH_DEBUG: User not found");
          return null;
        }

        if (!user.passwordHash) {
          console.log("AUTH_DEBUG: No password hash for user");
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          console.log("AUTH_DEBUG: Password comparison FAIL");
          return null;
        }

        console.log("AUTH_DEBUG: SUCCESS for user:", user.email, "Role:", user.role);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN" | "SUPERADMIN") ?? session.user.role;
      }
      return session;
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
