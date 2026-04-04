import { NextRequest, NextResponse } from "next/server";
import { getShippingRates, purchaseShippingLabel, getTrackingInfo, listCarriers, ShippoAddress, ShippoParcel } from "@/services/shipping/shippo";
import { shippingService } from "@/services/shipping";
import { aramexService } from "@/services/shipping/aramex";
import { createNaqelShipment, trackNaqelShipment, getNaqelLabel } from "@/services/shipping/naqel-api";
import { getAdminApiSession } from "@/lib/admin-api-session";

export const dynamic = "force-dynamic";

// POST /api/shipping - Shipping actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Rate calculation is public (needed at checkout)
    if (action === 'rates') {
      const { toAddress, parcel } = body;
      
      const rates: any[] = [];

      // Try Aramex first (real API)
      try {
        const aramexRate = await aramexService.calculateRate({
          country: toAddress.country,
          city: toAddress.city,
          weight: parcel.weight,
        });
        
        if (aramexRate && aramexRate.cost > 0) {
          rates.push({
            id: 'aramex-api',
            provider: 'Aramex',
            service: aramexRate.service || 'Express',
            amount: aramexRate.cost,
            currency: aramexRate.currency || 'AED',
            duration: aramexRate.estimatedDays ? `${aramexRate.estimatedDays} days` : '3-5 days',
            estimatedDays: aramexRate.estimatedDays || 3,
            rateId: 'aramex-api',
          });
        }
      } catch (e) {
        console.error("Aramex rate error:", e);
      }

      // If no rates from Aramex, try Shippo
      if (rates.length === 0) {
        try {
          const fromAddress: ShippoAddress = {
            name: process.env.SHIPPO_SHIPPER_NAME || 'Shafan Store',
            street1: process.env.SHIPPO_SHIPPER_ADDRESS || 'Dubai',
            city: process.env.SHIPPO_SHIPPER_CITY || 'Dubai',
            state: process.env.SHIPPO_SHIPPER_STATE || 'Dubai',
            zip: process.env.SHIPPO_SHIPPER_ZIP || '00000',
            country: process.env.SHIPPO_SHIPPER_COUNTRY || 'AE',
            phone: process.env.SHIPPO_SHIPPER_PHONE || '',
            email: process.env.SHIPPO_SHIPPER_EMAIL || '',
          };

          const shippoResult = await getShippingRates(fromAddress, toAddress, parcel);
          if (shippoResult.rates?.length > 0) {
            rates.push(...shippoResult.rates);
          }
        } catch (e) {
          console.error("Shippo rate error:", e);
        }
      }

      // Add Naqel as fallback option
      if (rates.length === 0 || process.env.NAQEL_USERNAME) {
        rates.push({
          id: 'naqel-dlv',
          provider: 'Naqel',
          service: 'Delivery (DLV)',
          amount: 25,
          currency: 'SAR',
          duration: '1-2 business days',
          estimatedDays: 2,
          rateId: 'naqel-dlv',
        });
      }

      // If still no rates, show placeholders
      if (rates.length === 0) {
        rates.push(
          {
            id: 'aramex-placeholder',
            provider: 'Aramex',
            service: 'Express Delivery',
            amount: 25,
            currency: 'AED',
            duration: '2-3 business days',
            estimatedDays: 3,
            rateId: 'aramex-placeholder',
          },
          {
            id: 'naqel-placeholder',
            provider: 'Naqel',
            service: 'Delivery (DLV)',
            amount: 20,
            currency: 'SAR',
            duration: '1-2 business days',
            estimatedDays: 2,
            rateId: 'naqel-dlv',
          }
        );
      }
      
      return NextResponse.json({ success: true, rates });
    }

    // All other actions require admin authentication
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    if (action === 'purchase') {
      const { rateId, rateData, shipmentData } = body;
      
      // Aramex
      if (rateId === 'aramex-api' || rateData?.provider === 'Aramex') {
        try {
          const result = await aramexService.createShipment({
            orderId: shipmentData?.orderId || 'ORDER',
            recipient: {
              name: shipmentData?.recipientName || 'Customer',
              phone: shipmentData?.phone || '',
              email: shipmentData?.email || '',
              address: {
                street: shipmentData?.address || '',
                city: shipmentData?.city || '',
                state: shipmentData?.state || '',
                country: shipmentData?.country || '',
                postalCode: shipmentData?.postalCode || '',
              },
            },
            items: shipmentData?.items || [],
          });
          
          if (result.success) {
            return NextResponse.json({
              success: true,
              provider: 'Aramex',
              trackingNumber: result.trackingNumber,
              trackingUrl: `https://www.aramex.com/track/${result.trackingNumber}`,
              labelUrl: result.labelUrl,
            });
          }
          return NextResponse.json({ error: result.error || 'Failed to create Aramex shipment' }, { status: 500 });
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Naqel
      if (rateId === 'naqel-dlv' || rateData?.provider === 'Naqel') {
        try {
          const result = await createNaqelShipment(shipmentData);
          return NextResponse.json({
            success: true,
            provider: 'Naqel',
            trackingNumber: result[0]?.airwaybillNumber || result[0]?.AWBNumber,
            trackingUrl: `https://www.naqel.com/track/${result[0]?.airwaybillNumber || result[0]?.AWBNumber}`,
            labelUrl: result[0]?.labelUrl || result[0]?.label,
          });
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Shippo
      const result = await purchaseShippingLabel(rateId);
      return NextResponse.json(result);
    }

    if (action === 'tracking') {
      const { trackingNumber, carrier } = body;
      
      // Aramex tracking
      if (carrier?.toLowerCase() === 'aramex') {
        try {
          const result = await aramexService.trackShipment(trackingNumber);
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Naqel tracking
      if (carrier?.toLowerCase() === 'naqel') {
        try {
          const result = await trackNaqelShipment(trackingNumber);
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Shippo tracking
      const result = await getTrackingInfo(trackingNumber, carrier);
      return NextResponse.json(result);
    }

    // Naqel shipment creation
    if (action === 'naqel-create') {
      try {
        const { shipmentData } = body;
        const result = await createNaqelShipment(shipmentData);
        return NextResponse.json({ success: true, ...result });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Naqel label
    if (action === 'naqel-label') {
      try {
        const { airwaybill } = body;
        const result = await getNaqelLabel(airwaybill);
        return NextResponse.json(result);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Aramex print label
    if (action === 'aramex-print-label') {
      try {
        const { trackingNumber } = body;
        const result = await aramexService.printLabel(trackingNumber);
        return NextResponse.json(result);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Aramex commercial invoice
    if (action === 'aramex-invoice') {
      try {
        const { trackingNumber } = body;
        const result = await aramexService.getCommercialInvoice(trackingNumber);
        return NextResponse.json(result);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Aramex rate test
    if (action === 'aramex-rate') {
      try {
        const { country, city, weight } = body;
        const result = await aramexService.calculateRate({ country, city, weight });
        return NextResponse.json(result);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    if (action === 'carriers') {
      const result = await listCarriers();
      return NextResponse.json({ carriers: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Shipping API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

// GET /api/shipping - Test endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Shipping API is ready',
    configured: {
      shippo: !!process.env.SHIPPO_API_KEY,
      aramex: !!process.env.ARAMEX_USER,
      naqel: !!process.env.NAQEL_USERNAME,
    }
  });
}