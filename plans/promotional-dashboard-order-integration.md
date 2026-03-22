# Promotional Dashboard - Order Creation System Integration

## Overview
This document outlines the integration between the promotional dashboard and the existing order creation system, ensuring discounts are automatically applied when users click on banners and during order creation.

## Core Integration Requirements
1. **Banner Click Redirection**: When users click banners, redirect to relevant product pages with discounts pre-applied
2. **Automatic Discount Application**: Apply eligible discounts during order creation without manual code entry
3. **Discount Validation**: Validate discounts against order rules (minimum order value, product eligibility, etc.)
4. **Order Tracking**: Track which discounts were used in which orders
5. **Revenue Attribution**: Attribute sales to specific banners and discounts
6. **Real-time Updates**: Reflect discount changes in cart/checkout in real-time

## Integration Architecture

### 1. Banner Click Processing Flow
```
User clicks banner → Track click → Parse banner link → Apply discount → Redirect to product
```

```typescript
interface BannerClickHandler {
  // Process banner click
  handleClick(bannerId: string, userId?: string): Promise<RedirectResult>;
  
  // Apply associated discount to session
  applyBannerDiscount(bannerId: string, userId?: string): Promise<void>;
  
  // Generate redirect URL with discount context
  generateProductUrl(productId: string, discountId?: string): string;
}

interface RedirectResult {
  url: string;
  discountApplied: boolean;
  discountId?: string;
  trackingId: string;
}
```

### 2. Discount Application Engine
**Central service that applies discounts to orders**

```typescript
class DiscountApplicationEngine {
  // Find applicable discounts for a cart
  async findApplicableDiscounts(cart: Cart): Promise<ApplicableDiscount[]> {
    const discounts = await this.getActiveDiscounts();
    
    return discounts.filter(discount => 
      this.isDiscountApplicable(discount, cart)
    );
  }
  
  // Apply discount to cart
  async applyDiscountToCart(cart: Cart, discountCode?: string): Promise<Cart> {
    const applicableDiscounts = await this.findApplicableDiscounts(cart);
    
    // Apply auto-apply discounts
    const autoApplyDiscounts = applicableDiscounts.filter(d => d.autoApply);
    for (const discount of autoApplyDiscounts) {
      cart = await this.applySingleDiscount(cart, discount);
    }
    
    // Apply manual discount if provided
    if (discountCode) {
      const manualDiscount = applicableDiscounts.find(d => d.code === discountCode);
      if (manualDiscount) {
        cart = await this.applySingleDiscount(cart, manualDiscount);
      }
    }
    
    return this.calculateFinalCart(cart);
  }
  
  // Validate discount against order rules
  async validateDiscountForOrder(discount: Discount, order: Order): Promise<ValidationResult> {
    const validations = [
      this.validateDates(discount, order),
      this.validateUsageLimits(discount, order),
      this.validateMinimumOrder(discount, order),
      this.validateProductEligibility(discount, order),
      this.validateCustomerEligibility(discount, order),
    ];
    
    const results = await Promise.all(validations);
    return this.aggregateValidationResults(results);
  }
}
```

## Integration Points

### 1. Cart/Checkout System Integration
**Existing endpoints to modify:**

#### Current Cart API (likely `/api/cart` or similar)
```typescript
// Enhanced cart response with discount information
interface CartResponse {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedDiscounts: AppliedDiscount[];
  applicableDiscounts: ApplicableDiscount[]; // Auto-applicable discounts
}

// New endpoint for discount application
POST /api/cart/apply-discount
Body: { discountCode?: string, bannerId?: string }
Response: Updated cart with discounts applied
```

#### Checkout Process Integration
```typescript
// During checkout, validate all applied discounts
interface CheckoutValidation {
  validateDiscounts(order: Order): Promise<ValidationResult>;
  
  // Apply discounts to order total
  calculateOrderTotal(order: Order): Promise<OrderTotal>;
  
  // Record discount usage
  recordDiscountUsage(order: Order): Promise<void>;
}
```

### 2. Product Page Integration
**When user arrives from banner click:**

