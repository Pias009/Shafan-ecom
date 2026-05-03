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

export async function GET() {
  try {
    let lastError: Error | null = null;
    let products;
    
    for (let i = 0; i < 3; i++) {
      try {
        products = await prisma.product.findMany({
          where: {
            active: true,
            stockQuantity: { gt: 0 },
          },
          select: {
            id: true,
            name: true,
            description: true,
            shortDescription: true,
            slug: true,
            price: true,
            discountPrice: true,
            images: true,
            mainImage: true,
            currency: true,
            sku: true,
            weight: true,
            weightUnit: true,
            averageRating: true,
            ratingCount: true,
            brand: { select: { name: true } },
            subCategory: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (i < 2) await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }
    
    if (!products) throw lastError || new Error('Failed to fetch products');

    const xmlItems = products
      .map((product) => {
        const effectivePrice = product.discountPrice || product.price;
        if (!effectivePrice || !product.price) return null;

        const image = product.mainImage || product.images[0];
        const link = `${SITE_URL}/products/${product.slug || product.id}`;
        const weight = normalizeWeight(product);
        const categoryPath = product.subCategory
          ? `${product.subCategory.category?.name || ''} > ${(product.subCategory as { name: string }).name}`
          : '';

        const descText = product.description || product.shortDescription || product.name || '';
        const currency = product.currency || 'AED';
        return `
  <item>
    <g:id>${escapeXml(product.id)}</g:id>
    <g:title><![CDATA[${product.name || ''}]]></g:title>
    <g:description><![CDATA[${descText}]]></g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:price>${(product.price ?? 0).toFixed(2)} ${currency}</g:price>
    ${product.discountPrice ? `<g:sale_price>${product.discountPrice.toFixed(2)} ${currency}</g:sale_price>` : ''}
    <g:condition>new</g:condition>
    <g:brand><![CDATA[${product.brand?.name || 'SHANFA'}]]></g:brand>
    <g:product_type><![CDATA[${categoryPath}]]></g:product_type>
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
