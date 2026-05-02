import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const { getAdminApiSession } = await import('@/lib/admin-session');
    const PDFDocument = (await import('pdfkit')).default;

    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
        store: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const billing = order.billingAddress as Record<string, unknown> | null;
    const shipping = order.shippingAddress as Record<string, unknown> | null;
    
    const customerName = order.user?.name 
      || (billing?.first_name ? `${billing.first_name} ${billing.last_name || ''}`.trim() : null)
      || 'Guest';
    
    const customerEmail = order.user?.email || (billing?.email as string) || '';
    const customerPhone = (billing?.phone as string) || (shipping?.phone as string) || '';
    const rawPaymentMethod = order.paymentMethodTitle || order.paymentMethod || '';
    
    function getDisplayPaymentMethod(method: string): string {
      const m = method.toLowerCase();
      if (m === 'cod' || m === 'cash on delivery' || m === 'cash_on_delivery') return 'Cash on Delivery';
      if (m === 'card' || m === 'stripe' || m === 'online') return 'Online Payment';
      return method;
    }
    
    const paymentMethod = getDisplayPaymentMethod(rawPaymentMethod);

    function formatPrice(amount: number, currency: string): string {
      const code = currency?.toUpperCase() || 'USD';
      const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
      return `${code} ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const subtotal = order.subtotal || 0;
    const shippingCost = order.shipping || 0;
    const discount = order.discount || 0;
    const total = order.total || 0;
    const taxRate = order.taxRate || 0;
    const taxValue = order.taxAmount || 0;
    const amountBeforeTax = subtotal + shippingCost - discount;

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== HEADER SECTION ==========
        let y = 35;
        const pageWidth = 595;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);
        
        // Company Info
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('Al Shanfa General Trading Co. L.L.C', margin, y);
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563').text('Dubai, United Arab Emirates', margin, y + 14);
        doc.text('TRN: 104177488400003', margin, y + 26);
        
        // Invoice Title Box (Modern Design)
        const titleBoxWidth = 160;
        const titleBoxX = pageWidth - margin - titleBoxWidth;
        doc.rect(titleBoxX, y - 5, titleBoxWidth, 60).fill('#111827');
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#FFFFFF').text('INVOICE', titleBoxX, y + 8, { align: 'center', width: titleBoxWidth });
        doc.fontSize(9).font('Helvetica').fillColor('#9CA3AF').text(`INV-${(order.id || '').slice(-8).toUpperCase()}`, titleBoxX, y + 28, { align: 'center', width: titleBoxWidth });
        doc.fontSize(9).font('Helvetica').fillColor('#FFFFFF').text(`Date: ${orderDate}`, titleBoxX, y + 40, { align: 'center', width: titleBoxWidth });

        y += 75;
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(1).strokeColor('#E5E7EB').stroke();
        y += 25;

        // ========== CUSTOMER & ORDER INFO SECTION (GRID) ==========
        const colGap = 20;
        const colWidth = (contentWidth - (colGap * 2)) / 3;
        
        const col1X = margin;
        const col2X = margin + colWidth + colGap;
        const col3X = margin + (colWidth + colGap) * 2;

        // Column Titles
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#6B7280').text('BILL TO', col1X, y);
        doc.text('SHIP TO', col2X, y);
        doc.text('ORDER DETAILS', col3X, y);

        y += 18;
        const infoStartY = y;
        let col1Y = infoStartY;
        let col2Y = infoStartY;
        let col3Y = infoStartY;

        // Column 1: Bill To
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text(customerName || 'Guest', col1X, col1Y, { width: colWidth });
        col1Y += doc.heightOfString(customerName || 'Guest', { width: colWidth }) + 4;
        
        const billingAddr = [
          (billing?.address_1 as string) || '',
          (billing?.address_2 as string) || '',
          `${(billing?.city as string) || ''}, ${(billing?.state as string) || ''} ${(billing?.postcode as string) || ''}`.trim(),
          (billing?.country as string) || '',
        ].filter(Boolean).join(', ');
        
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
        if (billingAddr) {
          doc.text(billingAddr, col1X, col1Y, { width: colWidth, lineGap: 2 });
          col1Y += doc.heightOfString(billingAddr, { width: colWidth, lineGap: 2 }) + 6;
        }
        if (customerEmail) {
          doc.text(customerEmail, col1X, col1Y, { width: colWidth });
          col1Y += 14;
        }
        if (customerPhone) {
          doc.text(`Phone: ${customerPhone}`, col1X, col1Y, { width: colWidth });
          col1Y += 14;
        }

        // Column 2: Ship To
        const shipName = `${(shipping?.first_name as string) || ''} ${(shipping?.last_name as string) || ''}`.trim() || customerName || 'Guest';
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text(shipName, col2X, col2Y, { width: colWidth });
        col2Y += doc.heightOfString(shipName, { width: colWidth }) + 4;
        
        const shippingAddr = [
          (shipping?.address_1 as string) || '',
          (shipping?.address_2 as string) || '',
          `${(shipping?.city as string) || ''}, ${(shipping?.state as string) || ''} ${(shipping?.postcode as string) || ''}`.trim(),
          (shipping?.country as string) || '',
        ].filter(Boolean).join(', ');
        
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
        if (shippingAddr) {
          doc.text(shippingAddr, col2X, col2Y, { width: colWidth, lineGap: 2 });
          col2Y += doc.heightOfString(shippingAddr, { width: colWidth, lineGap: 2 }) + 6;
        }
        if (shipping?.phone) {
          doc.text(`Phone: ${shipping.phone}`, col2X, col2Y, { width: colWidth });
          col2Y += 14;
        }

        // Column 3: Order Details
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
        const orderInfo = [
          { label: 'Order #:', value: (order.id || '').slice(-8).toUpperCase() },
          { label: 'Payment:', value: paymentMethod },
          { label: 'Currency:', value: (order.currency || 'USD').toUpperCase() },
          { label: 'Status:', value: order.status.replace(/_/g, ' ') }
        ];

        orderInfo.forEach(info => {
          doc.font('Helvetica-Bold').fillColor('#111827').text(info.label, col3X, col3Y, { width: 60 });
          doc.font('Helvetica').fillColor('#4B5563').text(String(info.value), col3X + 60, col3Y, { width: colWidth - 60 });
          col3Y += 14;
        });

        y = Math.max(col1Y, col2Y, col3Y) + 20;

        // ========== ITEMS TABLE SECTION ==========
        // Define Column Widths for the table
        const tableCols = {
          num: { x: margin, w: 25 },
          desc: { x: margin + 25, w: 165 },
          hs: { x: margin + 190, w: 55 },
          weight: { x: margin + 245, w: 50 },
          qty: { x: margin + 295, w: 30 },
          price: { x: margin + 325, w: 60 },
          disc: { x: margin + 385, w: 50 },
          tax: { x: margin + 435, w: 45 },
          total: { x: margin + 480, w: contentWidth - 440 }
        };

        // Table Header
        doc.rect(margin, y, contentWidth, 24).fill('#111827');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('#', tableCols.num.x, y + 8, { width: tableCols.num.w, align: 'center' });
        doc.text('DESCRIPTION', tableCols.desc.x, y + 8, { width: tableCols.desc.w });
        doc.text('HS CODE', tableCols.hs.x, y + 8, { width: tableCols.hs.w, align: 'center' });
        doc.text('WEIGHT', tableCols.weight.x, y + 8, { width: tableCols.weight.w, align: 'center' });
        doc.text('QTY', tableCols.qty.x, y + 8, { width: tableCols.qty.w, align: 'center' });
        doc.text('UNIT PRICE', tableCols.price.x, y + 8, { width: tableCols.price.w, align: 'right' });
        doc.text('DISCOUNT', tableCols.disc.x, y + 8, { width: tableCols.disc.w, align: 'right' });
        doc.text('TAX', tableCols.tax.x, y + 8, { width: tableCols.tax.w, align: 'right' });
        doc.text('TOTAL', tableCols.total.x, y + 8, { width: tableCols.total.w, align: 'right' });
        
        y += 24;
        
        // Table Body
        const totalItemsValue = (order.items || []).reduce((sum: number, item: Record<string, unknown>) => {
          const qty = (item.quantity as number) || 0;
          const price = (item.unitPrice as number) || 0;
          return sum + (price * qty);
        }, 0);

        (order.items || []).forEach((item: Record<string, unknown>, index: number) => {
          const itemName = (item.nameSnapshot as string) || ((item.product as Record<string, unknown>)?.name as string) || 'Unknown';
          const qty = (item.quantity as number) || 0;
          const price = (item.unitPrice as number) || 0;
          const itemWeight = (item.weightSnapshot as number) || 0;
          const itemWeightUnit = (item.weightUnitSnapshot as string) || 'kg';
          
          const itemLineValue = price * qty;
          const proportionalDiscount = totalItemsValue > 0 ? (itemLineValue / totalItemsValue) * discount : 0;
          const afterDiscount = itemLineValue - proportionalDiscount;
          const itemTax = afterDiscount * taxRate;
          const lineTotal = afterDiscount + itemTax;
          const hsCode = ((item.product as Record<string, unknown>)?.hsCode as string) || '33049901';
          
          // Row height calculation (based on description)
          const rowHeight = Math.max(24, doc.heightOfString(itemName, { width: tableCols.desc.w }) + 12);
          
          // Zebra striping
          if (index % 2 === 1) {
            doc.rect(margin, y, contentWidth, rowHeight).fill('#F9FAFB');
          }
          
          // Bottom border
          doc.moveTo(margin, y + rowHeight).lineTo(pageWidth - margin, y + rowHeight).lineWidth(0.5).strokeColor('#F3F4F6').stroke();
          
          // Item data
          doc.fillColor('#111827').fontSize(8).font('Helvetica');
          doc.text(String(index + 1), tableCols.num.x, y + 8, { width: tableCols.num.w, align: 'center' });
          doc.text(itemName, tableCols.desc.x, y + 8, { width: tableCols.desc.w });
          doc.text(hsCode, tableCols.hs.x, y + 8, { width: tableCols.hs.w, align: 'center' });
          doc.text(`${itemWeight} ${itemWeightUnit}`, tableCols.weight.x, y + 8, { width: tableCols.weight.w, align: 'center' });
          doc.text(String(qty), tableCols.qty.x, y + 8, { width: tableCols.qty.w, align: 'center' });
          doc.text(formatPrice(price, order.currency || 'USD'), tableCols.price.x, y + 8, { width: tableCols.price.w, align: 'right' });
          doc.text(proportionalDiscount > 0 ? formatPrice(proportionalDiscount, order.currency || 'USD') : '-', tableCols.disc.x, y + 8, { width: tableCols.disc.w, align: 'right' });
          doc.text(itemTax > 0 ? formatPrice(itemTax, order.currency || 'USD') : '-', tableCols.tax.x, y + 8, { width: tableCols.tax.w, align: 'right' });
          doc.text(formatPrice(lineTotal, order.currency || 'USD'), tableCols.total.x, y + 8, { width: tableCols.total.w, align: 'right' });
          
          y += rowHeight;
        });

        y += 20;

        // ========== TOTALS SECTION ==========
        const totalsWidth = 220;
        const totalsX = pageWidth - margin - totalsWidth;
        
        const drawTotalLine = (label: string, value: string, isBold = false, isAccent = false) => {
          doc.fontSize(isBold ? 10 : 9).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
          doc.fillColor(isAccent ? '#2563EB' : (isBold ? '#111827' : '#4B5563')).text(label, totalsX, y, { width: 130, align: 'right' });
          doc.fillColor(isAccent ? '#2563EB' : '#111827').text(value, totalsX + 135, y, { width: 85, align: 'right' });
          y += isBold ? 20 : 16;
        };

        if (order.totalWeight) {
          drawTotalLine('Total Weight:', `${order.totalWeight.toFixed(2)} kg`);
        }
        drawTotalLine('Subtotal:', formatPrice(subtotal, order.currency || 'USD'));
        if (discount > 0) {
          drawTotalLine('Discount:', `-${formatPrice(discount, order.currency || 'USD')}`);
        }
        drawTotalLine(`Tax (${(taxRate * 100).toFixed(0)}%):`, formatPrice(taxValue, order.currency || 'USD'));
        drawTotalLine('Shipping:', formatPrice(shippingCost, order.currency || 'USD'));
        
        y += 4;
        doc.moveTo(totalsX + 50, y).lineTo(pageWidth - margin, y).lineWidth(1).strokeColor('#111827').stroke();
        y += 10;
        
        drawTotalLine('GRAND TOTAL:', formatPrice(total, order.currency || 'USD'), true, true);

        y += 30;

        // ========== PAYMENT & STATUS SECTION ==========
        const boxWidth = (contentWidth - 20) / 2;
        doc.rect(margin, y, boxWidth, 60).fill('#F9FAFB');
        doc.rect(margin + boxWidth + 20, y, boxWidth, 60).fill('#F9FAFB');
        
        // Payment Summary
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text('PAYMENT SUMMARY', margin + 10, y + 10);
        doc.fontSize(8).font('Helvetica').fillColor('#4B5563').text('Method:', margin + 10, y + 26);
        doc.font('Helvetica-Bold').fillColor('#111827').text(paymentMethod, margin + 55, y + 26);
        doc.font('Helvetica').fillColor('#4B5563').text('Status:', margin + 10, y + 38);
        
        const isPaid = order.paymentStatus === 'PAID';
        const isCOD = rawPaymentMethod.toLowerCase() === 'cod' || rawPaymentMethod.toLowerCase() === 'cash on delivery';
        let paymentStatusText = isPaid ? 'PAID' : (isCOD ? 'CASH ON DELIVERY' : 'PENDING');
        const paymentStatusColor = isPaid ? '#059669' : (isCOD ? '#D97706' : '#DC2626');
        doc.font('Helvetica-Bold').fillColor(paymentStatusColor).text(paymentStatusText, margin + 55, y + 38);
        
        // Amount Paid
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text('AMOUNT PAID', margin + boxWidth + 30, y + 10);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563EB').text(formatPrice(total, order.currency || 'USD'), margin + boxWidth + 30, y + 26);

        y += 85;

        // ========== FOOTER SECTION ==========
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        y += 15;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('Terms & Conditions', margin, y);
        y += 14;
        doc.fontSize(8).font('Helvetica').fillColor('#6B7280');
        const terms = [
          '• Returns accepted within 2 days of delivery in original packaging.',
          '• Prices are inclusive of VAT where applicable.',
          '• For support, contact us at support@shanfaglobal.com'
        ];
        terms.forEach(term => {
          doc.text(term, margin, y);
          y += 11;
        });

        y += 20;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Thank You for Shopping with SHANFA GLOBAL!', margin, y, { align: 'center', width: contentWidth });
        y += 14;
        doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF').text('This is a computer-generated invoice. No signature required.', margin, y, { align: 'center', width: contentWidth });
        y += 10;
        doc.text('Al Shanfa General Trading Co. L.L.C | Dubai, UAE | support@shanfaglobal.com', margin, y, { align: 'center', width: contentWidth });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate invoice', details: message }, { status: 500 });
  }
}
