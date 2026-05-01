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
        const categoryPath = product.subCategory
          ? `${product.subCategory.category?.name || ''} > ${product.subCategory.name}`
          : product.subCategory?.name || '';

         return `
  <item>
    <g:id>${escapeXml(product.id)}</g:id>
    <g:title>${escapeXml(product.name)}</g:title>
    <g:description>${escapeXml(product.description || product.shortDescription || '')}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:price>${product.price.toFixed(2)} ${product.currency || 'USD'}</g:price>
    ${product.discountPrice ? `<g:sale_price>${product.discountPrice.toFixed(2)} ${product.currency || 'USD'}</g:sale_price>` : ''}
    <g:condition>new</g:condition>
    <g:brand>${escapeXml(product.brand?.name || 'SHANFA')}</g:brand>
    <g:product_type>${escapeXml(categoryPath)}</g:product_type>
    <g:product_category>Health & Beauty > Personal Care > Skin Care</g:product_category>
    ${product.tags.length > 0 ? `<g:custom_label_0>${escapeXml(product.tags.slice(0, 3).join(','))}</g:custom_label_0>` : ''}
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
