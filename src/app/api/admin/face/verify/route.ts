import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({ error: "Image data required" }, { status: 400 });
    }

    // Simple verification - in production, you'd compare face embeddings
    // For demo, we'll just check if there's any enrolled face
    const enrolledFaces = await (prisma as any).faceData.findMany({
      select: {
        userId: true,
        faceHash: true,
      },
    });

    // In a real implementation, you'd:
    // 1. Decode the face embedding from imageData
    // 2. Compare against stored embeddings
    // 3. Return match if similarity > threshold

    // For now, return no match (demo mode)
    return NextResponse.json({
      matched: false,
      message: "Face verification not yet configured. Please enroll your face first.",
    });
  } catch (error) {
    console.error("Face verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify face" },
      { status: 500 }
    );
  }
}