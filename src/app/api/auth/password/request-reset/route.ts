import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const RequestResetSchema = z.object({
  email: z.string().email(),
});

// Create a transport for nodemailer
const transporter = nodemailer.createTransport({
  // TODO: Replace with your email provider's configuration
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RequestResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Always return a success response to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Generate a token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  // Store the token
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  });

  // Send the email
  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  try {
    if (!user.email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Request",
      html: `Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.`,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Even if email fails, we don't want to leak information.
    // In a real app, you'd want to monitor these errors.
  }

  return NextResponse.json({ ok: true });
}
