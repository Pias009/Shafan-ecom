import { NextRequest, NextResponse } from "next/server";
import { getShippingRates, purchaseShippingLabel, getTrackingInfo, listCarriers, ShippoAddress, ShippoParcel } from "@/services/shipping/shippo";
import { shippingService } from "@/services/shipping";
import { aramexService } from "@/services/shipping/aramex";
import { createNaqelShipment, trackNaqelShipment, bulkTrackNaqelShipments, getNaqelLabel } from "@/services/shipping/naqel-api";
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
            name: process.env.SHIPPO_SHIPPER_NAME || 'SHANFA STORE',
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
          const addr = shipmentData;
          const naqelRequest = {
            descriptionOfGoods: "Skincare Products",
            cod: 0,
            customsDeclaredValue: 10,
            customsDeclaredValueCurrency: "USD",
            consignee: {
              consigneeContact: {
                personName: addr?.recipientName || "Customer",
                phoneNumber1: addr?.phone || "0000000000",
                cellPhone: addr?.phone || "0000000000",
                emailAddress: addr?.email || "customer@example.com",
                type: "Business",
              },
              consigneeAddress: {
                countryCode: addr?.country || "ARE",
                city: addr?.city || "Dubai",
                line1: addr?.address || "N/A",
                postCode: addr?.postalCode || "",
              },
            },
            shipper: {
              shipperAddress: {
                countryCode: process.env.NAQEL_SHIPPER_COUNTRY || "SAU",
                city: process.env.NAQEL_SHIPPER_CITY || "Riyadh",
                line1: process.env.NAQEL_SHIPPER_ADDRESS || "456 Street",
              },
              shipperContact: {
                personName: process.env.NAQEL_SHIPPER_NAME || "Shanfa Global",
                companyName: process.env.NAQEL_SHIPPER_COMPANY || "Shanfa Global Trading",
                phoneNumber1: process.env.NAQEL_SHIPPER_PHONE || "0000000000",
                cellPhone: process.env.NAQEL_SHIPPER_PHONE || "0000000000",
                emailAddress: process.env.NAQEL_SHIPPER_EMAIL || "info@shanfa.com",
              },
            },
            items: [
              {
                quantity: 1,
                weight: { unit: 1, value: 1 },
                customsValue: { currencyCode: "USD", value: 10 },
                goodsDescription: "Skincare Products",
                packageType: "Box",
                containsDangerousGoods: false,
              },
            ],
            shipmentWeight: { value: 1, weightUnit: 1, length: 20, width: 15, height: 10, dimensionUnit: 1 },
            reference: { shipperReference1: addr?.orderId || "", shipperNote1: "" },
          };
          const result = await createNaqelShipment(naqelRequest);
          // Naqel returns a single object (not array) with these fields:
          // { status, airwaybill, airwaybillId, shipmentLabel (base64), labelDownloadUrl (S3), ... }
          const shipment = Array.isArray(result) ? result[0] : result;
          const awb = shipment?.airwaybill || shipment?.airwaybillNumber || shipment?.AWBNumber || shipment?.awb;
          const labelUrl = shipment?.labelDownloadUrl || shipment?.labelUrl || shipment?.label || null;
          return NextResponse.json({
            success: true,
            provider: 'Naqel',
            trackingNumber: awb,
            trackingUrl: awb ? `https://www.naqelexpress.com/tracking/${awb}` : null,
            labelUrl,
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
      if (carrier?.toLowerCase().includes('aramex')) {
        try {
          const result = await aramexService.trackShipment(trackingNumber);
          return NextResponse.json(result);
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Naqel tracking
      if (carrier?.toLowerCase().includes('naqel')) {
        try {
          const result = await trackNaqelShipment(trackingNumber);
          
          // Normalize Naqel tracking response
          let events = [];
          if (Array.isArray(result)) {
            events = result;
          } else if (result?.trackingHistory) {
            events = result.trackingHistory;
          } else if (result?.events) {
            events = result.events;
          }

          return NextResponse.json({ success: true, events, raw: result });
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 });
        }
      }
      
      // Shippo tracking
      const result = await getTrackingInfo(trackingNumber, carrier);
      return NextResponse.json(result);
    }

    // Naqel shipment creation (direct, with pre-built NaqelShipmentRequest)
    if (action === 'naqel-create') {
      try {
        const { shipmentData } = body;
        const result = await createNaqelShipment(shipmentData);
        return NextResponse.json({ success: true, data: result });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Naqel bulk tracking
    if (action === 'naqel-bulk-tracking') {
      try {
        const { airwaybills } = body;
        if (!Array.isArray(airwaybills) || airwaybills.length === 0) {
          return NextResponse.json({ error: 'airwaybills array is required' }, { status: 400 });
        }
        const result = await bulkTrackNaqelShipments(airwaybills);
        return NextResponse.json({ success: true, data: result });
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