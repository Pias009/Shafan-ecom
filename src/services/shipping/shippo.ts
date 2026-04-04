const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';
const SHIPPO_BASE_URL = 'https://api.goshippo.com';

async function shippoRequest(endpoint: string, method: string, body?: any) {
  const response = await fetch(`${SHIPPO_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shippo API error: ${error}`);
  }
  
  return response.json();
}

export interface ShippoAddress {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  length: number;
  width: number;
  height: number;
  distanceUnit: 'in' | 'cm';
  weight: number;
  massUnit: 'lb' | 'kg' | 'oz' | 'g';
}

export interface ShippoRate {
  id: string;
  provider: string;
  service: string;
  amount: number;
  currency: string;
  duration: string;
  estimatedDays: number;
  rateId: string;
}

export async function validateAddress(address: ShippoAddress) {
  return shippoRequest('/addresses', 'POST', {
    name: address.name,
    street1: address.street1,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    phone: address.phone,
    email: address.email,
    validate: true,
  });
}

export async function getShippingRates(
  fromAddress: ShippoAddress,
  toAddress: ShippoAddress,
  parcel: ShippoParcel
) {
  // Create from address
  const fromAddr = await shippoRequest('/addresses', 'POST', {
    ...fromAddress,
    validate: false,
  });

  // Create to address
  const toAddr = await shippoRequest('/addresses', 'POST', {
    ...toAddress,
    validate: false,
  });

  // Create parcel
  const parcelData = await shippoRequest('/parcels', 'POST', {
    length: parcel.length,
    width: parcel.width,
    height: parcel.height,
    distance_unit: parcel.distanceUnit,
    weight: parcel.weight,
    mass_unit: parcel.massUnit,
  });

  // Create shipment and get rates
  const shipment = await shippoRequest('/shipments', 'POST', {
    address_from: fromAddr.object_id,
    address_to: toAddr.object_id,
    parcels: [parcelData.object_id],
    async: false,
  });

  const rates: ShippoRate[] = (shipment.rates || []).map((rate: any) => ({
    id: rate.object_id,
    provider: rate.provider,
    service: rate.servicelevel?.name || rate.provider,
    amount: parseFloat(rate.amount),
    currency: rate.currency,
    duration: rate.duration_terms,
    estimatedDays: rate.estimated_days,
    rateId: rate.object_id,
  }));

  return {
    rates: rates.sort((a, b) => a.amount - b.amount),
    shipmentId: shipment.object_id,
  };
}

export async function purchaseShippingLabel(rateId: string) {
  const transaction = await shippoRequest('/transactions', 'POST', {
    rate: rateId,
    label_file_type: 'PDF',
    async: false,
  });

  return {
    success: transaction.status === 'SUCCESS',
    trackingNumber: transaction.tracking_number,
    trackingUrl: transaction.tracking_url_provider,
    labelUrl: transaction.label_url,
    transactionId: transaction.object_id,
    labelFormat: transaction.label_file_type,
  };
}

export async function getTrackingInfo(trackingNumber: string, carrier: string) {
  const tracking = await shippoRequest(`/tracks/${carrier}/${trackingNumber}`, 'GET');
  
  return {
    status: tracking.tracking_status?.status,
    statusDetails: tracking.tracking_status?.status_details,
    eta: tracking.eta,
    events: (tracking.tracking_status?.tracking_history || []).map((event: any) => ({
      status: event.status,
      location: event.location,
      datetime: event.datetime,
      message: event.message,
    })),
  };
}

export async function listCarriers() {
  const carriers = await shippoRequest('/carriers', 'GET');
  return carriers.results || [];
}

export default {
  validateAddress,
  getShippingRates,
  purchaseShippingLabel,
  getTrackingInfo,
  listCarriers,
};