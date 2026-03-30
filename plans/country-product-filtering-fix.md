# Country-Based Product Filtering Fix Plan

## Current Issue Analysis
**Problem**: The application is not correctly separating Kuwait and Global products based on user location. Kuwait users see Global products on initial page load, and vice versa.

**Root Cause**: Server components (`src/app/page.tsx`, `src/app/products/page.tsx`) call `getProducts()` without the `storeCode` parameter, causing all products to be fetched regardless of user location. The middleware correctly sets `store_code` cookie, but server components don't read it.

## Current Architecture

### 1. Country Detection (Working)
- **Middleware** (`middleware.ts`): Detects country from `x-vercel-ip-country` header
  - Kuwait (`KW`) → `store_code=KUW` cookie
  - Other countries → `store_code=GLOBAL` cookie
- **Client-side detection** (`HomeClient.tsx`): Reads cookie and fetches appropriate products via API

### 2. Product Filtering Logic (Partially Working)
- `getProducts(storeCode?)` function filters via `StoreInventory` table when `storeCode` provided
- `getOptimizedProducts(storeCode?)` function also supports store filtering
- API endpoint `/api/products?store=KUW` works correctly

### 3. Data Model
- **StoreInventory** table links products to stores with quantity and price
- Products can be assigned to multiple stores via StoreInventory records
- Store codes: `KUW` (Kuwait), `GLOBAL` (Global/other countries)

## Implementation Gaps

### Critical Issues:
1. **Server-Side Rendering (SSR) doesn't filter products**: Initial page load shows all products
2. **No cookie reading in server components**: Can't access `store_code` in `page.tsx` files
3. **Inconsistent product fetching**: Some components use API, others use direct function calls
4. **Flash of wrong products**: Kuwait users briefly see Global products before client-side fetch

## Solution Plan

### Phase 1: Fix Server-Side Product Filtering (Immediate)

#### 1.1 Create Store Code Utility for Server Components
Create `src/lib/server/store-utils.ts` to read cookies in server components:
```typescript
import { cookies } from 'next/headers';

export async function getStoreCode(): Promise<string> {
  const cookieStore = await cookies();
  const storeCode = cookieStore.get('store_code')?.value;
  return storeCode || 'GLOBAL'; // Default to GLOBAL if not set
}
```

#### 1.2 Update Server Components
Modify `src/app/page.tsx` and `src/app/products/page.tsx`:
```typescript
import { getStoreCode } from '@/lib/server/store-utils';
// ...
export default async function HomePage() {
  const storeCode = await getStoreCode();
  const products = await getProducts(storeCode);
  // ...
}
```

#### 1.3 Update Product Detail Page
Modify `src/app/products/[id]/page.tsx` to check if product is available in user's store.

### Phase 2: Enhance Client-Side Consistency

#### 2.1 Create Store Context
Create `src/contexts/StoreContext.tsx` to provide store code globally:
```typescript
import { createContext, useContext } from 'react';

interface StoreContextType {
  storeCode: string;
  isKuwait: boolean;
  setStoreCode: (code: string) => void;
}

export const StoreContext = createContext<StoreContextType>({
  storeCode: 'GLOBAL',
  isKuwait: false,
  setStoreCode: () => {},
});
```

#### 2.2 Update HomeClient to Use Context
Replace cookie reading with context to avoid duplicate logic.

#### 2.3 Create Store Detection Hook
Create `src/hooks/useStoreDetection.ts` for consistent store detection across components.

### Phase 3: Data Validation & Cleanup

#### 3.1 Verify Store Inventory Data
Run validation script to ensure:
- Kuwait products are only in KUW store inventory
- Global products are only in GLOBAL store inventory
- No product exists in both stores (unless intended for overlap)

#### 3.2 Create Admin Validation Tool
Add store validation in admin panel to prevent assignment conflicts.

#### 3.3 Update Product Creation/Editing
Ensure new products are assigned to correct store based on admin's store access.

### Phase 4: Testing & Validation

#### 4.1 Create Test Scenarios
- Kuwait IP → should see only KUW products
- Non-Kuwait IP → should see only GLOBAL products
- No cookie/initial load → should filter correctly

