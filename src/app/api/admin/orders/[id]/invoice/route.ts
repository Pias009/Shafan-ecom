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
        
        // Company Info
        doc.fontSize(9).font('Helvetica').fillColor('#666').text('Al Shanfa General Trading Co. L.L.C', 40, y);
        doc.text('Dubai, United Arab Emirates', 40, y + 12);
        doc.text('TRN: 104177488400003', 40, y + 24);
        
        // Invoice Title Box
        doc.rect(380, y - 5, 155, 55).fill('#1a1a1a');
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#fff').text('INVOICE', 380, y + 5, { align: 'center', width: 155 });
        doc.fontSize(8).font('Helvetica').fillColor('#ccc').text(`INV-${(order.id || '').slice(-8).toUpperCase()}`, 380, y + 22, { align: 'center', width: 155 });
        doc.text(`Date: ${orderDate}`, 380, y + 34, { align: 'center', width: 155 });

        y += 70;
        doc.rect(40, y, 495, 2).fill('#1a1a1a');
        y += 20;

        // ========== CUSTOMER INFO SECTION ==========
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('BILL TO', 40, y);
        doc.fontSize(11).font('Helvetica-Bold').text('SHIP TO', 210, y);
        doc.fontSize(11).font('Helvetica-Bold').text('ORDER DETAILS', 380, y);

        y += 12;
        
        // Bill To Details
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(customerName || 'Guest', 40, y);
        y += 14;
        
        const billingAddr = [
          (billing?.address_1 as string) || '',
          (billing?.address_2 as string) || '',
          `${(billing?.city as string) || ''}, ${(billing?.state as string) || ''} ${(billing?.postcode as string) || ''}`.trim(),
          (billing?.country as string) || '',
        ].filter(Boolean).join(', ');
        
        doc.fontSize(9).font('Helvetica').fillColor('#444');
        if (billingAddr) {
          doc.text(billingAddr, 40, y);
          y += 12;
        }
        if (customerEmail) {
          doc.text(customerEmail, 40, y);
          y += 12;
        }
        if (customerPhone) {
          doc.text(`Phone: ${customerPhone}`, 40, y);
          y += 12;
        }

        // Ship To Details
        let shipY = y - 36;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${(shipping?.first_name as string) || ''} ${(shipping?.last_name as string) || ''}`.trim() || customerName || 'Guest', 210, shipY);
        shipY += 14;
        
        const shippingAddr = [
          (shipping?.address_1 as string) || '',
          (shipping?.address_2 as string) || '',
          `${(shipping?.city as string) || ''}, ${(shipping?.state as string) || ''} ${(shipping?.postcode as string) || ''}`.trim(),
          (shipping?.country as string) || '',
        ].filter(Boolean).join(', ');
        
        doc.fontSize(9).font('Helvetica').fillColor('#444');
        if (shippingAddr) {
          doc.text(shippingAddr, 210, shipY);
          shipY += 12;
        }
        if (shipping?.phone) {
          doc.text(`Phone: ${shipping.phone}`, 210, shipY);
        }

        // Order Details
        let orderY = y - 36;
        doc.fontSize(9).font('Helvetica').fillColor('#444');
        doc.text(`Order #: ${(order.id || '').slice(-8).toUpperCase()}`, 380, orderY);
        orderY += 12;
        doc.text(`Payment: ${paymentMethod}`, 380, orderY);
        orderY += 12;
        doc.text(`Currency: ${(order.currency || 'USD').toUpperCase()}`, 380, orderY);
        
        // Update y to the max of all three columns
        y = Math.max(y + 24, shipY + 12, orderY + 12);
        
        y += 15;
        doc.rect(40, y, 495, 1).fill('#ddd');
        y += 20;

        // ========== ITEMS TABLE HEADER ==========
        doc.rect(40, y, 495, 28).fill('#1a1a1a');
        doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
        doc.text('#', 42, y + 9, { width: 20, align: 'center' });
        doc.text('DESCRIPTION', 62, y + 9, { width: 155 });
        doc.text('HS CODE', 170, y + 9, { width: 55, align: 'center' });
        doc.text('WEIGHT', 225, y + 9, { width: 45, align: 'center' });
        doc.text('QTY', 270, y + 9, { width: 35, align: 'center' });
        doc.text('UNIT PRICE', 310, y + 9, { width: 70, align: 'right' });
        doc.text('DISCOUNT', 385, y + 9, { width: 55, align: 'right' });
        doc.text('TAX', 445, y + 9, { width: 45, align: 'right' });
        doc.text('TOTAL', 495, y + 9, { width: 40, align: 'right' });
        
        y += 28;
        doc.fillColor('#000');

        // ========== ITEMS TABLE BODY ==========
        let tableY = y;
        const itemHeight = 24;
        
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
          
          // Row background
          if (index % 2 === 0) {
            doc.rect(40, tableY, 495, itemHeight).fill('#f8f8f8');
          }
          doc.rect(40, tableY, 495, itemHeight).stroke('#eee');
          
          // Item data
          doc.fillColor('#1a1a1a').fontSize(8).font('Helvetica');
          doc.text(String(index + 1), 42, tableY + 8, { width: 20, align: 'center' });
          doc.text(itemName, 62, tableY + 8, { width: 105 });
          doc.text(hsCode, 170, tableY + 8, { width: 55, align: 'center' });
          doc.text(`${itemWeight} ${itemWeightUnit}`, 225, tableY + 8, { width: 45, align: 'center' });
          doc.text(String(qty), 270, tableY + 8, { width: 35, align: 'center' });
          doc.text(formatPrice(price, order.currency || 'USD'), 310, tableY + 8, { width: 70, align: 'right' });
          doc.text(proportionalDiscount > 0 ? formatPrice(proportionalDiscount, order.currency || 'USD') : '-', 385, tableY + 8, { width: 55, align: 'right' });
          doc.text(itemTax > 0 ? formatPrice(itemTax, order.currency || 'USD') : '-', 445, tableY + 8, { width: 45, align: 'right' });
          doc.text(formatPrice(lineTotal, order.currency || 'USD'), 495, tableY + 8, { width: 40, align: 'right' });
          
          tableY += itemHeight;
        });

        y = tableY + 15;
        doc.rect(40, y, 495, 1).fill('#ddd');
        y += 15;

        // ========== TOTALS SECTION ==========
        const totalsX = 300;
        
        // Total Weight
        if (order.totalWeight) {
          doc.fontSize(10).font('Helvetica').fillColor('#444').text('Total Weight', totalsX, y, { width: 150, align: 'right' });
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${order.totalWeight.toFixed(2)} kg`, totalsX + 155, y, { width: 80, align: 'right' });
          y += 18;
        }

        // Amount Before Tax
        doc.fontSize(10).font('Helvetica').fillColor('#444').text('Total Amount Before Tax', totalsX, y, { width: 150, align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(formatPrice(amountBeforeTax, order.currency || 'USD'), totalsX + 155, y, { width: 80, align: 'right' });
        y += 18;
        
        // Discount
        if (discount > 0) {
          doc.fontSize(10).font('Helvetica').fillColor('#444').text('Discount', totalsX, y, { width: 150, align: 'right' });
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a').text(`-${formatPrice(discount, order.currency || 'USD')}`, totalsX + 155, y, { width: 80, align: 'right' });
          y += 18;
        }
        
        // Tax
        doc.fontSize(10).font('Helvetica').fillColor('#444').text(`Total Tax (${(taxRate * 100).toFixed(0)}%)`, totalsX, y, { width: 150, align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(formatPrice(taxValue, order.currency || 'USD'), totalsX + 155, y, { width: 80, align: 'right' });
        y += 18;
        
        // Shipping
        doc.fontSize(10).font('Helvetica').fillColor('#444').text('Shipping', totalsX, y, { width: 150, align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(formatPrice(shippingCost, order.currency || 'USD'), totalsX + 155, y, { width: 80, align: 'right' });
        y += 18;
        
        // Total Line
        y += 5;
        doc.rect(totalsX - 10, y, 245, 2).fill('#1a1a1a');
        y += 10;
        
        // Grand Total
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('TOTAL', totalsX, y, { width: 150, align: 'right' });
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text(formatPrice(total, (order.currency || 'USD').toUpperCase()), totalsX + 155, y, { width: 80, align: 'right' });

        y += 35;

        // ========== PAYMENT INFO BOX ==========
        doc.rect(40, y, 230, 65).fill('#f3f4f6').stroke('#e5e7eb');
        doc.rect(265, y, 230, 65).fill('#f3f4f6').stroke('#e5e7eb');
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text('PAYMENT SUMMARY', 50, y + 10);
        doc.fontSize(9).font('Helvetica').fillColor('#444');
        doc.text('Method:', 50, y + 28);
        doc.text('Status:', 50, y + 42);
        
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a').text(paymentMethod, 100, y + 28);
        
        const isPaid = order.paymentStatus === 'PAID';
        const isCOD = rawPaymentMethod.toLowerCase() === 'cod' || rawPaymentMethod.toLowerCase() === 'cash on delivery';
        let paymentStatusText: string;
        if (isPaid) {
          paymentStatusText = `PAID BY ${paymentMethod.toUpperCase()}`;
        } else if (isCOD) {
          paymentStatusText = 'PENDING';
        } else {
          paymentStatusText = order.paymentStatus === 'PENDING' ? 'PENDING' : 'UNPAID';
        }
        const paymentStatusColor = isPaid ? '#16a34a' : (isCOD ? '#d97706' : '#dc2626');
        doc.fontSize(9).font('Helvetica-Bold').fillColor(paymentStatusColor).text(paymentStatusText, 100, y + 42);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text('AMOUNT PAID', 275, y + 10);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text(formatPrice(total, order.currency || 'USD'), 275, y + 30);

        y += 85;

        // ========== FOOTER SECTION ==========
        doc.rect(40, y, 495, 1).fill('#ddd');
        y += 15;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text('Terms & Conditions', 40, y);
        y += 14;
        doc.fontSize(8).font('Helvetica').fillColor('#666');
        doc.text('• Returns accepted within 2 days of delivery.', 40, y);
        y += 11;
        doc.text('• Goods must be returned in original packaging with all tags and accessories.', 40, y);
        y += 11;
        doc.text('• Prices are inclusive of VAT where applicable.', 40, y);
        y += 11;
        doc.text('• For support, contact us at support@shanfaglobal.com', 40, y);

        y += 25;
        
        // Thank you message
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Thank You for Shopping with SHANFA GLOBAL!', 40, y, { align: 'center', width: 495 });
        y += 16;
        doc.fontSize(9).font('Helvetica').fillColor('#666').text('Your order is being processed and will be shipped soon.', 40, y, { align: 'center', width: 495 });

        y += 30;
        
        // Bottom footer
        doc.fontSize(8).fillColor('#999').text('Al Shanfa General Trading Co. L.L.C | Dubai, UAE | support@shanfaglobal.com | www.shanfaglobal.com', 40, y, { align: 'center', width: 495 });
        y += 12;
        doc.text('This is a computer-generated invoice. No signature required.', 40, y, { align: 'center', width: 495 });

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
