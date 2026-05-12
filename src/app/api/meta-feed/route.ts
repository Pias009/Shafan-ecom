import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        brand: true,
        productCategories: {
          include: {
            category: true
          }
        }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shanfaglobal.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Al Shanfa Global Product Feed</title>
    <link>${baseUrl}</link>
    <description>Dynamic product feed for Meta Commerce Manager</description>
`;

    for (const product of products) {
      const id = product.id;
      const title = escapeXml(product.name);
      const description = escapeXml(product.description || product.shortDescription || '');
      const imageLink = product.mainImage 
        ? (product.mainImage.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`)
        : '';
      const link = `${baseUrl}/products/${product.id}`;
      const price = `${product.price || 0} ${product.currency || 'AED'}`;
      const availability = product.stockQuantity > 0 ? 'in stock' : 'out of stock';
      const brand = escapeXml(typeof product.brand === 'string' ? product.brand : product.brand?.name || 'Al Shanfa');
      const category = escapeXml(product.productCategories?.[0]?.category?.name || 'Skincare');

      xml += `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:google_product_category>${category}</g:google_product_category>
    </item>
`;
    }

    xml += `  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Meta Feed Error:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}