```typescript
// Product page component enhancement
const ProductPage = ({ productId, discountId }: ProductPageProps) => {
  useEffect(() => {
    // If discountId is present in URL params (from banner click)
    if (discountId) {
      // Apply discount to product context
      applyProductDiscount(discountId);
      
      // Add to cart with discount pre-applied
      preloadCartWithDiscount(productId, discountId);
    }
  }, [productId, discountId]);
  
  return (
    <ProductDisplay 
      product={product}
      discountedPrice={getDiscountedPrice(product, discountId)}
      onAddToCart={() => addToCartWithDiscount(productId, discountId)}
    />
  );
};
```

### 3. Order Creation Integration
**Enhanced order creation flow:**

```typescript
// Existing order creation endpoint (likely /api/create-order)
// Enhanced to handle automatic discount application

POST /api/create-order
Body: {
  items: OrderItem[],
  shippingAddress: Address,
  billingAddress: Address,
  paymentMethod: string,
  // Discount-related fields
  appliedDiscountCodes?: string[],
  bannerId?: string, // For attribution
  autoApplyDiscounts?: boolean // Default: true
}

Response: {
  order: Order,
  appliedDiscounts: AppliedDiscount[],
  discountSavings: number,
  bannerAttribution?: BannerAttribution
}
```

## Discount Application Logic

### 1. Discount Eligibility Rules
```typescript
interface DiscountEligibility {
  // Product-based eligibility
  isProductEligible(productId: string): Promise<boolean>;
  
  // Category-based eligibility  
  isCategoryEligible(categoryId: string): Promise<boolean>;
  
  // Customer-based eligibility
  isCustomerEligible(userId?: string): Promise<boolean>;
  
  // Order-based eligibility
  isOrderEligible(orderSubtotal: number): Promise<boolean>;
  
  // Time-based eligibility
  isTimeEligible(): Promise<boolean>;
}

// Eligibility checking flow
const checkEligibility = async (discount: Discount, context: DiscountContext) => {
  const checks = [
    discount.applyToAll || 
      (await isProductEligible(discount, context.productIds)),
    await isCustomerEligible(discount, context.userId),
    await isOrderEligible(discount, context.orderSubtotal),
    await isTimeEligible(discount),
  ];
  
  return checks.every(check => check === true);
};
```

### 2. Discount Stacking Rules
```typescript
enum DiscountStackingRule {
  NONE = 'none', // No stacking allowed
  ALL = 'all', // All discounts stack
  MAX_ONE = 'max_one', // Maximum one discount
  CATEGORY_EXCLUSIVE = 'category_exclusive', // Only one per category
  TIERED = 'tiered', // Tiered discounts (e.g., 10% + 5%)
}

interface DiscountStacking {
  rule: DiscountStackingRule;
  maxDiscountAmount?: number; // Maximum total discount
  priority: number; // Higher priority discounts applied first
  incompatibleDiscountIds: string[]; // IDs of discounts that cannot be combined
}

// Stacking resolution algorithm
const resolveDiscountStacking = (discounts: Discount[], cart: Cart) => {
  // Sort by priority (highest first)
  const sorted = discounts.sort((a, b) => b.priority - a.priority);
  
  const applied: Discount[] = [];
  let totalDiscount = 0;
  
  for (const discount of sorted) {
    // Check stacking rules
    if (discount.stacking.rule === DiscountStackingRule.NONE && applied.length > 0) {
      continue;
    }
    
    if (discount.stacking.rule === DiscountStackingRule.MAX_ONE && applied.length >= 1) {
      continue;
    }
    
    // Check incompatibility
    const incompatible = applied.some(appliedDiscount => 
      discount.stacking.incompatibleDiscountIds.includes(appliedDiscount.id)
    );
    
    if (incompatible) {
      continue;
    }
    
    // Apply discount
    applied.push(discount);
    totalDiscount += calculateDiscountAmount(discount, cart);
    
    // Check max discount amount
    if (discount.stacking.maxDiscountAmount && 
        totalDiscount > discount.stacking.maxDiscountAmount) {
      break;
    }
  }
  
  return applied;
};
```

