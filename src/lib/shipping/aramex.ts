const ARAXIS_URL = process.env.ARAMEX_USE_DEV === 'true'
  ? 'https://ws.aramex.net/shippingapi/shipping/service_1_0.svc'
  : 'https://ws.aramex.net/shippingapi/shipping/service_1_0.svc';

const ARAMEX_CREDENTIALS = {
  ClientInfo: {
    AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
    UserName: process.env.ARAMEX_USER_NAME,
    Password: process.env.ARAMEX_PASSWORD,
    AccountPin: process.env.ARAMEX_ACCOUNT_PIN,
  },
  Transaction: {
    Reference1: 'Shafan Order',
  },
};

const COUNTRY_CODES: Record<string, string> = {
  AE: 'AE',
  KW: 'KW',
  SA: 'SA',
  BH: 'BH',
  QA: 'QA',
  OM: 'OM',
  BD: 'BD',
};

const CITY_CODES: Record<string, string> = {
  AE: 'Dubai',
  KW: 'Kuwait',
  SA: 'Riyadh',
  BH: 'Manama',
  QA: 'Doha',
  OM: 'Muscat',
  BD: 'Dhaka',
};

export interface ShipmentData {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  productCode: string;
  weight: number;
  description: string;
  pieces: number;
  codAmount?: number;
}

export async function createAramexShipment(data: ShipmentData) {
  const { orderId, recipientName, recipientPhone, recipientEmail, recipientAddress, recipientCity, recipientCountry, productCode, weight, description, pieces, codAmount } = data;

  const countryCode = COUNTRY_CODES[recipientCountry.toUpperCase()] || recipientCountry.toUpperCase();
  const cityCode = CITY_CODES[recipientCountry.toUpperCase()] || recipientCity;

  const payload = {
    ...ARAMEX_CREDENTIALS,
    Shipments: [
      {
        Reference1: orderId,
        Reference2: '',
        Reference3: '',
        Shipper: {
          Name: process.env.ARAMEX_SHIPPER_NAME || 'Shafan Store',
          CompanyName: 'Al Shafa General Trading Co. L.L.C',
          PhoneNumber1: process.env.ARAMEX_SHIPPER_PHONE || '+971048387827',
          PhoneNumber1Ext: '',
          FaxNumber: '',
          EmailAddress: process.env.ARAMEX_SHIPPER_EMAIL || 'support@shanfaglobal.com',
          Street1: process.env.ARAMEX_SHIPPER_ADDRESS || 'Office 405, Al Diyafa Center, Satwa roundabout, Dubai',
          Street2: '',
          City: process.env.ARAMEX_SHIPPER_CITY || 'Dubai',
          StateOrProvinceCode: '',
          PostCode: '',
          CountryCode: process.env.ARAMEX_SHIPPER_COUNTRY || 'AE',
        },
        Consignee: {
          Name: recipientName,
          CompanyName: recipientName,
          PhoneNumber1: recipientPhone,
          PhoneNumber1Ext: '',
          FaxNumber: '',
          EmailAddress: recipientEmail,
          Street1: recipientAddress,
          Street2: '',
          City: cityCode,
          StateOrProvinceCode: '',
          PostCode: '',
          CountryCode: countryCode,
        },
        ShippingDateTime: new Date().toISOString(),
        DueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        Comments: description,
        PickupLocation: 'Reception',
        PickupGuid: '',
        NumberOfPieces: pieces,
        Weight: {
          Value: weight,
          Unit: 'kg',
        },
        ServiceType: productCode || 'PDS',
        ProductGroup: 'DOMESTIC',
        PaymentType: 'PREPAID',
        PaymentDetails: {
          PaymentMethod: 'CASH',
          Currency: countryCode === 'KW' ? 'KWD' : countryCode === 'SA' ? 'SAR' : countryCode === 'BH' ? 'BHD' : countryCode === 'QA' ? 'QAR' : countryCode === 'OM' ? 'OMR' : 'AED',
          AccountNumber: '',
          AccountPin: '',
          Amount: codAmount || 0,
        },
        CustomsValueAmount: 0,
        InsuranceAmount: 0,
        CollectAmount: codAmount || 0,
        Items: [],
      },
    ],
  };

  try {
    const response = await fetch(`${ARAXIS_URL}/CreateShipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Aramex API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Aramex shipment creation failed:', error);
    throw error;
  }
}

export async function trackAramexShipment(trackingNumber: string) {
  const payload = {
    ...ARAMEX_CREDENTIALS,
    getLastTrackingUpdateOnly: true,
    Shipments: [trackingNumber],
  };

  try {
    const response = await fetch(`${ARAXIS_URL}/TrackShipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Aramex tracking error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Aramex tracking failed:', error);
    throw error;
  }
}

export function getAramexCountries() {
  return Object.keys(COUNTRY_CODES);
}
