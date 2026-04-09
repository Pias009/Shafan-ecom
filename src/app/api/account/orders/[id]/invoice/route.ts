import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPriceUnits } from '@/lib/product-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shipment: true,
        discount: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user ownership
    if (order.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Order does not belong to you' },
        { status: 403 }
      );
    }

    // Format data for invoice
    const invoiceData = {
      orderNumber: order.id.toUpperCase().slice(-8),
      orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      orderTime: new Date(order.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      
      // Customer Info
      customerEmail: order.email,
      customerPhone: order.billingAddress?.phone || '',
      
      // Billing Address
      billingAddress: {
        name: order.billingAddress?.name || '',
        street: order.billingAddress?.street || '',
        building: order.billingAddress?.building || '',
        city: order.billingAddress?.city || '',
        state: order.billingAddress?.state || '',
        postalCode: order.billingAddress?.postalCode || '',
        country: order.billingAddress?.country || '',
      },
      
      // Shipping Address
      shippingAddress: {
        name: order.shippingAddress?.name || '',
        street: order.shippingAddress?.street || '',
        building: order.shippingAddress?.building || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        postalCode: order.shippingAddress?.postalCode || '',
        country: order.shippingAddress?.country || '',
      },
      
      // Items
      items: order.items.map((item: any) => ({
        productCode: item.product?.sku || 'N/A',
        productName: item.nameSnapshot || item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: formatPriceUnits(item.unitPrice, order.currency),
        itemTotal: formatPriceUnits(item.unitPrice * item.quantity, order.currency),
        image: item.imageSnapshot || item.product?.images?.[0] || '/assets/placeholder.png',
      })),
      
      // Pricing
      subtotal: formatPriceUnits(order.subtotal, order.currency),
      shipping: formatPriceUnits(order.shipping || 0, order.currency),
      discount: order.discount > 0 ? formatPriceUnits(order.discount, order.currency) : '0.00',
      total: formatPriceUnits(order.total, order.currency),
      currency: order.currency,
      
      // Payment & Shipping
      paymentMethod: order.paymentMethodTitle || 'Card',
      paymentStatus: order.paymentStatus || 'PENDING',
      trackingCode: order.shipment?.trackingCode || 'Not yet assigned',
      courier: order.shipment?.courier || 'Not yet assigned',
      
      // Status
      status: order.status,
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
