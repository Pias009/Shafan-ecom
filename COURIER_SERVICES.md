# Courier Services Documentation

## Overview

This document describes all courier/shipping integrations available in the Shafan E-commerce platform.

---

## 1. Aramex Courier

**Status:** Not configured  
**Purpose:** Primary courier for UAE, Bahrain, Oman, Qatar, Saudi Arabia

### Environment Variables Required

```env
ARAMEX_ACCOUNT_NUMBER="your_account_number"
ARAMEX_USER_NAME="your_username"
ARAMEX_PASSWORD="your_password"
ARAMEX_ACCOUNT_PIN="your_account_pin"
ARAMEX_SHIPPER_NAME="Shafan Store"
ARAMEX_SHIPPER_PHONE="+9714xxxxxxx"
ARAMEX_SHIPPER_EMAIL="shipping@shafan.com"
ARAMEX_SHIPPER_ADDRESS="Dubai, UAE"
ARAMEX_SHIPPER_CITY="Dubai"
ARAMEX_SHIPPER_COUNTRY="AE"
ARAMEX_ENTITY="DXB"  # Account entity
ARAMEX_USE_DEV=false  # Set to true for testing
```

### API Endpoints

- **Production:** `https://ws.aramex.net/ShippingAPI.V2/`
- **Development:** `https://ws.dev.aramex.net/ShippingAPI.V2/`

### Available Methods

| Method | Description |
|--------|-------------|
| `calculateRate()` | Calculate shipping rate |
| `createShipment()` | Create shipment & get tracking number |
| `printLabel()` | Generate shipping label PDF |
| `getCommercialInvoice()` | Generate commercial invoice |
| `trackShipment()` | Track shipment status |

### Usage

```typescript
import { aramexService } from '@/services/shipping/aramex';

const rate = await aramexService.calculateRate({
  city: 'Dubai',
  country: 'AE',
  weight: 1.0
});
```

---

## 2. Naqel Express (SOAP API)

**Status:** Not configured  
**Purpose:** Primary courier for Saudi Arabia, Kuwait

### Environment Variables Required

```env
NAQEL_USER_NAME="your_username"
NAQEL_PASSWORD="your_password"
NAQEL_API_KEY="your_api_key"
NAQEL_SHIPPER_NAME="Shafan Store"
NAQEL_SHIPPER_PHONE="+9665xxxxxxxx"
NAQEL_SHIPPER_ADDRESS="Riyadh, Saudi Arabia"
NAQEL_SHIPPER_CITY="Riyadh"
NAQEL_SHIPPER_COUNTRY="SA"
```

### API Endpoint

- **Demo:** `https://infotrack.naqelexpress.com/NaqelAPIServices/NaqelAPIDemo/9.0/XMLShippingService.asmx`

### Available Methods

| Method | Description |
|--------|-------------|
| `calculateRate()` | Calculate shipping rate |
| `createShipment()` | Create shipment |
| `trackShipment()` | Track shipment |

---

## 3. Naqel Express (New REST API)

**Status:** Not configured  
**Purpose:** Modern REST API for Naqel integration

### Environment Variables Required

```env
NAQEL_USERNAME="your_username"
NAQEL_PASSWORD="your_password"
NAQEL_CUSTOMER_CODE="NL123456"
NAQEL_BRANCH_CODE="NL567899"
NAQEL_API_URL="https://dev.gnteq.app"  # Use production URL in live
```

### API Endpoints

- **Development:** `https://dev.gnteq.app`
- **Production:** `https://prod.gnteq.app`

### Authentication

Uses OAuth2 token-based authentication:
- Token endpoint: `/api/identity/Authentication/GetToken`
- Token valid for ~55 minutes, auto-refreshed

### Available Methods

| Method | Description |
|--------|-------------|
| `createNaqelShipment()` | Create shipment with label |
| `trackNaqelShipment()` | Track shipment by airwaybill |
| `getNaqelLabel()` | Get label PDF |

---

## 4. Shippo

**Status:** Not configured  
**Purpose:** Multi-carrier shipping rates (US-based)

### Environment Variables Required

```env
SHIPPO_API_KEY="shippo_test_xxxxxxxxxxxx"
```

### API Endpoint

- **Base URL:** `https://api.goshippo.com`

### Available Methods

| Method | Description |
|--------|-------------|
| `validateAddress()` | Validate address |
| `getShippingRates()` | Get rates from multiple carriers |
| `purchaseShippingLabel()` | Purchase shipping label |
| `getTrackingInfo()` | Track shipment |
| `listCarriers()` | List available carriers |

---

## Country Carrier Mapping

| Country | Primary Carrier | Secondary Carrier |
|---------|-----------------|-------------------|
| UAE | Aramex | Naqel |
| Saudi Arabia | Naqel | Aramex |
| Kuwait | Naqel | Aramex |
| Bahrain | Aramex | Naqel |
| Oman | Aramex | Naqel |
| Qatar | Aramex | Naqel |
| Egypt | Aramex | - |
| Jordan | Aramex | - |
| Lebanon | Aramex | - |
| Iraq | Naqel | - |

---

## How to Test Courier Connections

Run the following script to check configuration:

```bash
npx tsx -e "
import { aramexService } from './src/services/shipping/aramex';
import { naqelService } from './src/services/shipping/naqel';
// Check environment variables
console.log('Aramex:', process.env.ARAMEX_ACCOUNTNO ? 'CONFIGURED' : 'NOT SET');
console.log('Naqel:', process.env.NAQEL_USER_NAME ? 'CONFIGURED' : 'NOT SET');
"
```

---

## Order Flow Integration

1. Customer places order → `create-order` API
2. Order created with `shippingCents` calculated from address config
3. Admin can create shipment via admin panel
4. System calls courier API to create shipment
5. Tracking number stored in order
6. Customer can track via order details page

---

## Shipping Rate Calculation

Rates are calculated based on:
- **Fixed rates:** Configured in `address-config.ts` per country
- **Dynamic rates:** Using courier APIs (if configured)

### Fixed Rate Configuration

Located in `src/lib/address-config.ts`:

```typescript
export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  AE: {
    code: 'AE',
    currency: 'AED',
    minOrderCents: 80,
    deliveryFeeCents: 15,
    freeDeliveryCents: 150,
  },
  // ... other countries
};
```

---

## Troubleshooting

### Aramex Issues
- Verify account credentials with Aramex portal
- Check `ARAMEX_USE_DEV` is false for production
- Ensure account entity matches your region

### Naqel Issues  
- SOAP API is deprecated, prefer new REST API
- Verify credentials match Naqel merchant portal
- Check customer code and branch code are correct

### Shippo Issues
- Shippo keys are environment-specific (test vs live)
- Verify account is active in Shippo dashboard
