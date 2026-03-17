import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await (prisma as any).blogPost.findUnique({
    where: { slug },
  });
  if (!post || !post.published) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(post);
}
