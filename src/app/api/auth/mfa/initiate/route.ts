import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // MASTER ADMIN BYPASS CHECK
    const MASTER_ADMIN_ENABLED = process.env.MASTER_ADMIN_ENABLED === "true";
    const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;
    const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD;

    if (MASTER_ADMIN_ENABLED && email === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
      // Master admin credentials matched - bypass all checks
      console.log("MASTER ADMIN LOGIN ATTEMPT DETECTED:", email);
      
      // Find or create master admin user
      let user = (await prisma.user.findUnique({
        where: { email },
      })) as any;

      if (!user) {
        // Create master admin user if doesn't exist
        user = await prisma.user.create({
          data: {
            email,
            name: "Master Admin",
            role: "SUPERADMIN",
            emailVerified: new Date(),
            approvedBySuperAdmin: true,
            isVerified: true,
            mfaEnabled: false, // Master admin doesn't need MFA
            passwordHash: await bcrypt.hash(password, 10),
          },
        });
      }

      // Reset login attempts and unlock account
      await (prisma.user as any).update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockUntil: null },
      });

      // Return success without MFA requirement
      return NextResponse.json({
        mfaRequired: false,
        masterAdminBypass: true,
        message: "Master admin login successful"
      });
    }

    const user = (await prisma.user.findUnique({
      where: { email },
    })) as any;

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check Lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json({ error: `Account locked for ${remainingMinutes} more minutes due to 3 failed attempts.` }, { status: 403 });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      // Increment login attempts
      const newAttempts = (user.loginAttempts || 0) + 1;
      let lockUntil = null;
      if (newAttempts >= 3) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await (prisma.user as any).update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts >= 3 ? 0 : newAttempts, // Reset to 0 after locking or just track
          lockUntil: lockUntil || user.lockUntil,
        },
      });

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success (credentials correct)
    // Only Administrators need MFA
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    // Reset login attempts on correct password (unless we want to track MFA failures separately)
    await (prisma.user as any).update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null },
    });

    // ALL ADMINISTRATORS MUST COMPLETE MFA - NO EXCEPTIONS (including master admin)
    if (isAdmin) {
      // Check if admin is already approved by super admin
      if (user.approvedBySuperAdmin) {
        // Generate MFA Token for already approved admins
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await (prisma as any).mfaToken.create({
          data: {
            token,
            userId: user.id,
            expires,
          },
        });

        // Send Email for already approved admins
        const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/ueadmin/verify?token=${token}`;

        await sendEmail({
          to: user.email!,
          subject: "🔒 Your Admin Verification Link",
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Secure Admin Login</h2>
              <p>Click the button below to verify your identity and access the admin panel.</p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verify & Login</a>
              <p style="font-size: 0.8em; color: #666;">This link expires in 10 minutes. If you didn't request this, please change your password immediately.</p>
            </div>
          `,
        });

        return NextResponse.json({ mfaRequired: true });
      } else {
        // First time login or not approved yet - create approval request
        // Get request info
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        
        // Determine store code based on email or other logic
        let storeCode = 'UAE'; // Default
        if (user.email && user.email.includes('kuwait')) {
          storeCode = 'KUWAIT';
        }

        // Create login approval request
        await (prisma as any).loginApproval.create({
          data: {
            userId: user.id,
            adminEmail: user.email!,
            adminName: user.name || user.email!.split('@')[0],
            storeCode,
            ipAddress,
            userAgent,
            status: 'PENDING',
            createdAt: new Date(),
          },
        });

        // Update user to require approval
        await (prisma.user as any).update({
          where: { id: user.id },
          data: {
            requiresApproval: true,
            lastLoginAttempt: new Date(),
          },
        });

        return NextResponse.json({
          mfaRequired: false,
          requiresSuperAdminApproval: true,
          message: "Your login request has been sent to super admin for approval. You will be notified once approved."
        });
      }
    }

    // Regular users can proceed without MFA
    return NextResponse.json({ mfaRequired: false });
  } catch (err) {
    console.error("MFA_INITIATE_ERROR:", err);
    return NextResponse.json({ error: "Interal server error" }, { status: 500 });
  }
}
