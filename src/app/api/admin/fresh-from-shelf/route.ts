import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { freshFromShelf: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FreshFromShelf error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { freshFromShelf: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FreshFromShelf error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}