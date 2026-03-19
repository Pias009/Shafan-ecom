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
  stockQuantity: z.number().optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  hot: z.boolean().optional()
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const products = await prisma.product.findMany({
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
    if (!parsed.success) {
      console.error("Validation Error:", parsed.error);
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error }), { status: 400 });
    }
    const data = parsed.data;

    // Cloudinary: handle mainImage upload and images processing
    let mainImageUrl: string | null = null;
    if (data.mainImage) {
      mainImageUrl = await uploadFromUrl(data.mainImage).catch(() => data.mainImage || null);
    }

    // Combine mainImage and gallery images
    let finalImages: string[] = [];
    if (mainImageUrl) {
      finalImages.push(mainImageUrl);
    }
    
    if (Array.isArray(data.images)) {
      const uploadedGallery = await Promise.all(
        data.images
          .filter(img => img !== mainImageUrl)
          .map(img => uploadFromUrl(img).catch(() => img))
      );
      finalImages = [...finalImages, ...uploadedGallery];
    }
    data.images = finalImages;

    // Resolve brand/category by name if provided
    let brandId: string | null = null;
    let categoryId: string | null = null;
    if (data.brandName && data.brandName !== 'All') {
      const b = await prisma.brand.findFirst({ where: { name: data.brandName } });
      brandId = b?.id || null;
    }
    if (data.categoryName && data.categoryName !== 'All') {
      const c = await prisma.category.findFirst({ where: { name: data.categoryName } });
      categoryId = c?.id || null;
    }

    // Check for existing product by name to avoid non-unique upsert error
    const existingProduct = await prisma.product.findFirst({ where: { name: data.name } });
    
    const productData = {
      description: data.description || '',
      features: data.features ?? [],
      images: (data.images as string[]) ?? [],
      priceCents: data.priceCents,
      discountCents: data.discountCents || 0,
      stockQuantity: data.stockQuantity ?? 0,
      hot: data.hot ?? false,
      trending: data.trending ?? false,
      brandId,
      categoryId,
      mainImage: mainImageUrl,
    };

    let product;
    if (existingProduct) {
      product = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      product = await prisma.product.create({
        data: {
          name: data.name,
          ...productData,
        },
      });
    }

    // Handle initial store inventory if storeId provided
    if (body.storeId) {
      const store = await prisma.store.findFirst({
        where: { code: body.storeId }
      });
      
      if (store) {
        await prisma.storeInventory.upsert({
          where: {
            storeId_productId: {
              storeId: store.id,
              productId: product.id
            }
          },
          update: {
            quantity: data.stockQuantity || 0,
            price: data.priceCents / 100
          },
          create: {
            storeId: store.id,
            productId: product.id,
            quantity: data.stockQuantity || 0,
            price: data.priceCents / 100
          }
        });
      }
    }

    return new Response(JSON.stringify(product), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error("PRODUCT_POST_FATAL_ERROR:", e);
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
  }
}
