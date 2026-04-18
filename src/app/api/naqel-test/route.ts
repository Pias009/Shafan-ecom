/**
 * NAQEL TEST ENDPOINT — DELETE BEFORE PRODUCTION
 * GET  /api/naqel-test?action=auth          → Test authentication, get token
 * GET  /api/naqel-test?action=create        → Create a test shipment, get AWB
 * GET  /api/naqel-test?action=track&awb=XX  → Track an AWB
 * GET  /api/naqel-test?action=label&awb=XX  → Get label PDF URL for AWB
 */

import { NextRequest, NextResponse } from "next/server";

const NAQEL_API_URL = "https://dev.gnteq.app";
const NAQEL_CUSTOMER_CODE = "NL123456";
const NAQEL_BRANCH_CODE = "NL567899";

async function getToken(): Promise<string> {
  const res = await fetch(
    `${NAQEL_API_URL}/api/identity/Authentication/GetToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "NaqelCustomer",
        password: "n%A5E1Cust6mer",
      }),
    }
  );
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = await res.json();
  const tokenObj = data.token ?? data;
  return tokenObj.access_token ?? tokenObj.accessToken ?? tokenObj.token;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "auth";
  const awb = req.nextUrl.searchParams.get("awb") || "";

  try {
    // ── 1. Auth only ────────────────────────────────────────────────────────
    if (action === "auth") {
      const token = await getToken();
      return NextResponse.json({
        ok: true,
        message: "Authentication successful ✅",
        tokenPreview: token.slice(0, 60) + "…",
      });
    }

    // ── 2. Create test shipment → get AWB ───────────────────────────────────
    if (action === "create") {
      const token = await getToken();

      const payload = {
        customerCode: NAQEL_CUSTOMER_CODE,
        branchCode: NAQEL_BRANCH_CODE,
        supplierCode: "NQL",
        airwaybillNumber: "",
        shippingDateTime: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
        descriptionOfGoods: "Skincare Products (Test)",
        foreignHAWB: "",
        numberOfPieces: "1",
        cod: 0,
        customsDeclaredValue: 10,
        customsDeclaredValueCurrency: "USD",
        codCurrnecy: "USD",            // ⚠️ API typo — intentional
        productType: "DLV",
        dutyHandling: "DDP",
        labelFormat: "PDF",
        labelSize: "4X6",
        consignee: {
          consigneeContact: {
            personName: "NaqelTestConsignee",
            companyName: "",
            phoneNumber1: "0777777777",
            phoneNumber2: "0777777777",
            cellPhone: "0777777777",
            emailAddress: "test@gmail.com",
            type: "Business",
            civilId: "",
          },
          consigneeAddress: {
            countryCode: "ARE",
            city: "Sharjah",
            district: "Test",
            line1: "123 Main Street",
            line2: "Apt 1",
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
            line1: "456 Street",
            line2: "Warehouse",
            line3: "Building XYZ",
            postCode: "",
            longitude: "",
            latitude: "",
            locationCode1: "",
            locationCode2: "",
            locationCode3: "",
          },
          shipperContact: {
            personName: "Shanfa Global",
            companyName: "Shanfa Global Trading",
            phoneNumber1: "0789999999",
            phoneNumber2: "0789999999",
            cellPhone: "0789999999",
            emailAddress: "info@shanfa.com",
            type: "shipment",
          },
        },
        items: [
          {
            quantity: 1,
            weight: { unit: 1, value: 1 },
            customsValue: { currencyCode: "USD", value: 50 },
            comments: "",
            reference: "",
            commodityCode: "62046200",
            goodsDescription: "Skincare Products",
            countryOfOrigin: "GBR",
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
        reference: {
          shipperReference1: "TEST-ORDER-001",
          shipperNote1: "Test shipment",
        },
        includeLabel: true,
        includeOfficeDetails: true,
      };

      const res = await fetch(`${NAQEL_API_URL}/api/gnconnect/Shipments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        return NextResponse.json({ ok: false, status: res.status, error: data }, { status: 200 });
      }

      const shipment = Array.isArray(data) ? data[0] : data;
      // Naqel returns: { status, airwaybill, airwaybillId, shipmentLabel (base64 PDF), labelDownloadUrl (S3) }
      const airwaybillNumber =
        shipment?.airwaybill ||
        shipment?.airwaybillNumber ||
        shipment?.AWBNumber ||
        shipment?.awb ||
        "Not found in response";

      return NextResponse.json({
        ok: true,
        message: "Shipment created ✅",
        airwaybillNumber,
        labelDownloadUrl: shipment?.labelDownloadUrl || null,
        status: shipment?.status || null,
        fullResponse: data,
        nextSteps: {
          track: `/api/naqel-test?action=track&awb=${airwaybillNumber}`,
          label: `/api/naqel-test?action=label&awb=${airwaybillNumber}`,
        },
      });
    }

    // ── 3. Track AWB ────────────────────────────────────────────────────────
    if (action === "track") {
      if (!awb) return NextResponse.json({ error: "AWB required: ?action=track&awb=XXXXXXX" }, { status: 400 });

      const token = await getToken();
      const res = await fetch(`${NAQEL_API_URL}/api/gnconnect/Tracking`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ airwaybill: awb, customerCode: NAQEL_CUSTOMER_CODE, branchCode: NAQEL_BRANCH_CODE }),
      });

      const data = await res.json();
      return NextResponse.json({ ok: res.ok, awb, trackingData: data });
    }

    // ── 4. Print label ──────────────────────────────────────────────────────
    if (action === "label") {
      if (!awb) return NextResponse.json({ error: "AWB required: ?action=label&awb=XXXXXXX" }, { status: 400 });

      const token = await getToken();
      const res = await fetch(`${NAQEL_API_URL}/api/gnconnect/Shipments/LabelPrint`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          airwaybills: [awb],
          labelFormat: "PDF",
          labelsize: "4X6",          // ⚠️ lowercase "labelsize" — API quirk
          customerCode: NAQEL_CUSTOMER_CODE,
          branchCode: NAQEL_BRANCH_CODE,
        }),
      });

      const data = await res.json();
      return NextResponse.json({ ok: res.ok, awb, labelData: data });
    }

    return NextResponse.json({
      usage: {
        "Test auth":           "GET /api/naqel-test?action=auth",
        "Create shipment+AWB": "GET /api/naqel-test?action=create",
        "Track AWB":           "GET /api/naqel-test?action=track&awb=YOUR_AWB",
        "Get label PDF":       "GET /api/naqel-test?action=label&awb=YOUR_AWB",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
