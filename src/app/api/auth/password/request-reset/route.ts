import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

const RequestResetSchema = z.object({
  email: z.string().email(),
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

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.`,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return NextResponse.json({ ok: true });
}
