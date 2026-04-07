import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

const UpdateSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  benefits: z.string().optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  price: z.number().optional(),
  discountPrice: z.number().optional(),
  active: z.boolean().optional(),
  stockQuantity: z.number().optional(),
  brandName: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  skinToneIds: z.array(z.string()).optional(),
  skinConcernIds: z.array(z.string()).optional(),
  subCategoryId: z.string().optional(),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  mainImage: z.string().optional(),
  variants: z.any().optional(),
  tags: z.array(z.string()).optional(),
  countryPrices: z.array(z.object({
    country: z.string(),
    price: z.number(),
    currency: z.string().optional(),
    active: z.boolean().optional(),
  })).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  const product = await prisma.product.findUnique({
    where: { id: id },
    include: {
      brand: { select: { name: true } },
      subCategory: { select: { name: true, id: true } },
      productCategories: { include: { category: { select: { name: true, id: true } } } },
      productSkinTones: { include: { skinTone: { select: { name: true, id: true, hexColor: true } } } },
      productSkinConcerns: { include: { skinConcern: { select: { name: true, id: true } } } },
    },
  });
  if (!product) return new Response('Not found', { status: 404 });
  
  // Transform the response to include categories and skin tones as arrays
  const transformedProduct = {
    ...product,
    categories: product.productCategories.map((pc: any) => pc.category),
    skinTones: product.productSkinTones.map((ps: any) => ps.skinTone),
    skinConcerns: product.productSkinConcerns.map((sc: any) => sc.skinConcern),
  };
  
  return new Response(JSON.stringify(transformedProduct), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    let data: any;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
    
    // Pre-process to convert string numbers to actual numbers
    if (data.price) data.price = Number(data.price);
    if (data.discountPrice) data.discountPrice = Number(data.discountPrice);
    if (data.stockQuantity) data.stockQuantity = Number(data.stockQuantity);
    if (data.countryPrices && Array.isArray(data.countryPrices)) {
      data.countryPrices = data.countryPrices.map((cp: any) => ({
        ...cp,
        price: typeof cp.price === 'string' ? parseFloat(cp.price) : (Number(cp.price) || 0),
        active: true
      }));
    }
    
    const parsed = UpdateSchema.safeParse(data);
    if (!parsed.success) {
      console.error('PRODUCT_UPDATE_VALIDATION_ERROR:', parsed.error.format());
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.format() }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // normalize features if provided as string
    if (typeof (parsed.data as any).features === 'string') {
      (parsed.data as any).features = ((parsed.data as any).features as string).split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    const updates: any = {};
    if (typeof parsed.data.name !== 'undefined') updates.name = parsed.data.name;
    if (typeof parsed.data.sku !== 'undefined') updates.sku = parsed.data.sku || null;
    if (typeof parsed.data.description !== 'undefined') updates.description = parsed.data.description;
    if (typeof parsed.data.shortDescription !== 'undefined') updates.shortDescription = parsed.data.shortDescription;
    if (typeof parsed.data.benefits !== 'undefined') updates.benefits = parsed.data.benefits;
    if (typeof parsed.data.ingredients !== 'undefined') updates.ingredients = parsed.data.ingredients;
    if (typeof parsed.data.howToUse !== 'undefined') updates.howToUse = parsed.data.howToUse;
    if (typeof parsed.data.price !== 'undefined') updates.price = parsed.data.price;
    if (typeof parsed.data.discountPrice !== 'undefined') updates.discountPrice = parsed.data.discountPrice;
    if (typeof parsed.data.active !== 'undefined') updates.active = parsed.data.active;
    if (typeof (parsed.data as any).trending !== 'undefined') updates.trending = (parsed.data as any).trending;
    if (typeof parsed.data.stockQuantity !== 'undefined') updates.stockQuantity = parsed.data.stockQuantity;
    // Cloudinary: mainImage handling
    if (parsed.data.mainImage) {
      const url = await uploadFromUrl(parsed.data.mainImage).catch(() => parsed.data.mainImage);
      updates.mainImage = url;
    }
    // Images processing (may include Cloudinary uploads)
    if (parsed.data.images) {
      const urls = Array.isArray(parsed.data.images) ? parsed.data.images : [parsed.data.images];
      const uploaded = await Promise.all(urls.map((u: string) => uploadFromUrl(u).catch(() => u)));
      updates.images = uploaded;
    }
    if (parsed.data.variants !== undefined) {
      const v = parsed.data.variants;
      if (typeof v === 'string') {
        try { updates.variants = JSON.parse(v); } catch { updates.variants = v; }
      } else {
        updates.variants = v;
      }
    }
    if (parsed.data.brandName) {
      const b = await prisma.brand.findFirst({ where: { name: parsed.data.brandName } });
      if (b) updates.brandId = b.id;
    }
    if (parsed.data.subCategoryId !== undefined) {
      updates.subCategoryId = parsed.data.subCategoryId || null;
    }

    // Handle category IDs (many-to-many)
    if (parsed.data.categoryIds !== undefined) {
      const categoryIds = parsed.data.categoryIds.filter(id => id.trim());
      const validCategoryIds = categoryIds.length > 0
        ? (await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } })).map(c => c.id)
        : [];
      // Delete existing relations
      await prisma.productCategory.deleteMany({ where: { productId: id } });
      // Create new relations
      if (validCategoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: validCategoryIds.map(categoryId => ({
            productId: id,
            categoryId
          }))
        });
      }
    }

    // Handle skin tone IDs (many-to-many)
    if (parsed.data.skinToneIds !== undefined) {
      const skinToneIds = parsed.data.skinToneIds.filter(id => id.trim());
      const validSkinToneIds = skinToneIds.length > 0
        ? (await prisma.skinTone.findMany({ where: { id: { in: skinToneIds } }, select: { id: true } })).map((s: any) => s.id)
        : [];
      // Delete existing relations
      await prisma.productSkinTone.deleteMany({ where: { productId: id } });
      // Create new relations
      if (validSkinToneIds.length > 0) {
        await prisma.productSkinTone.createMany({
          data: validSkinToneIds.map(skinToneId => ({
            productId: id,
            skinToneId
          }))
        });
      }
    }

    // Handle skin concern IDs (many-to-many)
    if (parsed.data.skinConcernIds !== undefined) {
      const skinConcernIds = parsed.data.skinConcernIds.filter((id: string) => id.trim());
      const validSkinConcernIds = skinConcernIds.length > 0
        ? (await prisma.skinConcern.findMany({ where: { id: { in: skinConcernIds } }, select: { id: true } })).map((s: any) => s.id)
        : [];
      // Delete existing relations
      await prisma.productSkinConcern.deleteMany({ where: { productId: id } });
      // Create new relations
      if (validSkinConcernIds.length > 0) {
        await prisma.productSkinConcern.createMany({
          data: validSkinConcernIds.map(concernId => ({
            productId: id,
            skinConcernId: concernId
          }))
        });
      }
    }

    // Handle tags
    if (parsed.data.tags !== undefined) {
      updates.tags = parsed.data.tags;
    }

    // Handle country prices
    if (parsed.data.countryPrices !== undefined) {
      const countryPrices = parsed.data.countryPrices;
      // Delete existing country prices
      await prisma.countryPrice.deleteMany({ where: { productId: id } });
      // Create new country prices
      if (countryPrices.length > 0) {
        await Promise.all(
          countryPrices.map(cp =>
            prisma.countryPrice.create({
              data: {
                productId: id,
                country: cp.country,
                price: cp.price,
                currency: cp.currency || 'USD',
                active: cp.active !== false,
              }
            })
          )
        );
      }
    }

    // Remove category/skinTone related fields from updates (handled above)
    delete updates.categoryId;
    delete updates.skinToneId;

    if (Object.keys(updates).length === 0 && parsed.data.categoryIds === undefined && parsed.data.skinToneIds === undefined && parsed.data.skinConcernIds === undefined) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const updated = await prisma.product.update({ where: { id: id }, data: updates });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_PRODUCT',
          actorId: (session.user as any).id,
          subjectId: id,
          details: JSON.stringify(updates),
        },
      });
    } catch {
      // ignore audit log failures for now
    }
    
    revalidatePath('/');
    revalidatePath('/products');
    
    return new Response(JSON.stringify(updated), { status: 303, headers: { 'Location': '/ueadmin/products' } });
  } catch (e) {
    console.error('PRODUCT_UPDATE_FATAL:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // First, check if product exists and admin has access to it
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        storeInventories: true,
        countryPrices: true,
      }
    });

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Check store access - admin can only delete products from stores they have access to
    // For now, we'll allow deletion if admin has appropriate role
    // In a more complex system, you might want to check store access via getAdminStoreAccess()

    // Delete related records first (to maintain referential integrity)
    await prisma.storeInventory.deleteMany({
      where: { productId: id }
    });

    await prisma.countryPrice.deleteMany({
      where: { productId: id }
    });

    // Delete the product
    await prisma.product.delete({
      where: { id }
    });

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_PRODUCT',
          actorId: (session.user as any).id,
          subjectId: id,
          details: `Product "${product.name}" (ID: ${id}) deleted by ${(session.user as any).email}`,
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Continue even if audit log fails
    }

    revalidatePath('/');
    revalidatePath('/products');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: { id, name: product.name }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PRODUCT_DELETE_ERROR:', error);
    
    // Handle specific errors
    let errorMessage = 'Failed to delete product';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Cannot delete product because it is referenced in other records';
        statusCode = 409; // Conflict
      }
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
