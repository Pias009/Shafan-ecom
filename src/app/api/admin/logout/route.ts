import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear admin session cookie
    response.cookies.set("admin-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}