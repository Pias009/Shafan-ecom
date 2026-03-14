import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerAuthSession } from '@/lib/auth';
import { uploadFromUrl } from '@/lib/cloudinary';

const ProductCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number(),
  discountCents: z.number().optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  hot: z.boolean().optional()
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const products = await (prisma as any).product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      discountCents: true,
      hot: true,
      active: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      createdAt: true,
    },
  });
  return new Response(JSON.stringify(products), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = ProductCreateSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    const data = parsed.data;
    // Normalize features if provided as a comma-separated string
    if (typeof data.features === 'string') {
      data.features = (data.features as string).split(',').map((s: string) => s.trim()).filter((x: string) => x);
    }
    // Cloudinary: handle mainImage upload and images processing
    let mainImageUrl: string | undefined = undefined;
    if (data.mainImage) {
      mainImageUrl = await uploadFromUrl(data.mainImage).catch(() => data.mainImage);
    }
    // Normalize images input
    if (Array.isArray(data.images)) {
      if ((data.images as string[]).length > 0) {
        const uploaded = await Promise.all((data.images as string[]).map((u) => uploadFromUrl(u).catch(() => u)));
        data.images = uploaded as string[];
      } else {
        data.images = [] as string[];
      }
    } else if (data.images) {
      const arr = (data.images as string).split(',').map((s) => s.trim()).filter(Boolean);
      const uploaded = await Promise.all(arr.map((u) => uploadFromUrl(u).catch(() => u)));
      data.images = uploaded as string[];
    }
    if (mainImageUrl) {
      const exists = Array.isArray(data.images) && data.images.includes(mainImageUrl);
      if (!exists) data.images = [mainImageUrl, ...(Array.isArray(data.images) ? data.images : [])];
      data.mainImage = mainImageUrl;
    }

    // Upload provided image URLs to Cloudinary (if configured)
    if (Array.isArray(data.images)) {
      if (data.images.length > 0) {
        const uploaded = await Promise.all(data.images.map((u: string) => uploadFromUrl(u).catch(() => u)));
        data.images = uploaded as string[];
      } else {
        data.images = [] as string[];
      }
    } else if (data.images) {
      const arr = (data.images as string).split(',').map((s: string) => s.trim()).filter(Boolean);
      const uploaded = await Promise.all(arr.map((u: string) => uploadFromUrl(u).catch(() => u)));
      data.images = uploaded as string[];
    }

    // Resolve brand/category by name if provided
    let brandId: string | undefined;
    let categoryId: string | undefined;
    if (data.brandName) {
      const b = await (prisma as any).brand.findFirst({ where: { name: data.brandName } });
      brandId = b?.id;
    }
    if (data.categoryName) {
      const c = await (prisma as any).category.findFirst({ where: { name: data.categoryName } });
      categoryId = c?.id;
    }

    const product = await (prisma as any).product.upsert({
      where: { name: data.name },
      update: {
        description: data.description,
        features: data.features ?? [],
        images: (data.images as string[]) ?? [],
        priceCents: data.priceCents,
        discountCents: data.discountCents,
        hot: data.hot ?? false,
        brandId,
        categoryId,
        mainImage: data.mainImage,
      },
      create: {
        name: data.name,
        description: data.description,
        features: data.features ?? [],
        images: (data.images as string[]) ?? [],
        priceCents: data.priceCents,
        discountCents: data.discountCents,
        hot: data.hot ?? false,
        brandId,
        categoryId,
        mainImage: data.mainImage,
      },
    });
    return new Response(JSON.stringify(product), { status: 303, headers: { 'Location': '/ueadmin/products', 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
