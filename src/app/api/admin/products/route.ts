import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';
import { getAdminApiSession, getAdminStoreAccess } from '@/lib/admin-session';
import { SUPPORTED_COUNTRIES, isValidCountryCode, getCurrencyForCountry } from '@/lib/countries';
import { revalidatePath } from 'next/cache';

/**
 * Generate a URL-friendly slug from a product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 100); // Limit length
}

const CountryPriceSchema = z.object({
  country: z.string().refine(
    (code) => isValidCountryCode(code),
    { message: `Country must be one of: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}` }
  ),
  price: z.number().min(0, { message: "Country price must be 0 or more" }),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  howToUse: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().nullable().optional(),
  trending: z.boolean().optional(),
  price: z.number().min(0, { message: "Product price must be 0 or more" }),
  discountPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  brandName: z.string().optional(),
  categoryIds: z.array(z.string()).optional().default([]),
  skinToneIds: z.array(z.string()).optional().default([]),
  skinConcernIds: z.array(z.string()).optional().default([]),
  subCategoryId: z.string().nullable().optional(),
  hot: z.boolean().optional(),
  storeId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  weight: z.number().optional().default(0),
  weightUnit: z.string().optional().default('kg'),
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
}).refine(
  (data) => {
    if (data.countryPrices && data.countryPrices.length > 0) {
      const validPrices = data.countryPrices.filter(cp => cp.price > 0);
      if (validPrices.length === 0) {
        return false;
      }
    }
    return true;
  },
  {
    message: "At least one country price must be set. Product will not be visible without prices.",
    path: ["countryPrices"],
  }
).refine(
  (data) => {
    // Validate that discount doesn't exceed price
    if (data.discountPrice && data.discountPrice > data.price) {
      return false;
    }
    return true;
  },
  {
    message: "Discount cannot exceed product price",
    path: ["discountPrice"],
  }
);

export async function GET(req: Request) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const storeAccess = await getAdminStoreAccess();
    if (!storeAccess) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const select = searchParams.get('select');

    // Lightweight select for dropdowns/selectors
    if (select === 'name,id' || select === 'name,id,sku') {
      const products = await prisma.product.findMany({
        where: { active: true },
        select: select === 'name,id,sku'
          ? { id: true, name: true, sku: true }
          : { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 1000,
      });
      return new Response(JSON.stringify(products), { headers: { 'Content-Type': 'application/json' } });
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

    const products = await (prisma as any).product.findMany({
      where: whereClause,
      include: {
        brand: true,
        productCategories: { include: { category: { select: { name: true, id: true } } } },
        store: { select: { code: true, name: true } },
        storeInventories: {
          where: accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : undefined,
          select: { storeId: true, quantity: true, store: { select: { code: true } } }
        },
        countryPrices: true,
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
    const session = await getAdminApiSession();
    console.log('POST /api/admin/products - Session:', session ? 'present' : 'missing');
    if (!session) {
      console.log('Unauthorized: no session or invalid role');
      return new Response('Unauthorized', { status: 401 });
    }

    const storeAccess = await getAdminStoreAccess();
    console.log('Store access:', storeAccess);
    if (!storeAccess) {
      console.log('Unauthorized: no store access');
      return new Response('Unauthorized', { status: 401 });
    }
    
    const user = session.user;
    if (!user) {
      console.log('Unauthorized: no user in session');
      return new Response('Unauthorized', { status: 401 });
    }
    
    const body = await req.json();
    
    // Pre-process to convert string numbers to actual numbers
    const processedBody = { ...body };
    if (processedBody.price !== undefined && processedBody.price !== null) {
      processedBody.price = Number(processedBody.price);
    }
    if (processedBody.discountPrice !== undefined && processedBody.discountPrice !== null) {
      processedBody.discountPrice = Number(processedBody.discountPrice);
    }
    if (processedBody.stockQuantity !== undefined && processedBody.stockQuantity !== null) {
      processedBody.stockQuantity = Number(processedBody.stockQuantity);
    }
    if (processedBody.weight !== undefined && processedBody.weight !== null) {
      processedBody.weight = Number(processedBody.weight);
    }
    if (processedBody.countryPrices && Array.isArray(processedBody.countryPrices)) {
      processedBody.countryPrices = processedBody.countryPrices.map((cp: any) => ({
        ...cp,
        price: typeof cp.price === 'string' ? parseFloat(cp.price) : (Number(cp.price) || 0),
        active: true,
      }));
    }
    
    const parsed = ProductCreateSchema.safeParse(processedBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Invalid payload',
        details: parsed.error.issues,
        // Include the first issue for quick debugging
        firstIssue: parsed.error.issues[0],
      }), { status: 400 });
    }
    const data = parsed.data;
    
    // Create a copy of data to avoid modifying the validated object
    const productData = { ...data };

    // Check store access if storeId is provided
    if (productData.storeId) {
      const canAccess = storeAccess.allowedStores.includes(productData.storeId);
      if (!canAccess && !storeAccess.isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'No access to specified store' }), { status: 403 });
      }
    }

    // Cloudinary: handle mainImage upload and images processing
    let mainImageUrl: string | null = null;
    if (productData.mainImage && productData.mainImage.trim() !== '') {
      mainImageUrl = await uploadFromUrl(productData.mainImage).catch(() => productData.mainImage || null);
    }

    // Combine mainImage and gallery images
    let finalImages: string[] = [];
    if (mainImageUrl) {
      finalImages.push(mainImageUrl);
    }
    
    if (Array.isArray(productData.images)) {
      const uploadedGallery = await Promise.all(
        productData.images
          .filter(img => img !== mainImageUrl)
          .map(img => uploadFromUrl(img).catch(() => img))
      );
      finalImages = [...finalImages, ...uploadedGallery];
    }
    productData.images = finalImages;

    // Resolve brand by name if provided
    let brandId: string | null = null;
    if (productData.brandName && productData.brandName !== 'All') {
      const b = await prisma.brand.findFirst({ where: { name: productData.brandName } });
      brandId = b?.id || null;
    }

    // Resolve sub-category by ID if provided
    const subCategoryId: string | null = productData.subCategoryId?.trim() || null;

    // Get valid category IDs (only those that exist in DB)
    const categoryIds = productData.categoryIds?.filter(id => id.trim()) || [];
    const validCategoryIds = categoryIds.length > 0
      ? (await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } })).map(c => c.id)
      : [];

    // Get valid skin tone IDs (only those that exist in DB)
    const skinToneIds = productData.skinToneIds?.filter(id => id.trim()) || [];
    const validSkinToneIds = skinToneIds.length > 0
      ? (await prisma.skinTone.findMany({ where: { id: { in: skinToneIds } }, select: { id: true } })).map(s => s.id)
      : [];

    // Get valid skin concern IDs (only those that exist in DB)
    const skinConcernIds = productData.skinConcernIds?.filter(id => id.trim()) || [];
    const validSkinConcernIds = skinConcernIds.length > 0
      ? (await prisma.skinConcern.findMany({ where: { id: { in: skinConcernIds } }, select: { id: true } })).map(s => s.id)
      : [];

    // Resolve store assignment
    // All products must be assigned to a store for proper store-specific rendering
    // Default: auto-assign to admin's primary store based on their country
    let storeId: string | null = null;
    let storeCodeForInventory: string | null = null;
    
    
    if (productData.storeId && productData.storeId !== 'GLOBAL') {
      // If storeId is explicitly provided (and not GLOBAL)
      // Validate that admin has access to the specified store
      const canAccess = storeAccess.allowedStores.includes(productData.storeId);
      if (!canAccess && !storeAccess.isSuperAdmin) {
        return new Response(JSON.stringify({
          error: 'No access to specified store'
        }), { status: 403 });
      }
      
      const store = await prisma.store.findFirst({ where: { code: productData.storeId } });
      if (!store) {
        return new Response(JSON.stringify({
          error: 'Specified store not found'
        }), { status: 404 });
      }
      storeId = store.id;
      storeCodeForInventory = productData.storeId;
    } else {
      // No storeId provided or GLOBAL specified - auto-assign to admin's primary store
      if (storeAccess.allowedStores.length > 0) {
        // Use the first store from allowedStores (admin's primary store)
        const primaryStoreCode = storeAccess.allowedStores[0];
        const store = await prisma.store.findFirst({ where: { code: primaryStoreCode } });
        if (store) {
          storeId = store.id;
          storeCodeForInventory = primaryStoreCode;
          console.log(`Auto-assigning product to admin's store: ${primaryStoreCode}`);
          
          // If GLOBAL was specified, log that we're overriding it
          if (productData.storeId === 'GLOBAL') {
            console.log(`Note: GLOBAL product request overridden - assigning to ${primaryStoreCode} instead`);
          }
        } else {
        }
      } else if (storeAccess.isSuperAdmin) {
        // SUPERADMIN with no store access - assign to UAE as default
        const uaeStore = await prisma.store.findFirst({ where: { code: 'UAE' } });
        if (uaeStore) {
          storeId = uaeStore.id;
          storeCodeForInventory = 'UAE';
          console.log(`SUPERADMIN product assigned to UAE store as default`);
        } else {
        }
      } else {
        // Regular admin with no store access cannot create products
        return new Response(JSON.stringify({
          error: 'Admin has no store access. Cannot create products.'
        }), { status: 403 });
      }
    }
    
    // Ensure storeId is always set (no more global products)
    if (!storeId) {
      return new Response(JSON.stringify({
        error: 'Could not determine store assignment for product'
      }), { status: 400 });
    }

    const dbProductData = {
      name: productData.name,
      slug: generateSlug(productData.name),
      sku: productData.sku || null,
      description: productData.description || '',
      shortDescription: productData.shortDescription || null,
      benefits: productData.benefits || null,
      ingredients: productData.ingredients || null,
      howToUse: productData.howToUse || null,
      features: productData.features ?? [],
      images: (productData.images as string[]) ?? [],
      mainImage: mainImageUrl || ((productData.images as string[])?.[0] || null),
      price: productData.price,
      discountPrice: productData.discountPrice || 0,
      stockQuantity: productData.stockQuantity ?? 0,
      hot: productData.hot ?? false,
      trending: productData.trending ?? false,
      brandId,
      subCategoryId,
      storeId,
      currency: 'USD',
      tags: productData.tags ?? [],
      weight: productData.weight ?? 0,
      weightUnit: productData.weightUnit ?? 'kg',
    };

    // Use upsert to handle existing products atomically
    // This prevents race conditions and P2002 unique constraint errors
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: dbProductData,
      create: dbProductData,
    });

    // Handle product categories (many-to-many)
    // Always delete and recreate relations to ensure consistency
    if (validCategoryIds.length > 0) {
      // Delete existing relations
      await prisma.productCategory.deleteMany({
        where: { productId: product.id }
      });
      // Create new relations
      if (validCategoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: validCategoryIds.map(categoryId => ({
            productId: product.id,
            categoryId
          }))
        });
      }
    }

    // Handle product skin tones (many-to-many)
    // Always delete and recreate relations to ensure consistency
    if (validSkinToneIds.length > 0) {
      // Delete existing relations
      await prisma.productSkinTone.deleteMany({
        where: { productId: product.id }
      });
      // Create new relations
      if (validSkinToneIds.length > 0) {
        await prisma.productSkinTone.createMany({
          data: validSkinToneIds.map(skinToneId => ({
            productId: product.id,
            skinToneId
          }))
        });
      }
    }

    // Handle product skin concerns (many-to-many)
    // Always delete and recreate relations to ensure consistency
    if (validSkinConcernIds.length > 0) {
      // Delete existing relations
      await prisma.productSkinConcern.deleteMany({
        where: { productId: product.id }
      });
      // Create new relations
      if (validSkinConcernIds.length > 0) {
        await prisma.productSkinConcern.createMany({
          data: validSkinConcernIds.map(concernId => ({
            productId: product.id,
            skinConcernId: concernId
          }))
        });
      }
    }

    // Handle initial store inventory if storeId provided (and not GLOBAL)
    if (storeCodeForInventory && storeId) {
      const store = await prisma.store.findFirst({
        where: { code: storeCodeForInventory }
      });
      
      if (store) {
        try {
          await prisma.storeInventory.upsert({
            where: {
              storeId_productId: {
                storeId: store.id,
                productId: product.id
              }
            },
            update: {
              quantity: productData.stockQuantity ?? 0,
              price: productData.price - (productData.discountPrice || 0)
            },
            create: {
              storeId: store.id,
              productId: product.id,
              quantity: productData.stockQuantity ?? 0,
              price: productData.price - (productData.discountPrice || 0)
            }
          });
        } catch (inventoryError) {
          console.error('[DEBUG] ERROR creating store inventory:', inventoryError);
          throw inventoryError; // Re-throw to be caught by outer catch block
        }
      } else {
      }
    } else {
    }

    // Create country-specific prices if provided
    if (productData.countryPrices && productData.countryPrices.length > 0) {
      // First, delete existing country prices for this product
      await prisma.countryPrice.deleteMany({
        where: { productId: product.id }
      });
      
      // Auto-detect currency for each country price if not provided
      const countryPricesWithCurrency = productData.countryPrices.map(countryPrice => {
        const countryCode = countryPrice.country.toUpperCase();
        return {
          ...countryPrice,
          currency: countryPrice.currency || getCurrencyForCountry(countryCode) || 'USD',
          country: countryCode,
          active: countryPrice.active !== false, // Default to true if not specified
        };
      });
      
      // Create new country prices
      try {
        await Promise.all(
          countryPricesWithCurrency.map(countryPrice =>
            prisma.countryPrice.create({
              data: {
                productId: product.id,
                country: countryPrice.country,
                price: countryPrice.price,
                currency: countryPrice.currency,
                active: countryPrice.active
              }
            })
          )
        );
      } catch (countryPriceError) {
        console.error('[DEBUG] ERROR creating country prices:', countryPriceError);
        throw countryPriceError; // Re-throw to be caught by outer catch block
      }
    } else {
    }

    // Log activity
    try {
      await prisma.auditLog.create({
        data: {
          action: 'PRODUCT_CREATED',
          actorId: user.id,
          subjectId: product.id,
          details: `Product "${productData.name}" created by ${user.email}`,
        }
      });
    } catch (auditError) {
      console.error('[DEBUG] ERROR creating audit log:', auditError);
      // Don't fail the entire request if audit log fails
    }

    
    revalidatePath('/');
    revalidatePath('/products');
    
    return new Response(JSON.stringify(product), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('PRODUCT_CREATE_ERROR:', error);
    
    // Provide more detailed error information
    const errorResponse: any = {
      error: 'Server error',
      message: error.message,
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    // Check for specific Prisma errors
    if (error.code && error.code.startsWith('P')) {
      errorResponse.type = 'database_error';
      errorResponse.code = error.code;
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        errorResponse.message = 'A product with this name already exists';
      } else if (error.code === 'P2003') {
        errorResponse.message = 'Foreign key constraint failed. Check brand, category, or store references.';
      }
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