### 3. Discount Calculation
```typescript
interface DiscountCalculation {
  // Calculate discount amount for a product
  calculateProductDiscount(product: Product, discount: Discount): number {
    switch (discount.discountType) {
      case 'PERCENTAGE':
        return product.price * (discount.value / 100);
      case 'FIXED_AMOUNT':
        return Math.min(discount.value, product.price);
      case 'FREE_SHIPPING':
        return 0; // Shipping calculated separately
      default:
        return 0;
    }
  }
  
  // Calculate total discount for cart
  calculateCartDiscount(cart: Cart, discount: Discount): number {
    if (discount.applyToAll) {
      return cart.items.reduce((total, item) => {
        return total + this.calculateProductDiscount(item.product, discount) * item.quantity;
      }, 0);
    } else {
      // Only apply to eligible products
      return cart.items.reduce((total, item) => {
        if (this.isProductEligible(item.product.id, discount)) {
          return total + this.calculateProductDiscount(item.product, discount) * item.quantity;
        }
        return total;
      }, 0);
    }
  }
}
```

## Banner Attribution & Tracking

### 1. Click Tracking
```typescript
interface ClickTracker {
  // Record banner click
  trackClick(bannerId: string, userId?: string, metadata?: ClickMetadata): Promise<void>;
  
  // Record conversion (click → purchase)
  trackConversion(bannerId: string, orderId: string, userId?: string): Promise<void>;
  
  // Get banner performance metrics
  getBannerPerformance(bannerId: string, timeframe: Timeframe): Promise<BannerPerformance>;
}

interface ClickMetadata {
  source: 'homepage' | 'email' | 'social' | 'direct';
  device: 'desktop' | 'mobile' | 'tablet';
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

### 2. Revenue Attribution
```typescript
interface RevenueAttribution {
  // Attribute order revenue to banner
  attributeOrderToBanner(order: Order, bannerId: string): Promise<void>;
  
  // Calculate ROI for banner
  calculateBannerROI(bannerId: string): Promise<ROICalculation>;
  
  // Get attribution report
  getAttributionReport(timeframe: Timeframe): Promise<AttributionReport>;
}

interface ROICalculation {
  bannerId: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  cost: number; // If banner has associated cost
  roi: number; // (revenue - cost) / cost
  conversionRate: number;
  averageOrderValue: number;
}
```

## Real-time Updates & Synchronization

### 1. Discount Status Synchronization
```typescript
// WebSocket or Server-Sent Events for real-time updates
class DiscountSyncService {
  // Notify clients of discount changes
  notifyDiscountUpdate(discountId: string, changeType: 'activated' | 'expired' | 'modified'): void {
    this.clients.forEach(client => {
      client.send({
        type: 'DISCOUNT_UPDATE',
        discountId,
        changeType,
        timestamp: new Date()
      });
    });
  }
  
  // Update cart when discounts change
  updateCartDiscounts(cartId: string): Promise<void> {
    const cart = await this.getCart(cartId);
    const updatedCart = await this.discountEngine.applyDiscountToCart(cart);
    return this.saveCart(updatedCart);
  }
}
```

### 2. Cache Invalidation
```typescript
// When discounts change, invalidate relevant caches
class CacheInvalidationService {
  async invalidateOnDiscountChange(discountId: string): Promise<void> {
    // Invalidate product caches for affected products
    const affectedProducts = await this.getDiscountProducts(discountId);
    await this.invalidateProductCaches(affectedProducts);
    
    // Invalidate cart caches
    await this.invalidateCartCaches();
    
    // Invalidate pricing caches
    await this.invalidatePricingCaches();
  }
}
```

## Error Handling & Edge Cases

### 1. Discount Application Failures
```typescript
enum DiscountError {
  EXPIRED = 'discount_expired',
  MAX_USES_EXCEEDED = 'max_uses_exceeded',
  MINIMUM_ORDER_NOT_MET = 'minimum_order_not_met',
  PRODUCT_NOT_ELIGIBLE = 'product_not_eligible',
  CUSTOMER_NOT_ELIGIBLE = 'customer_not_eligible',
  STACKING_VIOLATION = 'stacking_violation',
  ALREADY_APPLIED = 'already_applied'
}

