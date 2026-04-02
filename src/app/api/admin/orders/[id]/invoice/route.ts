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
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const billing = order.billingAddress as any;
    const shipping = order.shippingAddress as any;
    const customerName = order.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');

    function formatPrice(amountCents: number, currency: string): string {
      const code = currency?.toUpperCase() || 'USD';
      const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
      const amount = amountCents / 100;
      return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id.slice(-8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    html, body { width: 210mm; min-height: 297mm; font-family: Arial, sans-serif; padding: 15mm; color: #1a1a1a; }
    .invoice { width: 100%; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #000; }
    .logo { font-size: 32px; font-weight: bold; letter-spacing: 2px; }
    .invoice-number { font-size: 14px; color: #666; }
    .invoice-title { font-size: 40px; font-weight: bold; color: #000; text-align: right; }
    .meta { text-align: right; font-size: 11px; color: #666; margin-top: 10px; }
    .meta span { display: block; margin-bottom: 3px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px; }
    .address { font-size: 11px; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    th { text-align: left; background: #f8f8f8; padding: 10px 6px; font-weight: bold; border-bottom: 2px solid #000; text-transform: uppercase; font-size: 10px; }
    td { padding: 10px 6px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .product-name { font-weight: bold; }
    .qty { color: #666; }
    .totals { margin-top: 15px; width: 50%; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; }
    .totals-label { color: #666; }
    .totals-value { font-weight: bold; }
    .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">SHAFAN</div>
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="meta">
          <span><strong>Order #:</strong> ${order.id.slice(-8).toUpperCase()}</span>
          <span><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span><strong>Status:</strong> ${order.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
    
    <div class="grid">
      <div>
        <div class="section-title">Bill To</div>
        <div class="address">
          <strong>${customerName}</strong><br>
          ${billing?.address_1 || ''}<br>
          ${billing?.address_2 || ''}<br>
          ${billing?.city || ''}, ${billing?.state || ''} ${billing?.postcode || ''}<br>
          ${billing?.country || ''}
        </div>
      </div>
      <div>
        <div class="section-title">Ship To</div>
        <div class="address">
          <strong>${shipping?.first_name || ''} ${shipping?.last_name || ''}</strong><br>
          ${shipping?.address_1 || ''}<br>
          ${shipping?.address_2 || ''}<br>
          ${shipping?.city || ''}, ${shipping?.state || ''} ${shipping?.postcode || ''}<br>
          ${shipping?.country || ''}
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr>
              <td class="product-name">${item.nameSnapshot || item.product?.name || 'Unknown'}</td>
              <td class="text-right qty">${item.quantity}</td>
              <td class="text-right">${formatPrice(item.unitPriceCents, order.currency)}</td>
              <td class="text-right"><strong>${formatPrice(item.unitPriceCents * item.quantity, order.currency)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatPrice(order.subtotalCents, order.currency)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">Shipping</span>
        <span class="totals-value">${formatPrice(order.shippingCents || 0, order.currency)}</span>
      </div>
      ${order.discountCents > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Discount</span>
        <span class="totals-value" style="color: green;">-${formatPrice(order.discountCents, order.currency)}</span>
      </div>
      ` : ''}
      <div class="totals-row grand-total">
        <span>TOTAL</span>
        <span>${formatPrice(order.totalCents, order.currency)}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your order!</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.id.slice(-8)}.html"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}