import { NextResponse } from "next/server";
import { AdminSessionUnavailableError, getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAdminSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof AdminSessionUnavailableError) {
      return NextResponse.json({ error: "Temporarily unavailable, please retry" }, { status: 503, headers: { "Retry-After": "5" } });
    }
    console.error("Admin session check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
