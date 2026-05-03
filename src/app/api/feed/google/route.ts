import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const SITE_URL = 'https://shanfaglobal.com';

// ─── Audit checklist ──────────────────────────────────────────────────────────
// ✅ Database   : .select() — only required fields, nested select on countryPrices
// ✅ Security   : No getServerSession / auth check — public endpoint
// ✅ Caching    : public, s-maxage=3600, stale-while-revalidate=86400
// ✅ Formatting : CDATA on all free-text fields (title, description)
// ✅ Pricing    : "85.00 AED" format
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // LAYER 1 — Database: lean select, no full includes
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id:            true,
        name:          true,
        slug:          true,
        description:   true,
        price:         true,
        discountPrice: true,
        images:        true,
        stockQuantity: true,
        countryPrices: {
          select: {
            country:  true,
            currency: true,
            price:    true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // LAYER 2 — Build XML
    const items = products.map((product) => {
      // Skip products with no usable price
      let finalPrice = product.discountPrice ?? product.price ?? 0;

      // Fallback: try AED country price if base price is 0
      if (finalPrice === 0 && product.countryPrices?.length > 0) {
        const aed = product.countryPrices.find(
          (cp) => cp.country === 'AE' || cp.currency === 'AED'
        );
        if (aed?.price != null) finalPrice = aed.price;
      }

      if (finalPrice <= 0) return ''; // skip unpriceable products

      // LAYER 5 — Pricing: "0.00 AED"
      const priceStr = `${parseFloat(finalPrice.toString()).toFixed(2)} AED`;

      // LAYER 4 — Formatting: CDATA for all free-text
      const titleText = product.name || '';
      const descText  = product.description || titleText;

      // Image — escape & in URLs only
      const rawImage   = Array.isArray(product.images) ? product.images[0] ?? '' : '';
      const imageLink  = rawImage.replace(/&/g, '&amp;');

      const link         = `${SITE_URL}/products/${product.slug || product.id}`;
      const availability = product.stockQuantity && product.stockQuantity > 0
        ? 'in_stock'
        : 'out_of_stock';

      return `    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${titleText}]]></g:title>
      <g:description><![CDATA[${descText}]]></g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:price>${priceStr}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
    </item>`;
    }).filter(Boolean).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Shanfa Global Products</title>
    <link>${SITE_URL}</link>
    <description>Product feed for Google Merchant Center</description>
${items}
  </channel>
</rss>`;

    // LAYER 3 — Caching: public + s-maxage + stale-while-revalidate with value
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type':  'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('[Google Feed] Error generating feed:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Feed generation failed</error>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
