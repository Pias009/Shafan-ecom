const NAQEL_API_URL = process.env.NAQEL_API_URL || "https://dev.gnteq.app";
const NAQEL_CUSTOMER_CODE = process.env.NAQEL_CUSTOMER_CODE || "NL123456";
const NAQEL_BRANCH_CODE = process.env.NAQEL_BRANCH_CODE || "NL567899";
const NAQEL_DEFAULT_PRODUCT_TYPE = "DLV"; // DLV = Delivery, RTN = Return

interface NaqelConfig {
  username: string;
  password: string;
}

let authToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string | null> {
  // Check if we have a valid token
  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

  const config: NaqelConfig = {
    username: process.env.NAQEL_USERNAME || "NaqelCustomer",
    password: process.env.NAQEL_PASSWORD || "n%A5E1Cust6mer",
  };

  try {
    const response = await fetch(`${NAQEL_API_URL}/api/identity/Authentication/GetToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      const data = await response.json();
      // Token is nested in data.token.access_token
      const tokenObj = data.token || data;
      authToken = tokenObj.access_token || tokenObj.accessToken;
      // Parse expiry from token or set default 55 min
      const expiresIn = tokenObj.expires_in;
      if (expiresIn && typeof expiresIn === 'number') {
        tokenExpiry = Date.now() + (expiresIn * 1000) - 5 * 60 * 1000; // 5 min buffer
      } else {
        tokenExpiry = Date.now() + 55 * 60 * 1000;
      }
      return authToken;
    }
  } catch (error) {
    console.error("Naqel auth error:", error);
  }

  return null;
}

export interface NaqelShipmentRequest {
  consignee: {
    consigneeContact: {
      personName: string;
      companyName?: string;
      phoneNumber1: string;
      phoneNumber2?: string;
      cellPhone: string;
      emailAddress: string;
      type?: string;
    };
    consigneeAddress: {
      countryCode: string;
      city: string;
      district?: string;
      line1: string;
      line2?: string;
      line3?: string;
      postCode?: string;
    };
  };
  shipper: {
    shipperAddress: {
      countryCode: string;
      city: string;
      line1: string;
      line2?: string;
      line3?: string;
      postCode?: string;
    };
    shipperContact: {
      personName: string;
      companyName?: string;
      phoneNumber1: string;
      phoneNumber2?: string;
      cellPhone: string;
      emailAddress: string;
    };
  };
  items: Array<{
    quantity: number;
    weight: { unit: number; value: number };
    customsValue: { currencyCode: string; value: number };
    goodsDescription: string;
    commodityCode?: string;
    countryOfOrigin?: string;
    packageType?: string;
  }>;
  shipmentWeight: {
    value: number;
    weightUnit: number;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: number;
  };
  descriptionOfGoods?: string;
  numberOfPieces?: string;
  cod?: number;
  productType?: string;
  labelFormat?: string;
  labelSize?: string;
  reference?: {
    shipperReference1?: string;
    shipperNote1?: string;
  };
}

export async function createNaqelShipment(request: NaqelShipmentRequest) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Failed to authenticate with Naqel");
  }

  const shipmentPayload = {
    customerCode: NAQEL_CUSTOMER_CODE,
    branchCode: NAQEL_BRANCH_CODE,
    supplierCode: NAQEL_CUSTOMER_CODE,
    shippingDateTime: new Date().toISOString(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    numberOfPieces: request.numberOfPieces || String(request.items?.length || 1),
    descriptionOfGoods: request.descriptionOfGoods || "Skincare Products",
    customsDeclaredValueCurrency: request.items?.[0]?.customsValue?.currencyCode || "AED",
    productType: request.productType || "DLV",
    labelFormat: request.labelFormat || "PDF",
    labelSize: request.labelSize || "6x4",
    includeLabel: true,
    includeOfficeDetails: true,
    ...request,
  };

  const payload = {
    model: [shipmentPayload]
  };

  console.log("Naqel shipment payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${NAQEL_API_URL}/api/gnconnect/Shipments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Naqel shipment error response:", error);
    throw new Error(`Naqel shipment error: ${error}`);
  }

  return response.json();
}

export async function trackNaqelShipment(airwaybill: string) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Failed to authenticate with Naqel");
  }

  const response = await fetch(`${NAQEL_API_URL}/api/gnconnect/Tracking`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      airwaybill,
      customerCode: NAQEL_CUSTOMER_CODE,
      branchCode: NAQEL_BRANCH_CODE,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Naqel tracking error: ${error}`);
  }

  return response.json();
}

export async function getNaqelLabel(airwaybill: string) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Failed to authenticate with Naqel");
  }

  const response = await fetch(`${NAQEL_API_URL}/api/gnconnect/Shipments/LabelPrint`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      airwaybills: [airwaybill],
      labelFormat: "PDF",
      labelSize: "6x4",
      customerCode: NAQEL_CUSTOMER_CODE,
      branchCode: NAQEL_BRANCH_CODE,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Naqel label error: ${error}`);
  }

  return response.json();
}

export default {
  createShipment: createNaqelShipment,
  trackShipment: trackNaqelShipment,
  getLabel: getNaqelLabel,
};