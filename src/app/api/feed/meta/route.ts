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

export const revalidate = 3600; // ISR: Revalidate every 1 hour
export const dynamic = 'force-static'; // Allow static optimization on Vercel

export async function GET() {
  try {
    const products = await withRetry(() => prisma.product.findMany({
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
        tags: true,
        hot: true,
        trending: true,
        brand: { select: { name: true } },
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }));

    // Pre-calculate currency and common fields for speed
    const defaultCurrency = 'AED';

    const xmlItems = products
      .map((product) => {
        const price = Number(product.price || 0);
        if (price <= 0) return null; // Reject products without valid price for feed quality

        const discPrice = product.discountPrice ? Number(product.discountPrice) : null;
        const currency = product.currency || defaultCurrency;
        
        const image = product.mainImage || (product.images && product.images[0]);
        if (!image) return null;

        const link = `${SITE_URL}/products/${product.slug || product.id}`;
        const brandName = product.brand?.name || 'SHANFA';
        const categoryPath = product.subCategory
          ? `${product.subCategory.category?.name || ''} > ${product.subCategory.name}`
          : 'Health & Beauty > Personal Care > Skin Care';

        const descText = product.description || product.shortDescription || '';
        return `
  <item>
    <g:id>${escapeXml(product.id)}</g:id>
    <g:title><![CDATA[${product.name || ''}]]></g:title>
    <g:description><![CDATA[${descText}]]></g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:price>${price.toFixed(2)} ${currency}</g:price>
    ${discPrice ? `<g:sale_price>${discPrice.toFixed(2)} ${currency}</g:sale_price>` : ''}
    <g:condition>new</g:condition>
    <g:brand><![CDATA[${brandName}]]></g:brand>
    <g:product_type><![CDATA[${categoryPath}]]></g:product_type>
    <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Skin Care</g:google_product_category>
    ${product.tags && product.tags.length > 0 ? `<g:custom_label_0><![CDATA[${product.tags.slice(0, 3).join(',')}]]></g:custom_label_0>` : ''}
    ${product.hot ? '<g:custom_label_1>hot</g:custom_label_1>' : ''}
    ${product.trending ? '<g:custom_label_2>trending</g:custom_label_2>' : ''}
  </item>`;
      })
      .filter(Boolean)
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SHANFA - Meta Catalog Feed</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>SHANFA Product Catalog for Meta Ads</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('[Meta Feed] Error generating feed:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Feed generation failed</error>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
