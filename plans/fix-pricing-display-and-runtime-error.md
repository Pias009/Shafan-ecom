# Fix Pricing Display and Runtime Error

## Problem Summary

### Issue 1: Runtime Error in AddProductForm
**Error**: `Cannot read properties of undefined (reading 'map')`

**Location**: [`src/app/ueadmin/products/add/AddProductForm.tsx:335`](src/app/ueadmin/products/add/AddProductForm.tsx:335)

**Root Cause**: The component tries to map over `brands`, `categories`, `subCategories`, `skinTones`, or `skinConcerns` without checking if they are defined first. While the parent page has proper error handling with `Promise.allSettled`, the component needs defensive programming.

### Issue 2: Pricing Display Problem
**User Request**: Admin wants to input prices like "45,54" (45 major units, 54 cents) and see them displayed correctly on the website.

**Current Behavior**: Prices are being displayed incorrectly - showing only cents instead of the full decimal format.

**Root Cause Analysis**:
- Database stores prices as integers in minor units (e.g., 4554 for 45.54 AED)
- [`money.ts`](src/lib/money.ts:1) has proper conversion functions
- Country-specific pricing is stored in `countryPrices` array
- The issue is in how prices are being passed and displayed in components

## Current Architecture

### Price Storage
```typescript
// Database Schema (prisma/schema.prisma)
model Product {
  priceCents    Int      // Base price in minor units
  countryPrices CountryPrice[]  // Country-specific prices
}

model CountryPrice {
  country    String
  priceCents Int      // Price in minor units
  currency   String
}
```

### Price Conversion Functions ([`src/lib/money.ts`](src/lib/money.ts:1))
```typescript
// Convert major units (45.54) to minor units (4554)
majorToMinorInt(major: number, currency: string): number

// Convert minor units (4554) to major units (45.54)
minorIntToMajor(minor: number, currency: string): number

// Parse localized input "45,54" or "45.54" → 45.54
parseLocalizedDecimalInput(raw: string): number | null
```

### Price Display Flow
```
Admin Input (45,54) 
  → parseLocalizedDecimalInput() 
  → majorToMinorInt() 
  → Database (4554)
  → minorIntToMajor() 
  → Display (45.54)
```

## Solution Plan

### Phase 1: Fix Runtime Error (Critical)

**File**: [`src/app/ueadmin/products/add/AddProductForm.tsx`](src/app/ueadmin/products/add/AddProductForm.tsx:1)

**Changes Required**:
1. Add null checks for all array props before mapping
2. Add default empty arrays for all array props
3. Add defensive checks in the component initialization

```typescript
// Add default values in props destructuring
export function AddProductForm({
  brands = [],  // Default to empty array
  categories = [],
  subCategories = [],
  skinTones = [],
  skinConcerns = [],
  adminStoreCode,
  isSuperAdmin
}: AddProductFormProps) {
  // ... rest of component
}
```

### Phase 2: Fix Price Input Handling

**File**: [`src/app/ueadmin/products/add/AddProductForm.tsx`](src/app/ueadmin/products/add/AddProductForm.tsx:520)

**Current State**: The form already uses `parseLocalizedDecimalInput()` which supports both comma and dot as decimal separators.

**Verification Needed**:
1. Confirm the input field type is `text` with `inputMode="decimal"` (already done at line 556)
2. Verify the conversion logic in handleSubmit (lines 203-213)
3. Test with "45,54" input format

### Phase 3: Fix Price Display Components

#### 3.1 Fix Price Component
**File**: [`src/components/Price.tsx`](src/components/Price.tsx:1)

**Issue**: The component receives `amount` as a prop but may be receiving minor units instead of major units.

**Fix Required**:
- Ensure `amount` is always in major units before formatting
- Add proper conversion when receiving minor units
- Verify `countryPrices` are being used correctly

#### 3.2 Fix ProductCard Component
**File**: [`src/components/ProductCard.tsx`](src/components/ProductCard.tsx:1)

**Issue**: The component uses `product.price` directly without converting from minor units.

**Fix Required**:
- Use `getDisplayPrice()` utility to get the correct price
- Pass `countryPrices` to Price component
- Ensure price is in major units before display

#### 3.3 Fix ProductsClient Component
**File**: [`src/app/products/ProductsClient.tsx`](src/app/products/ProductsClient.tsx:1)

**Issue**: Price filtering and display may not be using country-specific prices.

**Fix Required**:
- Update filtered products to use `getDisplayPrice()` for price comparisons
- Ensure Price component receives correct data

#### 3.4 Fix Cart Page
**File**: [`src/app/cart/page.tsx`](src/app/cart/page.tsx:1)

**Issue**: Cart calculations may not be using correct price conversions.

**Fix Required**:
- Verify `getDisplayPrice()` is used for all price calculations
- Ensure subtotal, discount, and total calculations use major units

### Phase 4: Fix Product Page Client
**File**: [`src/app/products/[id]/ProductPageClient.tsx`](src/app/products/[id]/ProductPageClient.tsx:1)

**Issue**: Product detail page price display.

**Fix Required**:
- Ensure `getDisplayPrice()` is used for price display
- Verify order creation uses correct price conversion

### Phase 5: API Route Verification
**File**: [`src/app/api/admin/products/route.ts`](src/app/api/admin/products/route.ts:1)

**Issue**: Ensure API properly handles price conversion.

**Verification Needed**:
1. Confirm POST route properly converts country prices (lines 200-206)
2. Verify GET route returns prices in correct format
3. Check that `minorIntToMajor()` is used when returning product data

## Implementation Order

1. **Fix Runtime Error** (Critical - blocks admin functionality)
   - Add null checks to AddProductForm
   - Test admin product creation page

2. **Fix Price Display** (High Priority - affects user experience)
   - Update Price component
   - Update ProductCard component
   - Update ProductsClient component
   - Update cart page
   - Update product detail page

3. **Verify API Routes** (Medium Priority)
   - Ensure API returns prices in correct format
   - Test product creation with "45,54" format

4. **Testing** (High Priority)
   - Test complete flow: admin input → database → display → order
   - Test with different currencies (AED, SAR, KWD, etc.)
   - Test edge cases (0 price, very large prices, etc.)

5. **Documentation** (Low Priority)
   - Update admin guide with price input format
   - Add examples for different currencies

## Testing Checklist

- [ ] Admin can access product creation page without errors
- [ ] Admin can input price "45,54" and it saves correctly
- [ ] Admin can input price "45.54" and it saves correctly
- [ ] Product displays "45.54 AED" on website (not "4554")
- [ ] Product displays correct price for each country
- [ ] Cart shows correct prices
- [ ] Order creation uses correct prices
- [ ] KWD prices show 3 decimal places (e.g., "12.345 KWD")
- [ ] AED/SAR prices show 2 decimal places (e.g., "45.54 AED")

## Files to Modify

1. `src/app/ueadmin/products/add/AddProductForm.tsx` - Fix runtime error
2. `src/components/Price.tsx` - Fix price display logic
3. `src/components/ProductCard.tsx` - Use correct price display
4. `src/app/products/ProductsClient.tsx` - Fix price filtering
5. `src/app/cart/page.tsx` - Fix cart price calculations
6. `src/app/products/[id]/ProductPageClient.tsx` - Fix product page display
7. `src/app/api/admin/products/route.ts` - Verify API price handling

## Success Criteria

1. Admin can create products without runtime errors
2. Admin can input prices using comma or dot as decimal separator
3. Website displays prices in correct decimal format (e.g., "45.54 AED")
4. Cart and checkout use correct prices
5. Orders are created with correct price values
6. All currencies display with correct decimal places
