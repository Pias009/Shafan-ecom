import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendAdminLoginAlertEmail } from "@/lib/email/service";

// User site auth config - cookie only for user paths
export const userAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/?login=true",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session'
        : 'next-auth.user-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      id: "mfa",
      name: "MFA Token",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const mfaToken = await (prisma as any).mfaToken.findUnique({
          where: { token: credentials.token },
          include: { user: true },
        });

        if (!mfaToken || mfaToken.expires < new Date()) {
          return null;
        }

        const user = mfaToken.user;
        if (!user) return null;

        await (prisma.user as any).update({
           where: { id: user.id },
           data: { loginAttempts: 0, lockUntil: null }
        });

        await (prisma as any).mfaToken.delete({
          where: { id: mfaToken.id },
        });

        // Only allow user sessions for non-admin users
        if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isAdminSession: false,
        };
      },
    }),
    // User login - only for regular users
    Credentials({
      id: "user-login",
      name: "User Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        
        // Block admin users from user login
        if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isAdminSession: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as { role?: string }).role;
        token.isAdminSession = false;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN" | "SUPERADMIN") ?? session.user.role;
        session.user.name = token.name ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        (session.user as any).isAdminSession = false;
      }
      return session;
    },
  },
};

// Admin auth config - separate cookie
export const adminAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/ueadmin/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.admin-session'
        : 'next-auth.admin-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
  },
  providers: [
    Credentials({
      id: "mfa",
      name: "MFA Token",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const mfaToken = await (prisma as any).mfaToken.findUnique({
          where: { token: credentials.token },
          include: { user: true },
        });

        if (!mfaToken || mfaToken.expires < new Date()) {
          return null;
        }

        const user = mfaToken.user;
        if (!user) return null;

        await (prisma.user as any).update({
           where: { id: user.id },
           data: { loginAttempts: 0, lockUntil: null }
        });

        await (prisma as any).mfaToken.delete({
          where: { id: mfaToken.id },
        });

        // Must be admin
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mfaVerified: true,
          isAdminSession: true,
        };
      },
    }),
    // Admin login - only for admin users
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        
        // Must be admin
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          return null;
        }

        const isDeveloper = user.email === "developer@shafan.com";
        const isMasterAdmin = user.email === process.env.MASTER_ADMIN_EMAIL;
        const isSuperAdmin = user.role === 'SUPERADMIN';
        const shouldBypassMFA = (isDeveloper || isMasterAdmin) && isSuperAdmin;
        
        // Send admin login alert
        try {
          sendAdminLoginAlertEmail(
            user.email!,
            user.name || "Admin",
            new Date().toLocaleString(),
            "Unknown",
            "Unknown"
          ).catch(console.error);
        } catch {}

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mfaVerified: shouldBypassMFA,
          isAdminSession: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as { role?: string }).role;
        token.mfaVerified = (user as any).mfaVerified;
        token.isAdminSession = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN" | "SUPERADMIN") ?? session.user.role;
        session.user.name = token.name ?? session.user.name;
        (session.user as any).mfaVerified = token.mfaVerified;
        (session.user as any).isAdminSession = true;
      }
      return session;
    },
  },
};

// Default export for user site
export const authOptions = userAuthOptions;

export async function getServerAuthSession() {
  return getServerSession(userAuthOptions);
}

export async function getAdminAuthSession() {
  return getServerSession(adminAuthOptions);
}
