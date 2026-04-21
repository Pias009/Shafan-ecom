/**
 * POST /api/admin/orders/[id]/dispatch
 * Body: { courier: "naqel" | "aramex", weight?: number, length?: number, width?: number, height?: number }
 *
 * Dispatches an order to the selected courier, saves the AWB/tracking code,
 * and updates the order status to IN_TRANSIT.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { createNaqelShipment } from "@/services/shipping/naqel-api";
import { OrderStatus } from "@prisma/client";

// ─── Country code helpers ─────────────────────────────────────────────────────
const ISO_MAP: Record<string, string> = {
  AE: "ARE", "UNITED ARAB EMIRATES": "ARE", "UAE": "ARE",
  SA: "SAU", "SAUDI ARABIA": "SAU", "KSA": "SAU",
  KW: "KWT", "KUWAIT": "KWT",
  BH: "BHR", "BAHRAIN": "BHR",
  QA: "QAT", "QATAR": "QAT",
  OM: "OMN", "OMAN": "OMN",
  US: "USA", "UNITED STATES": "USA", "USA": "USA",
  GB: "GBR", "UNITED KINGDOM": "GBR", "UK": "GBR",
  DE: "DEU", "GERMANY": "DEU",
  FR: "FRA", "FRANCE": "FRA",
  IN: "IND", "INDIA": "IND",
  PK: "PAK", "PAKISTAN": "PAK",
  EG: "EGY", "EGYPT": "EGY",
  JO: "JOR", "JORDAN": "JOR",
  LB: "LBN", "LEBANON": "LBN",
  TR: "TUR", "TURKEY": "TUR",
  PH: "PHL", "PHILIPPINES": "PHL",
  BD: "BGD", "BANGLADESH": "BGD",
};

function toIso3(code: string): string {
  if (!code) return "ARE";
  const upper = code.trim().toUpperCase();
  if (upper.length === 3 && Object.values(ISO_MAP).includes(upper)) return upper;
  return ISO_MAP[upper] || "ARE"; // Always return a valid 3-letter ISO code to prevent Naqel API crash
}

function sanitizePhone(phone: string | undefined | null): string {
  if (!phone) return "0000000000";
  // Keep only digits and the '+' sign
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || "0000000000";
}

// ─── Aramex helper ────────────────────────────────────────────────────────────
async function dispatchAramex(order: any, dimensions: any) {
  const shipping = order.shippingAddress || order.billingAddress || {};
  const name = shipping.first_name
    ? `${shipping.first_name} ${shipping.last_name || ""}`.trim()
    : order.user?.name || "Customer";
  
  const customerPhone = sanitizePhone(shipping.phone || order.user?.phone);

  const payload = {
    ClientInfo: {
      AccountCountryCode: "AE",
      AccountEntity: "DXB",
      AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
      AccountPin: process.env.ARAMEX_ACCOUNT_PIN,
      UserName: process.env.ARAMEX_USER_NAME,
      Password: process.env.ARAMEX_PASSWORD,
      Version: "v1.0",
    },
    LabelInfo: { ReportID: 9201, ReportType: "RPT" },
    Shipments: [
      {
        Shipper: {
          Reference1: order.id.slice(-8).toUpperCase(),
          AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
          PartyAddress: {
            Line1: process.env.ARAMEX_SHIPPER_ADDRESS || "Office 405, Al Diyafa Center",
            City: process.env.ARAMEX_SHIPPER_CITY || "Dubai",
            CountryCode: process.env.ARAMEX_SHIPPER_COUNTRY || "AE",
          },
          Contact: {
            PersonName: process.env.ARAMEX_SHIPPER_NAME || "SHANFA STORE",
            PhoneNumber1: process.env.ARAMEX_SHIPPER_PHONE || "+971000000000",
            EmailAddress: process.env.ARAMEX_SHIPPER_EMAIL || "info@shanfaglobal.com",
          },
        },
        Consignee: {
          Reference1: order.id.slice(-8).toUpperCase(),
          PartyAddress: {
            Line1: shipping.address_1 || "N/A",
            Line2: shipping.address_2 || "",
            City: shipping.city || "N/A",
            PostCode: shipping.postcode || "",
            CountryCode: (shipping.country || "AE").slice(0, 2).toUpperCase(),
          },
          Contact: {
            PersonName: name,
            PhoneNumber1: customerPhone,
            EmailAddress: shipping.email || order.user?.email || "customer@example.com",
          },
        },
        ShippingDateTime: new Date().toISOString(),
        DueDate: new Date(Date.now() + 86_400_000).toISOString(),
        Details: {
          Dimensions: {
            Length: dimensions.length,
            Width: dimensions.width,
            Height: dimensions.height,
            Unit: "CM",
          },
          ActualWeight: { Value: dimensions.weight, Unit: "KG" },
          ProductType: "PPX",
          PaymentType: "P",
          NumberOfPieces: 1,
          DescriptionOfGoods: "Skincare / Beauty Products",
          GoodsOriginCountry: "AE",
          CustomsValueAmount: { CurrencyCode: order.currency?.toUpperCase() || "AED", Value: order.total || 0 },
          CollectAmount: { CurrencyCode: "AED", Value: 0 },
          InsuranceAmount: { CurrencyCode: "AED", Value: 0 },
          CashOnDeliveryAmount: {
            CurrencyCode: order.currency?.toUpperCase() || "AED",
            Value: order.paymentMethod === "cod" ? order.total : 0,
          },
        },
      },
    ],
  };

  const baseUrl = process.env.ARAMEX_USE_DEV === "true"
    ? "https://ws.dev.aramex.net"
    : "https://ws.aramex.net";

  const res = await fetch(`${baseUrl}/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Aramex API error (${res.status}): ${err}`);
  }

  const data = await res.json();

  if (data.HasErrors) {
    const msgs = data.Notifications?.map((n: any) => n.Message).join(", ");
    throw new Error(`Aramex rejected shipment: ${msgs}`);
  }

  const shipment = data.Shipments?.[0];
  if (!shipment?.ID) {
    throw new Error(`Aramex returned no shipment ID: ${JSON.stringify(data)}`);
  }

  return {
    trackingCode: shipment.ID,
    trackingUrl: `https://www.aramex.com/track/results?ShipmentNumber=${shipment.ID}`,
    labelUrl: shipment.ShipmentLabel?.LabelURL || null,
    raw: data,
  };
}

// ─── Naqel helper ────────────────────────────────────────────────────────────
async function dispatchNaqel(order: any, dimensions: any) {
  const shipping = order.shippingAddress || order.billingAddress || {};
  const name = shipping.first_name
    ? `${shipping.first_name} ${shipping.last_name || ""}`.trim()
    : order.user?.name || "Customer";

  const countryIso3 = toIso3(shipping.country || "AE");
  const customerPhone = sanitizePhone(shipping.phone || order.user?.phone);

  const numTotal = Number(order.total) || 10;
  const codValue = order.paymentMethod?.toLowerCase() === "cod" ? numTotal : 0;

  const result = await createNaqelShipment({
    descriptionOfGoods: "Skincare / Beauty Products",
    numberOfPieces: "1",
    cod: codValue,
    customsDeclaredValue: numTotal,
    customsDeclaredValueCurrency: order.currency?.toUpperCase() || "USD",
    productType: "DLV",
    reference: {
      shipperReference1: order.id.slice(-8).toUpperCase(),
      shipperNote1: `Order #${order.id.slice(-8).toUpperCase()}`,
    },
    consignee: {
      consigneeContact: {
        personName: name,
        companyName: "",
        phoneNumber1: customerPhone,
        phoneNumber2: customerPhone, // Fill this just in case
        cellPhone: customerPhone,
        emailAddress: shipping.email || order.user?.email || "customer@example.com",
        type: "Business",
        civilId: "",
      },
      consigneeAddress: {
        countryCode: countryIso3,
        city: shipping.city || "Dubai",
        district: shipping.state || "Dubai",
        line1: shipping.address_1 || "N/A",
        line2: shipping.address_2 || "",
        line3: "",
        postCode: shipping.postcode || "",
        longitude: "",
        latitude: "",
        locationCode1: "",
        locationCode2: "",
        locationCode3: "",
        shortAddress: "",
      },
    },
    shipper: {
      shipperAddress: {
        countryCode: process.env.NAQEL_SHIPPER_COUNTRY || "SAU", // Must be SAU for test account
        city: process.env.NAQEL_SHIPPER_CITY || "Riyadh",
        line1: process.env.ARAMEX_SHIPPER_ADDRESS || "Office 405, Al Diyafa Center",
        line2: "",
        line3: "",
        postCode: "",
        longitude: "",
        latitude: "",
        locationCode1: "",
        locationCode2: "",
        locationCode3: "",
      },
      shipperContact: {
        personName: process.env.ARAMEX_SHIPPER_NAME || "SHANFA STORE",
        companyName: "Al Shanfa General Trading Co.",
        phoneNumber1: sanitizePhone(process.env.ARAMEX_SHIPPER_PHONE),
        phoneNumber2: sanitizePhone(process.env.ARAMEX_SHIPPER_PHONE),
        cellPhone: sanitizePhone(process.env.ARAMEX_SHIPPER_PHONE),
        emailAddress: process.env.ARAMEX_SHIPPER_EMAIL || "info@shanfaglobal.com",
        type: "shipment",
      },
    },
    items: [
      {
        quantity: Number(order.items?.length) || 1,
        weight: { unit: 1, value: Number(dimensions.weight) || 1 },
        customsValue: { currencyCode: order.currency?.toUpperCase() || "USD", value: numTotal },
        goodsDescription: "Skincare / Beauty Products",
        comments: "",
        reference: "",
        commodityCode: "62046200",
        countryOfOrigin: "ARE",
        packageType: "Box",
        containsDangerousGoods: false,
      },
    ],
    shipmentWeight: {
      value: Number(dimensions.weight) || 1,
      weightUnit: 1,
      length: Number(dimensions.length) || 20,
      width: Number(dimensions.width) || 15,
      height: Number(dimensions.height) || 10,
      dimensionUnit: 1,
    },
    includeLabel: true,
    includeOfficeDetails: true,
  });

  const shipment = Array.isArray(result) ? result[0] : result;
  const awb =
    shipment?.airwaybill ||
    shipment?.airwaybillNumber ||
    shipment?.AWBNumber ||
    shipment?.awb;

  if (!awb) {
    throw new Error(`Naqel returned no AWB: ${JSON.stringify(result)}`);
  }

  return {
    trackingCode: awb,
    trackingUrl: `https://www.naqelexpress.com/en/tracking?awb=${awb}`,
    labelUrl: shipment?.labelDownloadUrl || null,
    raw: result,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { courier, weight: bodyWeight, length = 20, width = 15, height = 10 } = body;

  if (!courier || !["naqel", "aramex", "shanfa"].includes(courier)) {
    return NextResponse.json(
      { error: "courier must be 'naqel', 'aramex', or 'shanfa'" },
      { status: 400 }
    );
  }

  // Load order
  const order = await (prisma as any).order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
      shipment: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Use body weight if provided, otherwise use order's totalWeight, otherwise default to 1
  const weight = bodyWeight !== undefined ? bodyWeight : (order.totalWeight || 1);
  const dimensions = { weight, length, width, height };

  try {
    let dispatchResult: { trackingCode: string; trackingUrl: string; labelUrl: string | null; raw: any };

    if (courier === "naqel") {
      dispatchResult = await dispatchNaqel(order, dimensions);
    } else if (courier === "aramex") {
      dispatchResult = await dispatchAramex(order, dimensions);
    } else {
      // Shanfa Local Delivery
      const trackingCode = `SHF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      dispatchResult = {
        trackingCode,
        trackingUrl: `https://www.shanfaglobal.com/track?id=${trackingCode}`, // Or any dummy internal link
        labelUrl: null,
        raw: { local: true }
      };
    }

    // Upsert shipment record
    const courierName = courier === "naqel" ? "Naqel Express" : courier === "aramex" ? "Aramex" : "Shanfa Delivery";
    const shipmentData = {
      courier: courierName,
      trackingCode: dispatchResult.trackingCode,
      trackingUrl: dispatchResult.trackingUrl,
      status: "Shipped",
    };

    if (order.shipment) {
      await (prisma as any).shipment.update({
        where: { orderId: id },
        data: shipmentData,
      });
    } else {
      await (prisma as any).shipment.create({
        data: { orderId: id, ...shipmentData },
      });
    }

    // Advance order status → IN_TRANSIT
    const canAdvance = [
      "ORDER_RECEIVED", "ORDER_CONFIRMED", "PROCESSING", "READY_FOR_PICKUP",
    ].includes(order.status);
    if (canAdvance) {
      await (prisma as any).order.update({
        where: { id },
        data: { status: OrderStatus.IN_TRANSIT },
      });
    }

    return NextResponse.json({
      ok: true,
      courier: courierName,
      trackingCode: dispatchResult.trackingCode,
      trackingUrl: dispatchResult.trackingUrl,
      labelUrl: dispatchResult.labelUrl,
      message: `Order dispatched via ${courierName} ✅`,
    });
  } catch (err: any) {
    console.error(`[dispatch/${courier}] error:`, err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
