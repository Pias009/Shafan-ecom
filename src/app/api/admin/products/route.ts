import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadFromUrl } from '@/lib/cloudinary';
import { getAdminApiSession, getAdminStoreAccess } from '@/lib/admin-session';
import { SUPPORTED_COUNTRIES, isValidCountryCode, getCurrencyForCountry } from '@/lib/countries';

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
  priceCents: z.number().int().min(0, { message: "Country price must be 0 or more cents" }),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  sku: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  benefits: z.string().optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number().int().min(0, { message: "Product price must be 0 or more cents" }),
  discountCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  brandName: z.string().optional(),
  categoryIds: z.array(z.string()).optional().default([]),
  skinToneIds: z.array(z.string()).optional().default([]),
  skinConcernIds: z.array(z.string()).optional().default([]),
  subCategoryId: z.string().nullable().optional(),
  hot: z.boolean().optional(),
  storeId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
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
      const validPrices = data.countryPrices.filter(cp => cp.priceCents > 0);
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
    if (data.discountCents && data.discountCents > data.priceCents) {
      return false;
    }
    return true;
  },
  {
    message: "Discount cannot exceed product price",
    path: ["discountCents"],
  }
);

export async function GET() {
  try {
    const session = await getAdminApiSession();
    if (!session) {
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
        productCategories: { include: { category: { select: { name: true, id: true } } } },
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
    console.log("API Request Body:", JSON.stringify(body, null, 2));
    
    // Pre-process to convert string numbers to actual numbers
    const processedBody = { ...body };
    if (processedBody.priceCents !== undefined && processedBody.priceCents !== null) {
      processedBody.priceCents = Number(processedBody.priceCents);
    }
    if (processedBody.discountCents !== undefined && processedBody.discountCents !== null) {
      processedBody.discountCents = Number(processedBody.discountCents);
    }
    if (processedBody.stockQuantity !== undefined && processedBody.stockQuantity !== null) {
      processedBody.stockQuantity = Number(processedBody.stockQuantity);
    }
    if (processedBody.countryPrices && Array.isArray(processedBody.countryPrices)) {
      processedBody.countryPrices = processedBody.countryPrices.map((cp: any) => ({
        ...cp,
        priceCents: typeof cp.priceCents === 'string' ? parseInt(cp.priceCents, 10) : (Number(cp.priceCents) || 0),
      }));
    }
    
    const parsed = ProductCreateSchema.safeParse(processedBody);
    if (!parsed.success) {
      console.error("Validation Error Details:", JSON.stringify(parsed.error.issues, null, 2));
      console.error("Raw body that failed:", JSON.stringify(body, null, 2));
      return new Response(JSON.stringify({
        error: 'Invalid payload',
        details: parsed.error.issues,
        // Include the first issue for quick debugging
        firstIssue: parsed.error.issues[0],
      }), { status: 400 });
    }
    const data = parsed.data;
    console.log("Parsed data (validated):", JSON.stringify(data, null, 2));
    
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
    let subCategoryId: string | null = productData.subCategoryId?.trim() || null;

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
    
    console.log('[DEBUG] Starting store assignment logic...');
    console.log('[DEBUG] productData.storeId:', productData.storeId);
    console.log('[DEBUG] storeAccess.allowedStores:', storeAccess.allowedStores);
    console.log('[DEBUG] storeAccess.isSuperAdmin:', storeAccess.isSuperAdmin);
    
    if (productData.storeId && productData.storeId !== 'GLOBAL') {
      // If storeId is explicitly provided (and not GLOBAL)
      // Validate that admin has access to the specified store
      console.log('[DEBUG] Checking access to specified store:', productData.storeId);
      const canAccess = storeAccess.allowedStores.includes(productData.storeId);
      if (!canAccess && !storeAccess.isSuperAdmin) {
        console.log('[DEBUG] Access denied to store:', productData.storeId);
        return new Response(JSON.stringify({
          error: 'No access to specified store'
        }), { status: 403 });
      }
      
      console.log('[DEBUG] Looking up store with code:', productData.storeId);
      const store = await prisma.store.findFirst({ where: { code: productData.storeId } });
      console.log('[DEBUG] Found store:', store);
      if (!store) {
        console.log('[DEBUG] Store not found with code:', productData.storeId);
        return new Response(JSON.stringify({
          error: 'Specified store not found'
        }), { status: 404 });
      }
      storeId = store.id;
      storeCodeForInventory = productData.storeId;
      console.log('[DEBUG] Store assigned successfully. storeId:', storeId, 'storeCodeForInventory:', storeCodeForInventory);
    } else {
      // No storeId provided or GLOBAL specified - auto-assign to admin's primary store
      console.log('[DEBUG] No explicit storeId or GLOBAL specified. Auto-assigning...');
      if (storeAccess.allowedStores.length > 0) {
        // Use the first store from allowedStores (admin's primary store)
        const primaryStoreCode = storeAccess.allowedStores[0];
        console.log('[DEBUG] Primary store code:', primaryStoreCode);
        const store = await prisma.store.findFirst({ where: { code: primaryStoreCode } });
        console.log('[DEBUG] Found primary store:', store);
        if (store) {
          storeId = store.id;
          storeCodeForInventory = primaryStoreCode;
          console.log(`Auto-assigning product to admin's store: ${primaryStoreCode}`);
          
          // If GLOBAL was specified, log that we're overriding it
          if (productData.storeId === 'GLOBAL') {
            console.log(`Note: GLOBAL product request overridden - assigning to ${primaryStoreCode} instead`);
          }
        } else {
          console.log('[DEBUG] ERROR: Primary store not found in database!');
        }
      } else if (storeAccess.isSuperAdmin) {
        // SUPERADMIN with no store access - assign to UAE as default
        console.log('[DEBUG] SUPERADMIN with no store access, assigning to UAE...');
        const uaeStore = await prisma.store.findFirst({ where: { code: 'UAE' } });
        console.log('[DEBUG] Found UAE store:', uaeStore);
        if (uaeStore) {
          storeId = uaeStore.id;
          storeCodeForInventory = 'UAE';
          console.log(`SUPERADMIN product assigned to UAE store as default`);
        } else {
          console.log('[DEBUG] ERROR: UAE store not found in database!');
        }
      } else {
        // Regular admin with no store access cannot create products
        console.log('[DEBUG] ERROR: Admin has no store access');
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
      priceCents: productData.priceCents,
      discountCents: productData.discountCents || 0,
      stockQuantity: productData.stockQuantity ?? 0,
      hot: productData.hot ?? false,
      trending: productData.trending ?? false,
      brandId,
      subCategoryId,
      storeId,
      currency: 'USD',
      tags: productData.tags ?? [],
    };
    console.log('[DEBUG] dbProductData.slug:', dbProductData.slug);

    // Use upsert to handle existing products atomically
    // This prevents race conditions and P2002 unique constraint errors
    console.log('[DEBUG] Upserting product with name:', productData.name);
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: dbProductData,
      create: dbProductData,
    });
    console.log('[DEBUG] Product upserted successfully. Product ID:', product.id);

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
    console.log('[DEBUG] Creating store inventory...');
    if (storeCodeForInventory && storeId) {
      console.log('[DEBUG] storeCodeForInventory:', storeCodeForInventory, 'storeId:', storeId);
      const store = await prisma.store.findFirst({
        where: { code: storeCodeForInventory }
      });
      console.log('[DEBUG] Found store for inventory:', store);
      
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
              price: (productData.priceCents - (productData.discountCents || 0)) / 100
            },
            create: {
              storeId: store.id,
              productId: product.id,
              quantity: productData.stockQuantity ?? 0,
              price: (productData.priceCents - (productData.discountCents || 0)) / 100
            }
          });
          console.log('[DEBUG] Store inventory created/updated successfully');
        } catch (inventoryError) {
          console.error('[DEBUG] ERROR creating store inventory:', inventoryError);
          throw inventoryError; // Re-throw to be caught by outer catch block
        }
      } else {
        console.log('[DEBUG] WARNING: Store not found for inventory creation');
      }
    } else {
      console.log('[DEBUG] No store inventory to create (storeCodeForInventory or storeId is null)');
    }

    // Create country-specific prices if provided
    console.log('[DEBUG] Creating country prices...');
    if (productData.countryPrices && productData.countryPrices.length > 0) {
      console.log('[DEBUG] Country prices to create:', productData.countryPrices);
      // First, delete existing country prices for this product
      console.log('[DEBUG] Deleting existing country prices for product:', product.id);
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
      console.log('[DEBUG] Country prices with currency:', countryPricesWithCurrency);
      
      // Create new country prices
      try {
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
        console.log('[DEBUG] Country prices created successfully');
      } catch (countryPriceError) {
        console.error('[DEBUG] ERROR creating country prices:', countryPriceError);
        throw countryPriceError; // Re-throw to be caught by outer catch block
      }
    } else {
      console.log('[DEBUG] No country prices provided');
    }

    // Log activity
    console.log('[DEBUG] Creating audit log...');
    try {
      await prisma.auditLog.create({
        data: {
          action: 'PRODUCT_CREATED',
          actorId: user.id,
          subjectId: product.id,
          details: `Product "${productData.name}" created by ${user.email}`,
        }
      });
      console.log('[DEBUG] Audit log created successfully');
    } catch (auditError) {
      console.error('[DEBUG] ERROR creating audit log:', auditError);
      // Don't fail the entire request if audit log fails
    }

    console.log('[DEBUG] Product creation completed successfully');
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
