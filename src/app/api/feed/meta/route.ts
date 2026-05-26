import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/placeholder.png`;

const SUPPORTED_COUNTRIES = ['AE', 'SA', 'KW', 'BH', 'OM', 'QA'] as const;
const CURRENCY_MAP: Record<string, string> = {
  AE: 'AED', SA: 'SAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', QA: 'QAR',
};
const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  QA: 'Qatar',
};

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
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        slug: true,
        images: true,
        mainImage: true,
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
        countryPrices: {
          where: { active: true },
          select: { country: true, price: true, discountPrice: true, currency: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }));

    const xmlItems = products
      .flatMap((product) => {
        const image = product.mainImage || (product.images && product.images[0]) || DEFAULT_IMAGE;
        const link = `${SITE_URL}/products/${product.slug || product.id}`;
        const brandName = product.brand?.name || 'SHANFA';
        const categoryPath = product.subCategory
          ? `${product.subCategory.category?.name || ''} > ${product.subCategory.name}`
          : 'Health & Beauty > Personal Care > Skin Care';
        const descText = product.description || product.shortDescription || '';

        // Organize country prices into a lookup
        const priceByCountry: Record<string, { price: number; discountPrice: number | null; currency: string }> = {};
        for (const cp of product.countryPrices || []) {
          priceByCountry[cp.country] = {
            price: Number(cp.price) || 0,
            discountPrice: cp.discountPrice ? Number(cp.discountPrice) : null,
            currency: cp.currency || CURRENCY_MAP[cp.country] || 'AED',
          };
        }

        // Generate one feed entry per country that has a valid price
        const entries: string[] = [];
        for (const country of SUPPORTED_COUNTRIES) {
          const cp = priceByCountry[country];

          // Skip if no country price exists or price is 0
          if (!cp || cp.price <= 0) continue;

          const countryLink = `${link}?store=${country}`;
          const currency = cp.currency || CURRENCY_MAP[country] || 'AED';

          entries.push(`
  <item>
    <g:id>${escapeXml(product.id)}_${country}</g:id>
    <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
    <g:title><![CDATA[${product.name || ''}]]></g:title>
    <g:description><![CDATA[${descText}]]></g:description>
    <g:link>${escapeXml(countryLink)}</g:link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:price>${cp.price.toFixed(2)} ${currency}</g:price>
    ${cp.discountPrice && cp.discountPrice > 0 ? `<g:sale_price>${cp.discountPrice.toFixed(2)} ${currency}</g:sale_price>` : ''}
    <g:condition>new</g:condition>
    <g:brand><![CDATA[${brandName}]]></g:brand>
    <g:product_type><![CDATA[${categoryPath}]]></g:product_type>
    <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Skin Care</g:google_product_category>
    <g:custom_label_0>${country}</g:custom_label_0>
    <g:custom_label_1>${COUNTRY_NAMES[country]}</g:custom_label_1>
    ${product.tags && product.tags.length > 0 ? `<g:custom_label_2><![CDATA[${product.tags.slice(0, 3).join(',')}]]></g:custom_label_2>` : ''}
    ${product.hot ? '<g:custom_label_3>hot</g:custom_label_3>' : ''}
    ${product.trending ? '<g:custom_label_4>trending</g:custom_label_4>' : ''}
  </item>`);
        }

        return entries;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SHANFA - Meta Catalog Feed</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>SHANFA Product Catalog for Meta Ads (Multi-Country)</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Last-Modified': new Date().toUTCString(),
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
