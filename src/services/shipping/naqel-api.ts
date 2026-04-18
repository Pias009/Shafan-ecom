/**
 * Naqel Express API Integration (GnTeq Shipping Engine)
 * Test environment: https://dev.gnteq.app
 * API docs: GnTeq Shipping Engine
 *
 * Credentials (test):
 *   userName:      NaqelCustomer
 *   password:      n%A5E1Cust6mer
 *   customerCode:  NL123456
 *   branchCode:    NL567899
 *   supplierCode:  NQL
 *   productType:   DLV (delivery) | RTN (return)
 */

const NAQEL_API_URL =
  process.env.NAQEL_API_URL || "https://dev.gnteq.app";
const NAQEL_CUSTOMER_CODE =
  process.env.NAQEL_CUSTOMER_CODE || "NL123456";
const NAQEL_BRANCH_CODE =
  process.env.NAQEL_BRANCH_CODE || "NL567899";
/** supplierCode is always "NQL" for Naqel (not the customer code) */
const NAQEL_SUPPLIER_CODE = "NQL";

// ---------------------------------------------------------------------------
// Auth – token cache
// ---------------------------------------------------------------------------

let _authToken: string | null = null;
let _tokenExpiry = 0;

async function getAuthToken(): Promise<string> {
  if (_authToken && Date.now() < _tokenExpiry) return _authToken;

  const res = await fetch(
    `${NAQEL_API_URL}/api/identity/Authentication/GetToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ⚠️  The API field is "userName" (capital N), not "username"
      body: JSON.stringify({
        userName: process.env.NAQEL_USERNAME || "NaqelCustomer",
        password: process.env.NAQEL_PASSWORD || "n%A5E1Cust6mer",
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Naqel auth failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  // Token object is at data.token or data directly
  const tokenObj = data.token ?? data;
  const token: string =
    tokenObj.access_token ?? tokenObj.accessToken ?? tokenObj.token;

  if (!token) {
    throw new Error(
      `Naqel auth: no access_token in response: ${JSON.stringify(data)}`
    );
  }

  const expiresIn: number =
    typeof tokenObj.expires_in === "number" ? tokenObj.expires_in : 3300;
  _authToken = token;
  _tokenExpiry = Date.now() + expiresIn * 1000 - 5 * 60 * 1000; // 5-min buffer

  return _authToken;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NaqelConsignee {
  consigneeContact: {
    personName: string;
    companyName?: string;
    phoneNumber1: string;
    phoneNumber2?: string;
    cellPhone: string;
    emailAddress: string;
    /** e.g. "Business" */
    type?: string;
    civilId?: string;
  };
  consigneeAddress: {
    /** 3-letter ISO country code, e.g. "ARE", "SAU" */
    countryCode: string;
    city: string;
    district?: string;
    line1: string;
    line2?: string;
    line3?: string;
    postCode?: string;
    longitude?: string;
    latitude?: string;
    locationCode1?: string;
    locationCode2?: string;
    locationCode3?: string;
    shortAddress?: string;
  };
}

export interface NaqelShipper {
  shipperAddress: {
    countryCode: string;
    city: string;
    line1: string;
    line2?: string;
    line3?: string;
    postCode?: string;
    longitude?: string;
    latitude?: string;
    locationCode1?: string;
    locationCode2?: string;
    locationCode3?: string;
  };
  shipperContact: {
    personName: string;
    companyName?: string;
    phoneNumber1: string;
    phoneNumber2?: string;
    cellPhone: string;
    emailAddress: string;
    type?: string;
  };
}

export interface NaqelItem {
  quantity: number;
  weight: { unit: number; value: number };
  customsValue: { currencyCode: string; value: number };
  goodsDescription: string;
  comments?: string;
  reference?: string;
  commodityCode?: string;
  countryOfOrigin?: string;
  packageType?: string;
  containsDangerousGoods?: boolean;
}

export interface NaqelShipmentRequest {
  /** Overrides the default customer code */
  customerCode?: string;
  /** Overrides the default branch code */
  branchCode?: string;
  airwaybillNumber?: string;
  shippingDateTime?: string;
  dueDate?: string;
  descriptionOfGoods?: string;
  foreignHAWB?: string;
  numberOfPieces?: string;
  /** Cash-on-delivery amount (0 if not COD) */
  cod?: number;
  customsDeclaredValue?: number;
  customsDeclaredValueCurrency?: string;
  /** ⚠️  Note the API typo: "codCurrnecy" (not "codCurrency") */
  codCurrnecy?: string;
  /** "DLV" for delivery, "RTN" for return */
  productType?: "DLV" | "RTN";
  /** e.g. "DDP" */
  dutyHandling?: string;
  labelFormat?: "PDF" | "ZPL";
  /** e.g. "4X6" */
  labelSize?: string;
  consignee: NaqelConsignee;
  shipper: NaqelShipper;
  items: NaqelItem[];
  shipmentWeight: {
    value: number;
    weightUnit: number;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: number;
  };
  reference?: {
    shipperReference1?: string;
    shipperNote1?: string;
  };
  includeLabel?: boolean;
  includeOfficeDetails?: boolean;
}

// ---------------------------------------------------------------------------
// Create Shipment
// ---------------------------------------------------------------------------

export async function createNaqelShipment(
  request: NaqelShipmentRequest
): Promise<any> {
  const token = await getAuthToken();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Build payload as a SINGLE OBJECT (not wrapped in model:[])
  const payload = {
    customerCode: request.customerCode ?? NAQEL_CUSTOMER_CODE,
    branchCode: request.branchCode ?? NAQEL_BRANCH_CODE,
    // supplierCode is always "NQL" – NOT the customer code
    supplierCode: NAQEL_SUPPLIER_CODE,
    airwaybillNumber: request.airwaybillNumber ?? "",
    shippingDateTime: request.shippingDateTime ?? now.toISOString(),
    dueDate: request.dueDate ?? tomorrow.toISOString(),
    descriptionOfGoods: request.descriptionOfGoods ?? "Skincare Products",
    foreignHAWB: request.foreignHAWB ?? "",
    numberOfPieces: request.numberOfPieces ?? String(request.items?.length ?? 1),
    cod: request.cod ?? 0,
    customsDeclaredValue: request.customsDeclaredValue ?? 10,
    customsDeclaredValueCurrency:
      request.customsDeclaredValueCurrency ?? "USD",
    // ⚠️  API typo: "codCurrnecy"
    codCurrnecy: request.codCurrnecy ?? request.customsDeclaredValueCurrency ?? "USD",
    productType: request.productType ?? "DLV",
    dutyHandling: request.dutyHandling ?? "DDP",
    labelFormat: request.labelFormat ?? "PDF",
    // ⚠️  Postman uses "4X6" (uppercase X)
    labelSize: request.labelSize ?? "4X6",
    consignee: request.consignee,
    shipper: request.shipper,
    items: request.items,
    shipmentWeight: request.shipmentWeight,
    reference: request.reference ?? { shipperReference1: "", shipperNote1: "" },
    includeLabel: request.includeLabel ?? true,
    includeOfficeDetails: request.includeOfficeDetails ?? true,
  };

  console.log("[Naqel] createShipment payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(`${NAQEL_API_URL}/api/gnconnect/Shipments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Naqel] createShipment error:", err);
    throw new Error(`Naqel shipment error (${res.status}): ${err}`);
  }

  const data = await res.json();
  console.log("[Naqel] createShipment response:", JSON.stringify(data, null, 2));
  return data;
}