class DiscountErrorHandler {
  handleError(error: DiscountError, context: ErrorContext): UserMessage {
    switch (error) {
      case DiscountError.EXPIRED:
        return {
          message: 'This discount has expired',
          severity: 'error',
          action: 'remove_discount'
        };
      case DiscountError.MINIMUM_ORDER_NOT_MET:
        return {
          message: `Add $${context.requiredAmount - context.currentAmount} more to use this discount`,
          severity: 'warning',
          action: 'show_upsell'
        };
      // ... other cases
    }
  }
}
```

### 2. Race Conditions
```typescript
// Prevent double-spending of limited-use discounts
class DiscountUsageLock {
  private locks = new Map<string, Promise<any>>();
  
  async withLock(discountId: string, operation: () => Promise<any>): Promise<any> {
    // Acquire lock for this discount
    const lock = this.locks.get(discountId) || Promise.resolve();
    const newLock = lock.then(() => operation());
    this.locks.set(discountId, newLock.catch(() => {}));
    
    return newLock;
  }
}

// Usage
await discountUsageLock.withLock(discountId, async () => {
  const discount = await this.getDiscount(discountId);
  if (discount.uses >= discount.maxUses) {
    throw new Error(DiscountError.MAX_USES_EXCEEDED);
  }
  await this.incrementDiscountUsage(discountId);
});
```

## Testing & Validation

### 1. Integration Test Scenarios
```typescript
describe('Discount Integration', () => {
  test('Banner click applies discount to product page', async () => {
    const banner = await createBanner({ discountId: 'discount-1' });
    const result = await bannerClickHandler.handleClick(banner.id);
    
    expect(result.discountApplied).toBe(true);
    expect(result.url).toContain('discount=discount-1');
  });
  
  test('Auto-apply discount during checkout', async () => {
    const cart = await createCartWithEligibleProducts();
    const order = await checkoutService.createOrder(cart);
    
    expect(order.appliedDiscounts).toHaveLength(1);
    expect(order.discountSavings).toBeGreaterThan(0);
  });
  
  test('Expired discount is not applied', async () => {
    const expiredDiscount = await createExpiredDiscount();
    const cart = await createCart();
    
    await expect(
      discountEngine.applyDiscountToCart(cart, expiredDiscount.code)
    ).rejects.toThrow('Discount expired');
  });
});
```

### 2. Performance Testing
- Load testing with multiple concurrent discount applications
- Stress testing with large numbers of active discounts
- Latency measurement for discount validation
- Cache hit rate analysis

## Monitoring & Analytics

### 1. Key Metrics
```typescript
interface DiscountMetrics {
  // Usage metrics
  totalDiscountsApplied: number;
  uniqueCustomersUsingDiscounts: number;
  averageDiscountPerOrder: number;
  discountRedemptionRate: number;
  
  // Revenue metrics
  totalDiscountAmount: number;
  incrementalRevenueFromDiscounts: number;
  discountEfficiency: number; // Revenue per discount dollar
  
  // Performance metrics
  discountValidationLatency: number;
  cacheHitRate: number;
  errorRate: number;
}

interface BannerMetrics {
  clickThroughRate: number;
  conversionRate: number;
  revenuePerClick: number;
  attributedRevenue: number;
  returnOnAdSpend: number;
}
```

### 2. Alerting
- Alert when discount usage exceeds expected rates
- Alert when banner click-through rate drops below threshold
- Alert when discount validation errors spike
- Alert when revenue attribution discrepancies detected

## Migration Strategy

### 1. Phase 1: Foundation
- Add discount tracking to existing order model
- Create basic banner click tracking
- Implement discount validation endpoints

### 2. Phase 2: Integration
- Modify cart/checkout to accept discount parameters
- Update product pages to handle discount context
- Implement automatic discount application

### 3. Phase 3: Enhancement
- Add advanced discount stacking rules
- Implement real-time discount updates
- Add comprehensive analytics and reporting

### 4. Phase 4: Optimization
- Performance optimization for discount calculations
- Advanced caching strategies
- Machine learning for discount recommendations