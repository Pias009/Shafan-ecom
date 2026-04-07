import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import PDFDocument from 'pdfkit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminApiSession();
    console.log('[INVOICE] Session check:', session ? 'authenticated' : 'not authenticated');
    if (!session) {
      console.log('[INVOICE] No session - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await (prisma as any).order.findUnique({
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

    const billing = order.billingAddress as any;
    const shipping = order.shippingAddress as any;
    const customerName = order.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
    const customerEmail = order.user?.email || billing?.email || '';
    const customerPhone = billing?.phone || shipping?.phone || '';
    const paymentMethod = order.paymentMethodTitle || order.paymentMethod || 'N/A';
    const paymentStatus = order.paymentStatus || 'PAID';

    function formatPrice(amount: number, currency: string): string {
      const code = currency?.toUpperCase() || 'USD';
      const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
      return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    const paymentDueDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const taxValue = (order.total - order.subtotal - (order.shipping || 0) + (order.discount || 0));
    const tax = taxValue.toFixed(2);

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 50, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(`Invoice #: INV-${order.id.slice(-8).toUpperCase()}`, 50, 50, { align: 'right' });
        doc.text(`Order #: ${order.id.slice(-8).toUpperCase()}`, { align: 'right' });
        doc.text(`Date: ${orderDate}`, { align: 'right' });
        doc.text(`Time: ${orderTime}`, { align: 'right' });
        doc.text(`Status: ${paymentStatus}`, { align: 'right' });

        doc.moveDown();
        doc.fontSize(36).font('Helvetica-Bold').text('SHAFAN', 50, 50);
        doc.fontSize(10).font('Helvetica').text('Shafan Group Global Trading LLC', 50);
        doc.text('Dubai, United Arab Emirates', 50);
        doc.text('Email: shanfaglobal.it@gmail.com', 50);
        doc.text('Tel: +971 50 123 4567', 50);
        doc.text('TRN: 123456789012345', 50);

        doc.moveDown();
        doc.rect(50, 150, 495, 2).fill('#000');
        doc.moveDown();

        const billingAddr = [
          billing?.address_1 || '',
          billing?.address_2 || '',
          `${billing?.city || ''}, ${billing?.state || ''} ${billing?.postcode || ''}`,
          billing?.country || '',
        ].filter(Boolean).join(', ');

        const shippingAddr = [
          shipping?.address_1 || '',
          shipping?.address_2 || '',
          `${shipping?.city || ''}, ${shipping?.state || ''} ${shipping?.postcode || ''}`,
          shipping?.country || '',
        ].filter(Boolean).join(', ');

        const infoStartY = 170;
        doc.fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, infoStartY);
        doc.fontSize(10).font('Helvetica').text(customerName, 50);
        if (billingAddr) doc.text(billingAddr);
        if (customerEmail) doc.text(`Email: ${customerEmail}`);
        if (customerPhone) doc.text(`Phone: ${customerPhone}`);

        doc.fontSize(9).font('Helvetica-Bold').text('SHIP TO', 220, infoStartY);
        doc.fontSize(10).font('Helvetica').text(`${shipping?.first_name || ''} ${shipping?.last_name || ''}`, 220);
        if (shippingAddr) doc.text(shippingAddr);
        if (shipping?.phone) doc.text(`Phone: ${shipping.phone}`);

        doc.fontSize(9).font('Helvetica-Bold').text('ORDER INFO', 390, infoStartY);
        doc.fontSize(10).font('Helvetica').text(`Status: ${order.status.replace(/_/g, ' ')}`, 390);
        doc.text(`Payment: ${paymentMethod}`, 390);
        doc.text(`Currency: ${order.currency}`, 390);
        doc.text(`Due Date: ${paymentDueDate}`, 390);
        doc.text(`Store: ${order.store?.name || 'Online'}`, 390);
        if (order.trackingNumber) doc.text(`Tracking: ${order.trackingNumber}`, 390);

        doc.moveDown();
        const tableTop = 290;
        doc.rect(50, tableTop - 10, 495, 25).fill('#000');
        doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text('#', 55, tableTop - 2, { width: 30, align: 'center' });
        doc.text('Product', 90, tableTop - 2, { width: 200 });
        doc.text('Qty', 300, tableTop - 2, { width: 50, align: 'center' });
        doc.text('Unit Price', 360, tableTop - 2, { width: 80, align: 'right' });
        doc.text('Total', 450, tableTop - 2, { width: 80, align: 'right' });
        doc.fillColor('#000');

        let y = tableTop + 20;
        order.items.forEach((item: any, index: number) => {
          const itemName = item.nameSnapshot || item.product?.name || 'Unknown';
          const itemDetails = item.sku ? `SKU: ${item.sku}` : '';
          
          doc.fontSize(10).font('Helvetica').text(String(index + 1), 55, y, { width: 30, align: 'center' });
          doc.text(itemName + (itemDetails ? `\n${itemDetails}` : ''), 90, y, { width: 200 });
          doc.text(String(item.quantity), 300, y, { width: 50, align: 'center' });
          doc.text(formatPrice(item.unitPrice, order.currency), 360, y, { width: 80, align: 'right' });
          doc.text(formatPrice(item.unitPrice * item.quantity, order.currency), 450, y, { width: 80, align: 'right' });
          
          y += 25;
        });

        doc.moveDown();
        y += 20;
        const totalsX = 360;
        
        doc.fontSize(10).font('Helvetica').text('Subtotal', totalsX, y, { width: 80, align: 'right' });
        doc.text(formatPrice(order.subtotal, order.currency), 450, y, { width: 80, align: 'right' });
        y += 15;
        
        doc.text('Shipping', totalsX, y, { width: 80, align: 'right' });
        doc.text(formatPrice(order.shipping || 0, order.currency), 450, y, { width: 80, align: 'right' });
        y += 15;

        if ((order.discount || 0) > 0) {
          doc.text('Discount', totalsX, y, { width: 80, align: 'right' });
          doc.text(`-${formatPrice(order.discount || 0, order.currency)}`, 450, y, { width: 80, align: 'right' });
          y += 15;
        }

        if (parseFloat(tax) > 0) {
          doc.text('VAT (5%)', totalsX, y, { width: 80, align: 'right' });
          doc.text(formatPrice(taxValue, order.currency), 450, y, { width: 80, align: 'right' });
          y += 15;
        }

        y += 5;
        doc.rect(totalsX - 10, y, 200, 2).fill('#000');
        y += 15;
        doc.fontSize(14).font('Helvetica-Bold').text('TOTAL', totalsX, y, { width: 80, align: 'right' });
        doc.text(formatPrice(order.total, order.currency), 450, y, { width: 80, align: 'right' });

        y += 50;
        doc.rect(50, y, 495, 80).fill('#f0f0f0');
        y += 15;
        doc.fillColor('#000').fontSize(9).font('Helvetica-Bold').text('PAYMENT INFO', 60, y);
        
        doc.fontSize(10).font('Helvetica').text('Payment Method', 60, y + 30);
        doc.text(paymentMethod, 180, y + 30);
        
        doc.text('Payment Status', 60, y + 45);
        doc.text(paymentStatus, 180, y + 45);
        
        doc.text('Amount Paid', 60, y + 60);
        doc.text(formatPrice(order.totalCents, order.currency), 180, y + 60);

        const footerY = 700;
        doc.fontSize(9).font('Helvetica').text('Terms & Conditions:', 50, footerY);
        doc.text('• Goods once sold will not be returned or exchanged unless defective.', 50);
        doc.text('• Please inspect the goods upon delivery and report any damages within 24 hours.', 50);
        doc.text('• Prices are inclusive of VAT where applicable.', 50);
        doc.text('• For queries, contact us at shanfaglobal.it@gmail.com', 50);

        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Thank You for Shopping with SHAFAN!', 50, footerY + 80, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Your order is being processed and will be shipped soon.', 50, footerY + 100, { align: 'center' });

        doc.fontSize(9).text('Shafan Group Global Trading LLC | Dubai, UAE | shanfaglobal.it@gmail.com | +971 50 123 4567', 50, footerY + 130, { align: 'center' });
        doc.text('This is a computer-generated invoice. No signature required.', 50, footerY + 145, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
