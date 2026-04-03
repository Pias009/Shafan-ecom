import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) + "-" + Date.now();
}

// GET /api/admin/blog — list all
export async function GET() {
  const posts = await (prisma as any).blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

// POST /api/admin/blog — create
export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, excerpt, content, coverImage, tags, published } = body;
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  const post = await (prisma as any).blogPost.create({
    data: {
      title,
      slug: slug(title),
      excerpt: excerpt || "",
      content,
      coverImage: coverImage || null,
      tags: tags || [],
      published: !!published,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
