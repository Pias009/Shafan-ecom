import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating } = body;

    if (!rating || !["Happy", "Okay", "Sad"].includes(rating)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    await prisma.sesiVote.create({
      data: { rating },
    });

    const [happyCount, totalCount] = await Promise.all([
      prisma.sesiVote.count({ where: { rating: "Happy" } }),
      prisma.sesiVote.count(),
    ]);

    return NextResponse.json({ success: true, happyCount, totalCount });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [happyCount, okayCount, sadCount, totalCount] = await Promise.all([
      prisma.sesiVote.count({ where: { rating: "Happy" } }),
      prisma.sesiVote.count({ where: { rating: "Okay" } }),
      prisma.sesiVote.count({ where: { rating: "Sad" } }),
      prisma.sesiVote.count(),
    ]);

    return NextResponse.json({ happyCount, okayCount, sadCount, totalCount });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
