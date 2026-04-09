import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    console.log("Contact form submission:", { name, email, message });

    return NextResponse.json({ 
      success: true, 
      message: "Thank you! We'll respond within 24-48 hours." 
    });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst({
      where: { type: "contact" }
    });

    const defaultContact = {
      phone: "+971 04 838 7827",
      whatsapp: "+971 54 720 6046",
      email: "support@shanfaglobal.com",
      address: "Al Diyafa Shopping Center, Satwa Round About, Dubai, United Arab Emirates"
    };

    const contactInfo = settings?.data as typeof defaultContact || defaultContact;

    return NextResponse.json(contactInfo);
  } catch (error) {
    console.error("Get contact info error:", error);
    return NextResponse.json({ error: "Failed to fetch contact info" }, { status: 500 });
  }
}