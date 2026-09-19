import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendAdminLoginAlertEmail } from "@/lib/email/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password. Please verify and try again." }, { status: 401 });
    }

    // Must be admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Access denied. This account does not have Admin privileges." }, { status: 403 });
    }

    // Generate token for admin session
    const token = Buffer.from(`${user.id}:${Date.now()}:admin`).toString('base64');

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

    const adminData = { 
      id: user.id, 
      email: user.email, 
      name: user.name || "Admin", 
      role: user.role 
    };

    const response = NextResponse.json({ 
      success: true, 
      token,
      admin: adminData,
      user: adminData
    });

    // Set admin session cookie
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}