// ---------------------------------------------------------------------------
// Track Shipment (single)
// ---------------------------------------------------------------------------

export async function trackNaqelShipment(airwaybill: string): Promise<any> {
  const token = await getAuthToken();

  const res = await fetch(`${NAQEL_API_URL}/api/gnconnect/Tracking`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      airwaybill,
      customerCode: NAQEL_CUSTOMER_CODE,
      branchCode: NAQEL_BRANCH_CODE,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Naqel tracking error (${res.status}): ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Bulk Track Shipments
// ---------------------------------------------------------------------------

export async function bulkTrackNaqelShipments(
  airwaybills: string[]
): Promise<any> {
  const token = await getAuthToken();

  const res = await fetch(
    `${NAQEL_API_URL}/api/gnconnect/Tracking/BulkTracking`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        airwaybills,
        customerCode: NAQEL_CUSTOMER_CODE,
        branchCode: NAQEL_BRANCH_CODE,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Naqel bulk tracking error (${res.status}): ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Print Label
// ---------------------------------------------------------------------------

export async function getNaqelLabel(airwaybill: string): Promise<any>;
export async function getNaqelLabel(airwaybills: string[]): Promise<any>;
export async function getNaqelLabel(
  airwaybillOrList: string | string[]
): Promise<any> {
  const token = await getAuthToken();

  const airwaybills = Array.isArray(airwaybillOrList)
    ? airwaybillOrList
    : [airwaybillOrList];

  const res = await fetch(
    `${NAQEL_API_URL}/api/gnconnect/Shipments/LabelPrint`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        airwaybills,
        labelFormat: "PDF",
        // ⚠️  Postman uses "labelsize" (all lowercase) and value "4X6"
        labelsize: "4X6",
        customerCode: NAQEL_CUSTOMER_CODE,
        branchCode: NAQEL_BRANCH_CODE,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Naqel label error (${res.status}): ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Default export (convenience object)
// ---------------------------------------------------------------------------

export default {
  createShipment: createNaqelShipment,
  trackShipment: trackNaqelShipment,
  bulkTrackShipments: bulkTrackNaqelShipments,
  getLabel: getNaqelLabel,
};