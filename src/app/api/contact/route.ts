import { NextResponse } from "next/server";

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
