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
  priceCents: z.number().int().min(0, { message: "Country price must be 0 or more cents" }),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number().int().min(0, { message: "Product price must be 0 or more cents" }),
  discountCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  skinToneId: z.string().optional(),
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
}).refine(
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
    console.log('POST /api/admin/products - Session:', session ? 'present' : 'missing');
    if (session) {
      console.log('Session user:', session.user);
      console.log('Session user role:', (session.user as any)?.role);
    }
    if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
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

    // Resolve brand/category by name if provided
    let brandId: string | null = null;
    let categoryId: string | null = null;
    if (productData.brandName && productData.brandName !== 'All') {
      const b = await prisma.brand.findFirst({ where: { name: productData.brandName } });
      brandId = b?.id || null;
    }
    if (productData.categoryName && productData.categoryName !== 'All') {
      const c = await prisma.category.findFirst({ where: { name: productData.categoryName } });
      categoryId = c?.id || null;
    }

    // Resolve sub-category and skin tone by ID if provided
    let subCategoryId: string | null = productData.subCategoryId?.trim() || null;
    let skinToneId: string | null = productData.skinToneId?.trim() || null;

    // Check for existing product by name to avoid non-unique upsert error
    const existingProduct = await prisma.product.findFirst({ where: { name: productData.name } });
    
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
        }
      } else if (storeAccess.isSuperAdmin) {
        // SUPERADMIN with no store access - assign to UAE as default
        const uaeStore = await prisma.store.findFirst({ where: { code: 'UAE' } });
        if (uaeStore) {
          storeId = uaeStore.id;
          storeCodeForInventory = 'UAE';
          console.log(`SUPERADMIN product assigned to UAE store as default`);
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
      description: productData.description || '',
      features: productData.features ?? [],
      images: (productData.images as string[]) ?? [],
      priceCents: productData.priceCents,
      discountCents: productData.discountCents || 0,
      stockQuantity: productData.stockQuantity ?? 0,
      hot: productData.hot ?? false,
      trending: productData.trending ?? false,
      brandId,
      categoryId,
      subCategoryId,
      skinToneId,
      storeId,
      currency: 'USD', // Default currency as per schema
    };

    const product = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: dbProductData,
        })
      : await prisma.product.create({
          data: dbProductData,
        });

    // Handle initial store inventory if storeId provided (and not GLOBAL)
    if (storeCodeForInventory && storeId) {
      const store = await prisma.store.findFirst({
        where: { code: storeCodeForInventory }
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
      }
    }

    // Create country-specific prices if provided
    if (productData.countryPrices && productData.countryPrices.length > 0) {
      // First, delete existing country prices for this product (if updating)
      if (existingProduct) {
        await prisma.countryPrice.deleteMany({
          where: { productId: product.id }
        });
      }
      
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
        details: `Product "${productData.name}" created by ${user.email}`,
      }
    });

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
