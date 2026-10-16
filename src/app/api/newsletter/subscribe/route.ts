import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { buildWelcomeEmail, getWelcomeOffer } from "@/lib/welcome-offer";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/newsletter/subscribe - Footer "Claim 10%" sign-up.
// Emails the admin-selected welcome coupon once per address; repeat sign-ups
// succeed silently so the endpoint can't be used to spam an inbox.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  try {
    const session = await getServerAuthSession().catch(() => null);
    const userId = (session?.user as any)?.id || null;

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: userId ? { userId } : {},
      create: { email, userId },
    });

    if (subscriber.emailSentAt) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    const offer = await getWelcomeOffer();
    if (!offer) {
      console.warn("Welcome offer coupon is missing or inactive; subscriber saved without a code:", email);
      return NextResponse.json({ success: true, emailSent: false });
    }

    const sent = await sendEmail({ to: email, ...buildWelcomeEmail(offer) });
    if (sent) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { welcomeCode: offer.code, emailSentAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, emailSent: sent });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