#### 4.2 Implement Integration Tests
Create test files for:
- Middleware store detection
- Product filtering functions
- API endpoints with store parameter

#### 4.3 Manual Testing Checklist
- [ ] Clear cookies, visit from Kuwait IP
- [ ] Clear cookies, visit from non-Kuwait IP  
- [ ] Direct navigation to product pages
- [ ] Search functionality with store filtering
- [ ] Category/brand filtering with store context

## Technical Implementation Details

### File Modifications Required:

#### 1. New Files:
- `src/lib/server/store-utils.ts` - Server-side cookie reading
- `src/contexts/StoreContext.tsx` - React context for store
- `src/hooks/useStoreDetection.ts` - Custom hook
- `scripts/validate-store-products.js` - Data validation script

#### 2. Modified Files:
- `src/app/page.tsx` - Add storeCode parameter to getProducts()
- `src/app/products/page.tsx` - Add storeCode parameter
- `src/app/products/[id]/page.tsx` - Add store availability check
- `src/app/HomeClient.tsx` - Use StoreContext instead of cookie reading
- `src/app/products/ProductsClient.tsx` - Potentially update for consistency

#### 3. Updated Functions:
- `getProducts()` - Ensure proper filtering when storeCode='GLOBAL'
- `getOptimizedProducts()` - Same as above
- Product detail functions - Add store availability check

### Edge Cases to Handle:

1. **New users without cookie**: Middleware should set cookie on first request
2. **VPN/users changing location**: Cookie should update on next request
3. **Admin users**: Should see all products regardless of store
4. **Product not in user's store**: Show "not available in your region" message
5. **Empty store inventory**: Show appropriate empty state

## Migration Strategy

### Step 1: Backward Compatibility
Maintain current API behavior while implementing new system:
- API without store parameter returns all products (for admin/backward compatibility)
- Gradually update client components to use store parameter

### Step 2: Data Migration
Ensure all existing products are correctly assigned to stores:
- Run migration script to assign products to GLOBAL store if unassigned
- Verify Kuwait products are correctly assigned

### Step 3: Gradual Rollout
1. Implement server-side filtering for homepage only
2. Test with small user group
3. Implement for products page
4. Implement for product detail pages
5. Full rollout

## Success Metrics

### Functional Requirements:
- ✓ Kuwait users see ONLY Kuwait products on initial load
- ✓ Non-Kuwait users see ONLY Global products on initial load  
- ✓ No flash of wrong products
- ✓ Product detail pages respect store availability
- ✓ Search and filtering work within store context

### Performance Requirements:
- Page load time not significantly impacted
- No additional database queries per page
- Cache store-specific product lists appropriately

## Risk Mitigation

### Potential Risks:
1. **Breaking existing functionality**: Maintain backward compatibility during transition
2. **Performance impact**: Use caching for store-specific product lists
3. **Data inconsistency**: Run validation scripts before and after changes
4. **User experience issues**: Implement proper loading states and error handling

### Rollback Plan:
1. Revert server component changes
2. Keep client-side detection as fallback
3. Maintain API backward compatibility

## Timeline & Priority

### Priority Order:
1. **P0**: Fix server-side rendering for homepage (immediate impact)
2. **P1**: Fix products listing page
3. **P2**: Fix product detail pages  
4. **P3**: Implement store context for consistency
5. **P4**: Admin tools and validation

### Estimated Complexity:
- Phase 1: 2-3 days development
- Phase 2: 1-2 days development  
- Phase 3: 1 day development
- Phase 4: 1-2 days testing

## Dependencies

### Required:
- Next.js 14+ (for `cookies()` API in server components)
- Existing StoreInventory data model
- Country detection in middleware (already working)

### Optional Enhancements:
- Redis caching for store-specific product lists
- GeoIP fallback for non-Vercel deployments
- User preference to override auto-detected store

## Conclusion

The current system has solid foundations but lacks server-side integration. By implementing server-side store code reading and passing it to product fetching functions, we can ensure users immediately see the correct products for their region. This fix will eliminate the flash of wrong products and provide a consistent experience across the application.

The plan follows a phased approach to minimize risk while delivering immediate value through server-side filtering fixes.