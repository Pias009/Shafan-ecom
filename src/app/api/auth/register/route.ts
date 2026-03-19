import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  country: z.string().optional(),
});


export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      country: parsed.data.country,
      role: "USER",
    },
  });

  // Send Welcome Email (Non-blocking)
  sendEmail({
    to: parsed.data.email,
    subject: "Welcome to Shafan Store!",
    html: `
      <h1>Hello ${parsed.data.name || 'Value Customer'}!</h1>
      <p>Thank you for creating an account with Shafan Store. We are excited to have you with us!</p>
      <p>You can now log in and start shopping for premium skin and hair care products.</p>
      <br />
      <p>Best Regards,</p>
      <p>The Shafan Team</p>
    `
  }).catch(err => console.error("Welcome email failed", err));

  return NextResponse.json({ ok: true });
}

