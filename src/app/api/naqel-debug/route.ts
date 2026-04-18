import { NextResponse } from "next/server";
import { createNaqelShipment } from "@/services/shipping/naqel-api";

function sanitizePhone(phone: string | undefined | null): string {
  if (!phone) return "0000000000";
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || "0000000000";
}

export async function GET() {
  try {
    const numTotal = 10;
    const codValue = 0;
    const name = "Test User";
    const customerPhone = "0777777777";
    const countryIso3 = "ARE";

    const payload = {
      descriptionOfGoods: "Skincare / Beauty Products",
      numberOfPieces: "1",
      cod: codValue,
      customsDeclaredValue: numTotal,
      customsDeclaredValueCurrency: "USD",
      productType: "DLV" as const,
      reference: {
        shipperReference1: "TEST-001",
        shipperNote1: `Order #TEST-001`,
      },
      consignee: {
        consigneeContact: {
          personName: name,
          companyName: "",
          phoneNumber1: customerPhone,
          phoneNumber2: customerPhone,
          cellPhone: customerPhone,
          emailAddress: "customer@example.com",
          type: "Business",
          civilId: "",
        },
        consigneeAddress: {
          countryCode: countryIso3,
          city: "Dubai",
          district: "Dubai",
          line1: "N/A",
          line2: "",
          line3: "",
          postCode: "",
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
          countryCode: "SAU",
          city: "Riyadh",
          line1: "Office 405",
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
          personName: "Shafan Store",
          companyName: "Al Shanfa General Trading Co.",
          phoneNumber1: "0500000000",
          phoneNumber2: "0500000000",
          cellPhone: "0500000000",
          emailAddress: "info@shanfaglobal.com",
          type: "shipment",
        },
      },
      items: [
        {
          quantity: 1,
          weight: { unit: 1, value: 1 },
          customsValue: { currencyCode: "USD", value: numTotal },
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
        value: 1,
        weightUnit: 1,
        length: 20,
        width: 15,
        height: 10,
        dimensionUnit: 1,
      },
      includeLabel: true,
      includeOfficeDetails: true,
    };

    const result = await createNaqelShipment(payload);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
