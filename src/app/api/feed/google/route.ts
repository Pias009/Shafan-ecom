import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all active products
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        price: true,
        discountPrice: true,
        images: true,
        stockQuantity: true,
        countryPrices: true,
      }
    });
    
    // Set up XML header and structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>Shanfa Global Products</title>\n`;
    xml += `    <link>https://shanfaglobal.com</link>\n`;
    xml += `    <description>Product feed for Shanfa Global</description>\n`;

    // Map each product to Google Merchant Center format
    for (const product of products) {
      const id = product.id;
      
      // Use CDATA for title and description to safely handle special characters
      const titleText = product.name || '';
      const title = `<![CDATA[${titleText}]]>`;
      
      const descText = product.description || titleText;
      const description = `<![CDATA[${descText}]]>`;
      
      let finalPrice = product.discountPrice || product.price || 0;
      
      // Attempt to get UAE specific price if the base price is 0
      if (finalPrice === 0 && product.countryPrices && product.countryPrices.length > 0) {
        const uaePrice = product.countryPrices.find((cp: any) => cp.country === 'AE' || cp.currency === 'AED');
        if (uaePrice && uaePrice.price != null) {
          finalPrice = uaePrice.price;
        }
      }

      const priceValue = parseFloat(finalPrice.toString()).toFixed(2);
      const price = `${priceValue} AED`;
      
      // Ensure image is a valid URL
      let imageLink = '';
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageLink = product.images[0] || '';
      }
      imageLink = imageLink ? imageLink.replace(/&/g, '&amp;') : '';
      
      const link = `https://shanfaglobal.com/products/${product.slug || id}`;
      const availability = (product.stockQuantity && product.stockQuantity > 0) ? 'in_stock' : 'out_of_stock';
      const condition = 'new';
      
      xml += `    <item>\n`;
      xml += `      <g:id>${id}</g:id>\n`;
      xml += `      <g:title>${title}</g:title>\n`;
      xml += `      <g:description>${description}</g:description>\n`;
      xml += `      <g:link>${link}</g:link>\n`;
      xml += `      <g:image_link>${imageLink}</g:image_link>\n`;
      xml += `      <g:price>${price}</g:price>\n`;
      xml += `      <g:availability>${availability}</g:availability>\n`;
      xml += `      <g:condition>${condition}</g:condition>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    // Return the response with proper headers
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });

  } catch (error) {
    console.error('Error generating Google product feed:', error);
    return new NextResponse('Error generating product feed', { status: 500 });
  }
}
