import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const adminCookie = req.headers.get("cookie")?.match(/admin-session=([^;]+)/);

    if (!adminCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = Buffer.from(adminCookie[1], 'base64').toString();
    const [userId] = token.split(':');

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Not an admin" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin session check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}