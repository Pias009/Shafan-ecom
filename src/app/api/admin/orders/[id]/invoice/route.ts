import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
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

    function formatPrice(amountCents: number, currency: string): string {
      const code = currency?.toUpperCase() || 'USD';
      const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
      const amount = Number(amountCents);
      return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    const paymentDueDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const subtotal = Number(order.subtotalCents);
    const shippingCost = Number(order.shippingCents || 0);
    const discount = Number(order.discountCents || 0);
    const total = Number(order.totalCents);
    const taxValue = (order.totalCents - order.subtotalCents - (order.shippingCents || 0) + (order.discountCents || 0));
    const tax = taxValue.toFixed(2);

    const itemsHtml = order.items.map((item: any, index: number) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666; font-size: 10px;">${index + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
          <strong style="font-size: 11px;">${item.nameSnapshot || item.product?.name || 'Unknown'}</strong>
          ${item.variant?.name ? `<br><span style="color: #888; font-size: 9px;">Variant: ${item.variant.name}</span>` : ''}
          ${item.sku ? `<br><span style="color: #888; font-size: 9px;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">${formatPrice(item.unitPriceCents, order.currency)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px;"><strong>${formatPrice(item.unitPriceCents * item.quantity, order.currency)}</strong></td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id.slice(-8).toUpperCase()} - SHAFAN</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    html, body { width: 210mm; min-height: 297mm; font-family: 'Segoe UI', Arial, sans-serif; padding: 12mm; color: #1a1a1a; background: #fff; }
    .invoice { width: 100%; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #000; }
    .company-info { flex: 1; }
    .logo { font-size: 36px; font-weight: 900; letter-spacing: 4px; color: #000; }
    .company-details { margin-top: 8px; font-size: 10px; color: #666; line-height: 1.6; }
    .invoice-box { text-align: right; }
    .invoice-title { font-size: 28px; font-weight: 700; color: #000; letter-spacing: 2px; }
    .invoice-number { font-size: 12px; color: #666; margin-top: 5px; }
    
    /* Info Grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 15px; }
    .info-box h4 { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    .info-box p { font-size: 10px; line-height: 1.6; color: #333; }
    .info-box strong { display: block; font-size: 11px; color: #000; }
    
    /* Status Badge */
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-failed { background: #f8d7da; color: #721c24; }
    
    /* Table */
    .section { margin-bottom: 25px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 10px; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; background: #fff; }
    thead th { background: #000; color: #fff; padding: 12px 8px; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; text-align: left; }
    thead th:nth-child(1) { width: 40px; text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    tbody tr:hover { background: #fafafa; }
    
    /* Totals */
    .totals-section { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 11px; }
    .totals-row.final { border-top: 2px solid #000; border-bottom: none; margin-top: 5px; padding-top: 12px; font-size: 16px; font-weight: 700; }
    .totals-label { color: #666; }
    .totals-value { font-weight: 600; }
    .totals-row.final .totals-label, .totals-row.final .totals-value { color: #000; }
    .discount { color: #28a745; }
    
    /* Payment Info */
    .payment-section { background: #f0f0f0; border-radius: 8px; padding: 15px; margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
    .payment-box h5 { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 5px; }
    .payment-box p { font-size: 11px; font-weight: 600; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .terms { font-size: 9px; color: #888; line-height: 1.6; margin-bottom: 15px; }
    .thank-you { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 20px; }
    .thank-you h3 { font-size: 18px; font-weight: 700; color: #000; margin-bottom: 5px; }
    .thank-you p { font-size: 11px; color: #666; }
    .contact-info { text-align: center; margin-top: 15px; font-size: 10px; color: #888; }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="logo">SHAFAN</div>
        <div class="company-details">
          <p>Shafan Group Global Trading LLC</p>
          <p>Dubai, United Arab Emirates</p>
          <p>Email: shanfaglobal.it@gmail.com</p>
          <p>Tel: +971 50 123 4567</p>
          <p>TRN: 123456789012345</p>
        </div>
      </div>
      <div class="invoice-box">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">
          <strong>Invoice #:</strong> INV-${order.id.slice(-8).toUpperCase()}<br>
          <strong>Order #:</strong> ${order.id.slice(-8).toUpperCase()}<br>
          <strong>Date:</strong> ${orderDate}<br>
          <strong>Time:</strong> ${orderTime}<br>
          <span class="status-badge ${paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}">${paymentStatus}</span>
        </div>
      </div>
    </div>
    
    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-box">
        <h4>Bill To</h4>
        <strong>${customerName}</strong>
        <p>${billing?.address_1 || ''}</p>
        <p>${billing?.address_2 || ''}</p>
        <p>${billing?.city || ''}, ${billing?.state || ''} ${billing?.postcode || ''}</p>
        <p>${billing?.country || ''}</p>
        ${customerEmail ? `<p style="margin-top: 8px;"><strong>Email:</strong> ${customerEmail}</p>` : ''}
        ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
      </div>
      <div class="info-box">
        <h4>Ship To</h4>
        <strong>${shipping?.first_name || ''} ${shipping?.last_name || ''}</strong>
        <p>${shipping?.address_1 || ''}</p>
        <p>${shipping?.address_2 || ''}</p>
        <p>${shipping?.city || ''}, ${shipping?.state || ''} ${shipping?.postcode || ''}</p>
        <p>${shipping?.country || ''}</p>
        ${shipping?.phone ? `<p style="margin-top: 8px;"><strong>Phone:</strong> ${shipping?.phone}</p>` : ''}
      </div>
      <div class="info-box">
        <h4>Order Info</h4>
        <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ')}</p>
        <p><strong>Payment:</strong> ${paymentMethod}</p>
        <p><strong>Currency:</strong> ${order.currency}</p>
        <p><strong>Due Date:</strong> ${paymentDueDate}</p>
        <p><strong>Store:</strong> ${order.store?.name || 'Online'}</p>
        ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
      </div>
    </div>
    
    <!-- Items Table -->
    <div class="section">
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>
    
    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">${formatPrice(order.subtotalCents, order.currency)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">Shipping</span>
          <span class="totals-value">${formatPrice(order.shippingCents || 0, order.currency)}</span>
        </div>
        ${discount > 0 ? `
        <div class="totals-row">
          <span class="totals-label">Discount</span>
          <span class="totals-value discount">-${formatPrice(order.discountCents || 0, order.currency)}</span>
        </div>
        ` : ''}
        ${parseFloat(tax) > 0 ? `
        <div class="totals-row">
          <span class="totals-label">VAT (5%)</span>
          <span class="totals-value">${formatPrice(taxValue, order.currency)}</span>
        </div>
        ` : ''}
        <div class="totals-row final">
          <span class="totals-label">TOTAL</span>
          <span class="totals-value">${formatPrice(order.totalCents, order.currency)}</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Info -->
    <div class="payment-section">
      <div class="payment-box">
        <h5>Payment Method</h5>
        <p>${paymentMethod}</p>
      </div>
      <div class="payment-box">
        <h5>Payment Status</h5>
        <p>${paymentStatus}</p>
      </div>
      <div class="payment-box">
        <h5>Amount Paid</h5>
        <p>${formatPrice(order.totalCents, order.currency)}</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        • Goods once sold will not be returned or exchanged unless defective.<br>
        • Please inspect the goods upon delivery and report any damages within 24 hours.<br>
        • Prices are inclusive of VAT where applicable.<br>
        • For queries, contact us at shanfaglobal.it@gmail.com
      </div>
      
      <div class="thank-you">
        <h3>Thank You for Shopping with SHAFAN!</h3>
        <p>Your order is being processed and will be shipped soon.</p>
      </div>
      
      <div class="contact-info">
        <p>Shafan Group Global Trading LLC | Dubai, UAE | shanfaglobal.it@gmail.com | +971 50 123 4567</p>
        <p style="margin-top: 5px;">This is a computer-generated invoice. No signature required.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(-8)}.html"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
