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

    // MASTER ADMIN BYPASS: Skip MFA for master admin email
    const MASTER_ADMIN_EMAIL = "pvs178380@gmail.com";
    
    // Check if this is the master admin (password already verified by bcrypt.compare above)
    if (email === MASTER_ADMIN_EMAIL) {
      // Master admin bypass - no MFA required
      console.log("MASTER ADMIN BYPASS: Skipping MFA for master admin");
      return NextResponse.json({ mfaRequired: false, masterAdminBypass: true });
    }

    // ALL OTHER ADMINISTRATORS MUST COMPLETE MFA - NO EXCEPTIONS
    if (isAdmin) {
      // Generate MFA Token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await (prisma as any).mfaToken.create({
        data: {
          token,
          userId: user.id,
          expires,
        },
      });

      // Send Email
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
    }

    // Regular users can proceed without MFA
    return NextResponse.json({ mfaRequired: false });
  } catch (err) {
    console.error("MFA_INITIATE_ERROR:", err);
    return NextResponse.json({ error: "Interal server error" }, { status: 500 });
  }
}
