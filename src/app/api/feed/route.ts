import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeWeight(product: { weight: number | null; weightUnit: string }): { value: number; unit: string } {
  if (!product.weight) return { value: 0, unit: 'kg' };
  if (product.weightUnit === 'g') {
    return { value: product.weight / 1000, unit: 'kg' };
  }
  return { value: product.weight, unit: 'kg' };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('Retry exhausted');
}

export async function GET() {
   try {
     const products = await withRetry(() => prisma.product.findMany({
       where: {
         active: true,
         stockQuantity: { gt: 0 },
       },
       include: {
         brand: true,
         subCategory: {
           include: {
             category: true,
           },
         },
       },
       orderBy: { updatedAt: 'desc' },
     }));

    const xmlItems = products
      .map((product) => {
        const effectivePrice = product.discountPrice || product.price;
        if (!effectivePrice) return null;

        const image = product.mainImage || product.images[0];
        const link = `${SITE_URL}/products/${product.slug || product.id}`;
        const weight = normalizeWeight(product);
        const categoryPath = product.subCategory
          ? `${product.subCategory.category?.name || ''} > ${product.subCategory.name}`
          : product.subCategory?.name || '';

        return `
  <item>
    <g:id>${escapeXml(product.id)}</g:id>
    <g:title>${escapeXml(product.name)}</g:title>
    <g:description>${escapeXml(product.description || product.shortDescription || product.name)}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>in stock</g:availability>
     <g:price>${product.price.toFixed(2)} ${product.currency || 'USD'}</g:price>
     ${product.discountPrice ? `<g:sale_price>${product.discountPrice.toFixed(2)} ${product.currency || 'USD'}</g:sale_price>` : ''}
    <g:condition>new</g:condition>
    <g:brand>${escapeXml(product.brand?.name || 'SHANFA')}</g:brand>
    <g:product_type>${escapeXml(categoryPath)}</g:product_type>
    <g:gtin>${escapeXml(product.sku)}</g:gtin>
    <g:mpn>${escapeXml(product.sku)}</g:mpn>
    <g:shipping_weight>${weight.value} ${weight.unit}</g:shipping_weight>
    ${product.averageRating > 0 ? `<g:product_detail>Rating: ${product.averageRating.toFixed(1)} out of 5 (${product.ratingCount} reviews)</g:product_detail>` : ''}
  </item>`;
      })
      .filter(Boolean)
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SHANFA Product Feed</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Premium Skin Care Products</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Product Feed] Error generating feed:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate product feed</error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
}
