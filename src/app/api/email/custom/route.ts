import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { emailService } from "@/lib/email/service";
import { z } from "zod";

const CustomEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const user = session?.user as any;
    
    // Only allow admins in production
    if (process.env.NODE_ENV === 'production' && (!session || !["ADMIN", "SUPERADMIN"].includes(user?.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CustomEmailSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.message },
        { status: 400 }
      );
    }

    const { to, subject, message } = parsed.data;

    const result = await emailService.sendEmail({
      to: { email: to },
      subject,
      template: 'magic-link', // Use as base, content is custom
      data: {
        customMessage: message || '',
        email: to,
        name: to.split('@')[0],
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Custom email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}