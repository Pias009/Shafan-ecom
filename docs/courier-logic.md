# Courier Logic Implementation

## Overview
The system now automatically determines which courier service should handle an order based on the shipping address:

1. **Kuwait Courier Service**: For orders shipping to Kuwait
2. **Global Courier Service**: For orders shipping to any other country

## How It Works

### 1. Order Creation
When an order is created through either:
- `POST /api/create-order`
- `POST /api/checkout`

The system automatically:
1. Extracts the shipping address country from the order data
2. Determines the appropriate courier using the `determineCourier()` function
3. Creates a shipment record with the selected courier
4. Generates a unique tracking code

### 2. Courier Determination Logic
```typescript
function determineCourier(shippingAddress: any): string {
  if (!shippingAddress || !shippingAddress.country) {
    return "GLOBAL_COURIER"; // Default to global courier
  }

  const country = shippingAddress.country.toString().toLowerCase().trim();
  
  // Check if the order is from Kuwait
  if (country === "kuwait" || country === "kw") {
    return "KUWAIT_COURIER";
  }
  
  return "GLOBAL_COURIER";
}
```

### 3. Shipment Creation
For every order, a `Shipment` record is created with:
- `courier`: Either "KUWAIT_COURIER" or "GLOBAL_COURIER"
- `trackingCode`: Unique code with prefix (KW for Kuwait, GL for Global)
- `trackingUrl`: Appropriate tracking URL based on courier
- `status`: Initially set to "Created"

### 4. Payment Handling
**Important**: Payment remains the same regardless of courier selection. The courier logic only affects shipping and delivery, not payment processing.

## Database Schema

### Shipment Model
```prisma
model Shipment {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId      String   @unique @db.ObjectId
  courier      String
  trackingCode String
  trackingUrl  String?
  status       String   @default("Created")
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API Responses

### Order Creation Response
Both order creation endpoints now return additional courier information:
```json
{
  "orderId": "abc123",
  "total": 99.99,
  "currency": "usd",
  "status": "PENDING_PAYMENT",
  "courier": "KUWAIT_COURIER",
  "trackingCode": "KW-ABC123-456789"
}
```

### Admin Orders API
The admin orders API (`GET /api/admin/orders`) now includes:
- `courier`: The assigned courier service
- `trackingCode`: The tracking code (if available)
- `shipmentStatus`: Current shipment status

## Testing

Run the test script to verify the logic:
```bash
npx tsx scripts/test-courier-logic.ts
```

## Future Enhancements

1. **Courier Configuration**: Allow admin to configure courier services in the dashboard
2. **Shipping Cost Calculation**: Different shipping costs per courier (currently payment remains the same)
3. **Courier API Integration**: Direct integration with courier APIs for automatic label generation
4. **Multiple Courier Support**: Support for multiple courier services per region

## Notes

- The system currently uses hardcoded tracking URLs. These should be configured via environment variables in production.
- Country detection is case-insensitive and accepts both full country names and ISO codes.
- Default fallback is Global Courier for any unrecognized or missing country information.