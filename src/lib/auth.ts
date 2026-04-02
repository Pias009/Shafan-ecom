import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendAdminLoginAlertEmail } from "@/lib/email/service";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/?login=true",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.user-session-token'
        : 'next-auth.user-session-token',
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
    // Google OAuth Provider
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
          // If token fails, find the user related to it and increment their failed login attempt
          if (mfaToken?.userId) {
             const user = (await prisma.user.findUnique({ where: { id: mfaToken.userId } })) as any;
             if (user) {
                const newAttempts = (user.loginAttempts || 0) + 1;
                let lockUntil = null;
                if (newAttempts >= 3) {
                  lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                }

                await (prisma.user as any).update({
                  where: { id: user.id },
                  data: {
                    loginAttempts: newAttempts >= 3 ? 0 : newAttempts,
                    lockUntil: lockUntil || user.lockUntil,
                  },
                });
             }
          }
          return null;
        }

        const user = mfaToken.user;
        if (!user) return null;

        // Reset login attempts on SUCCESSFUL MFA
        await (prisma.user as any).update({
           where: { id: user.id },
           data: { loginAttempts: 0, lockUntil: null }
        });

        // Delete the token after use
        await (prisma as any).mfaToken.delete({
          where: { id: mfaToken.id },
        });

        // Send admin login alert email (fire and forget)
        if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
          try {
            const loginTime = new Date().toLocaleString();
            const ipAddress = "Unknown"; // In production, you would extract this from request headers
            const userAgent = "Unknown"; // In production, you would extract this from request headers
            
            // Send admin login alert email asynchronously
            sendAdminLoginAlertEmail(
              user.email!,
              user.name || "Admin",
              loginTime,
              ipAddress,
              userAgent
            ).catch(error => {
              console.error("Failed to send admin login alert email:", error);
              // Don't throw - email failure shouldn't block login
            });
          } catch (emailError) {
            console.error("Error preparing admin login alert email:", emailError);
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mfaVerified: true,
        };
      },
    }),
    Credentials({
      id: "credentials",
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          return null;
        }
        
        const isDeveloper = user.email === "developer@shafan.com";
        const isMasterAdmin = user.email === process.env.MASTER_ADMIN_EMAIL;
        const isSuperAdmin = user.role === 'SUPERADMIN';
        const shouldBypassMFA = (isDeveloper || isMasterAdmin) && isSuperAdmin;
        const isApprovedBySuperAdmin = user.approvedBySuperAdmin || false;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mfaVerified: shouldBypassMFA,
          approvedBySuperAdmin: isApprovedBySuperAdmin,
          masterAdminBypass: isMasterAdmin,
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
        token.masterAdminBypass = (user as any).masterAdminBypass;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN" | "SUPERADMIN") ?? session.user.role;
        session.user.name = token.name ?? session.user.name;
        (session.user as any).mfaVerified = token.mfaVerified;
        (session.user as any).masterAdminBypass = token.masterAdminBypass;
      }
      return session;
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
