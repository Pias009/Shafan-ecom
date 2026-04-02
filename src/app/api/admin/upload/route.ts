import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
    secure: true,
  });
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "ecommerce";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, WebP or GIF." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    if (isCloudinaryConfigured()) {
      const result = await cloudinary.uploader.upload(base64, {
        folder: folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto", fetch_format: "auto" }
        ],
      });
      return NextResponse.json({ url: result.secure_url }, { status: 201 });
    } else {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
