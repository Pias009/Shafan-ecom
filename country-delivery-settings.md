# Country-Based Delivery Settings

## Overview
Your website already has country-specific delivery settings configured. Here's what's available:

---

## Supported Countries & Delivery Rules

| Country | Min Order | Delivery Fee | Free Delivery Above |
|---------|-----------|--------------|---------------------|
| 🇦🇪 UAE | 80 AED | 15 AED | 150 AED |
| 🇰🇼 Kuwait | 12 KWD | 1.5 KWD | 18 KWD |
| 🇸🇦 Saudi Arabia | 159 SAR | 19 SAR | 359 SAR |
| 🇧🇭 Bahrain | 13 BHD | 1.99 BHD | 18 BHD |
| 🇴 Oman | 16 OMR | 1.9 OMR | 22 OMR |
| 🇶🇦 Qatar | 129 QAR | 19 QAR | 299 QAR |

---

## How It Works

1. **Cart Page** - Shows minimum order requirement based on selected country
2. **Checkout** - Calculates delivery fee automatically
3. **Free Delivery** - When order exceeds free delivery threshold, delivery is FREE
4. **Validation** - Blocks checkout if order is below minimum amount

---

## Features Already Implemented ✅

- ✅ Minimum order amount per country
- ✅ Delivery fee calculation per country
- ✅ Free delivery threshold per country
- ✅ Estimated delivery days per country
- ✅ Country-specific currency pricing
- ✅ Cart validation for minimum order
- ✅ Delivery fee display in checkout

---

## To Modify Settings

Contact developer to update these values in:
- `/src/lib/address-config.ts`

Current status: **FULLY IMPLEMENTED** ✅