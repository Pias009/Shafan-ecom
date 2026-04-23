import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, price } = body;

    console.log("POST flash-sale:", productId, price);

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const numPrice = Number(price) || 0;

    // Just set discountPrice to same as price to mark as flash sale
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { discountPrice: numPrice, hot: true }
    });

    console.log("Updated product:", updated);

    return NextResponse.json({ 
      success: true, 
      product: { id: updated.id, discountPrice: updated.discountPrice }
    });
  } catch (error) {
    console.error("Flash Sales error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    console.log("DELETE flash-sale:", productId);

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Remove flash sale by setting discountPrice to null
    await prisma.product.update({
      where: { id: productId },
      data: { discountPrice: null, hot: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flash Sales error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}