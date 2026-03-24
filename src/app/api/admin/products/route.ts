import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerAuthSession } from '@/lib/auth';
import { uploadFromUrl } from '@/lib/cloudinary';
import { getAdminStoreAccess } from '@/lib/admin-store-guard';
import { SUPPORTED_COUNTRIES, isValidCountryCode, getCurrencyForCountry } from '@/lib/countries';

const CountryPriceSchema = z.object({
  country: z.string().refine(
    (code) => isValidCountryCode(code),
    { message: `Country must be one of: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}` }
  ),
  priceCents: z.number().int().min(0),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number().int().min(0),
  discountCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  hot: z.boolean().optional(),
  storeId: z.string().optional(), // Store code for product assignment
  countryPrices: z.array(CountryPriceSchema)
    .optional()
    .default([])
    .refine(
      (prices) => {
        // Validate that all countries are unique
        const countries = prices.map(p => p.country);
        return new Set(countries).size === countries.length;
      },
      { message: "Duplicate country entries are not allowed" }
    )
    .refine(
      (prices) => {
        // Validate that all country codes are valid
        return prices.every(p => isValidCountryCode(p.country));
      },
      { message: "Invalid country code detected" }
    ),
});

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const storeAccess = await getAdminStoreAccess();
    if (!storeAccess) {
      return new Response('Unauthorized', { status: 401 });
    }

    const accessibleStoreIds = storeAccess.storeIds;
    
    // Build where clause based on store access
    let whereClause: any = {};
    
    if (accessibleStoreIds.length > 0) {
      // Show products that are either:
      // 1. In stores admin can access (via storeInventories)
      // 2. Global products (storeId is null) - only for UAE admins (global admins)
      if (storeAccess.isGlobalAdmin) {
        whereClause = {
          OR: [
            { storeId: { in: accessibleStoreIds } },
            { storeId: null },
            { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } }
          ]
        };
      } else {
        // Kuwait admins can only see products in their stores
        whereClause = {
          OR: [
            { storeId: { in: accessibleStoreIds } },
            { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } }
          ]
        };
      }
    } else {
      // Admin with no store access - return empty
      return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }

    const products = await prisma.product.findMany({
      where: whereClause,
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
        store: { select: { code: true, name: true } },
        storeInventories: {
          where: accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : undefined,
          select: { storeId: true, quantity: true, store: { select: { code: true } } }
        },
        countryPrices: {
          select: {
            id: true,
            country: true,
            priceCents: true,
            currency: true,
            active: true
          }
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return new Response(JSON.stringify(products), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const storeAccess = await getAdminStoreAccess();
    if (!storeAccess) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const user = session.user;
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const body = await req.json();
    console.log("API Request Body:", JSON.stringify(body, null, 2));
    
    const parsed = ProductCreateSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation Error Details:", JSON.stringify(parsed.error.issues, null, 2));
      console.error("Raw body that failed:", body);
      return new Response(JSON.stringify({
        error: 'Invalid payload',
        details: parsed.error.issues,
        message: 'Validation failed. Check that all numeric fields are numbers, not strings.'
      }), { status: 400 });
    }
    const data = parsed.data;
    console.log("Parsed data (validated):", JSON.stringify(data, null, 2));

    // Check store access if storeId is provided
    if (data.storeId) {
      const canAccess = storeAccess.allowedStores.includes(data.storeId);
      if (!canAccess && !storeAccess.isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'No access to specified store' }), { status: 403 });
      }
    }

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
    
    // Resolve store if storeId (code) is provided
    let storeId: string | null = null;
    if (data.storeId) {
      const store = await prisma.store.findFirst({ where: { code: data.storeId } });
      storeId = store?.id || null;
    }

    const productData = {
      name: data.name,
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
      storeId,
    };

    const product = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData,
        })
      : await prisma.product.create({
          data: productData,
        });

    // Handle initial store inventory if storeId provided
    if (data.storeId && storeId) {
      const store = await prisma.store.findFirst({
        where: { code: data.storeId }
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
            quantity: data.stockQuantity ?? 0,
            price: (data.priceCents - (data.discountCents || 0)) / 100
          },
          create: {
            storeId: store.id,
            productId: product.id,
            quantity: data.stockQuantity ?? 0,
            price: (data.priceCents - (data.discountCents || 0)) / 100
          }
        });
      }
    }

    // Create country-specific prices if provided
    if (data.countryPrices && data.countryPrices.length > 0) {
      // First, delete existing country prices for this product (if updating)
      if (existingProduct) {
        await prisma.countryPrice.deleteMany({
          where: { productId: product.id }
        });
      }
      
      // Auto-detect currency for each country price if not provided
      const countryPricesWithCurrency = data.countryPrices.map(countryPrice => {
        const countryCode = countryPrice.country.toUpperCase();
        return {
          ...countryPrice,
          currency: countryPrice.currency || getCurrencyForCountry(countryCode) || 'USD',
          country: countryCode,
          active: countryPrice.active !== false, // Default to true if not specified
        };
      });
      
      // Create new country prices
      await Promise.all(
        countryPricesWithCurrency.map(countryPrice =>
          prisma.countryPrice.create({
            data: {
              productId: product.id,
              country: countryPrice.country,
              priceCents: countryPrice.priceCents,
              currency: countryPrice.currency,
              active: countryPrice.active
            }
          })
        )
      );
    }

    // Log activity
    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_CREATED',
        actorId: user.id,
        subjectId: product.id,
        details: `Product "${data.name}" created by ${user.email}`,
      }
    });

    return new Response(JSON.stringify(product), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('PRODUCT_CREATE_ERROR:', error);
    return new Response(JSON.stringify({ error: 'Server error', details: error.message }), { status: 500 });
  }
}
