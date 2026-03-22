# Promotional Dashboard - Discount Management UI Components

## Overview
This document outlines the UI components for managing product discounts in the admin dashboard.

## Component Architecture

### 1. DiscountList Component
**Location:** `/src/app/ueadmin/promotional/discounts/page.tsx`
**Purpose:** Display all discounts with filtering, sorting, and bulk actions

**Features:**
- Grid/list view of all discounts
- Filter by status, type, and application scope
- Sort by creation date, usage, expiration
- Search by name, code, or description
- Bulk actions (activate, deactivate, duplicate, delete)
- Quick view of usage statistics

**UI Elements:**
```
┌─────────────────────────────────────────────────────────────┐
│ Discount Management ┌─────────────┐ ┌─────────────┐       │
│                     │ Filter: All ▼│ │ Sort: Newest│ [+ Add]│
├─────────────────────────────────────────────────────────────┤
│ [ ] Name/Code       Type    Status   Usage   Value  Actions│
│ [x] SUMMER20      20% OFF  Active   45/100  20%    [⋮]    │
│ [ ] FREESHIP      Free Ship Active  12/∞     -     [⋮]    │
│ [ ] SAVE50       $50 OFF   Scheduled 0/50   $50    [⋮]    │
│ [ ] WELCOME10    10% OFF   Expired  23/100  10%    [⋮]    │
└─────────────────────────────────────────────────────────────┘
```

### 2. DiscountForm Component
**Location:** `/src/app/ueadmin/promotional/discounts/[id]/edit/page.tsx`
**Purpose:** Create or edit discount with all configurable fields

**Features:**
- Step-by-step wizard or tabbed interface
- Real-time validation
- Product/category selection interface
- Usage limit configuration
- Schedule management
- Preview of discount calculation

**Form Sections:**

#### Section 1: Basic Information
```
┌─────────────────────────────────────────────────────────────┐
│ Basic Information                                           │
├─────────────────────────────────────────────────────────────┤
│ Discount Name:  [Summer Sale 2024          ]               │
│ Description:    [Special summer promotion  ]               │
│                                                           │
│ Discount Code:  [SUMMER24                 ] [Generate]    │
│                 [✓] Require code to apply                 │
└─────────────────────────────────────────────────────────────┘
```

#### Section 2: Discount Type & Value
```
┌─────────────────────────────────────────────────────────────┐
│ Discount Type & Value                                       │
├─────────────────────────────────────────────────────────────┤
│ [●] Percentage Discount     [○] Fixed Amount   [○] Free Ship│
│                                                           │
│ Discount Value: [20        ] % OFF                        │
│                 or [$50     ] OFF                         │
│                                                           │
│ Minimum Order:  [$100      ] (optional)                   │
└─────────────────────────────────────────────────────────────┘
```

#### Section 3: Application Scope
```
┌─────────────────────────────────────────────────────────────┐
│ Application Scope                                           │
├─────────────────────────────────────────────────────────────┤
│ [●] Apply to all products                                  │
│ [○] Apply to specific products/categories                  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Selected Products (3)                               │   │
│ │ • Product A                                         │   │
│ │ • Product B                                         │   │
│ │ • Product C                                         │   │
│ │ [ + Add Products ]                                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Selected Categories (2)                             │   │
│ │ • Electronics                                       │   │
│ │ • Home & Kitchen                                    │   │
│ │ [ + Add Categories ]                                │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Section 4: Usage Limits & Schedule
```
┌─────────────────────────────────────────────────────────────┐
│ Usage Limits & Schedule                                     │
├─────────────────────────────────────────────────────────────┤
│ Start Date:   [📅 2024-06-01 00:00        ]               │
│ End Date:     [📅 2024-08-31 23:59        ]               │
│                                                           │
│ Usage Limit:  [100        ] times per customer           │
│               [∞          ] total uses                   │
│                                                           │
│ [✓] Active    [✓] Auto-apply to eligible products        │
└─────────────────────────────────────────────────────────────┘
```

### 3. DiscountCard Component
**Location:** `/src/components/admin/DiscountCard.tsx`
**Purpose:** Display individual discount in list with key information

**Features:**
- Visual representation of discount type
- Status indicators
- Usage progress bar
- Quick actions (edit, duplicate, delete, view usage)

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  🏷️ SUMMER24                    Active ✓                  │
│  Summer Sale 2024               20% OFF                    │
│  Special summer promotion       Usage: 45/100 ███████░░░  │
│  Applies to: 15 products        Expires: Aug 31           │
│                                                           │
│               [Edit] [Duplicate] [Usage] [Delete]         │
└─────────────────────────────────────────────────────────────┘
```

### 4. ProductSelectionModal Component
**Location:** `/src/components/admin/ProductSelectionModal.tsx`
**Purpose:** Modal interface for selecting products to apply discount to

**Features:**
- Search and filter products
- Bulk selection
- Category-based selection
- Preview of selected products
- Pagination for large catalogs

### 5. DiscountUsageAnalytics Component
**Location:** `/src/components/admin/DiscountUsageAnalytics.tsx`
**Purpose:** Display detailed usage statistics for a discount

**Features:**
- Usage over time chart
- Top users/customers
- Revenue impact analysis
- Geographic distribution
- Export functionality

## Page Layouts

### 1. Discounts Dashboard Page
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Discount Management                                │
├─────────────────────────────────────────────────────────────┤
│ [Summary Cards]                                            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│ │Active││Sched││Expired││Total │                          │
│ │  8   ││  2  ││  15  ││  25  │                          │
│ └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                           │
│ [Quick Actions]                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [+ Create Discount] [Import] [Export] [View Report]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ [Discount List Component - see above]                     │
│                                                           │
│ [Performance Metrics]                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📊 Discount Performance                              │   │
│ │ • Total Savings: $2,450                              │   │
│ │ • Orders Using Discounts: 124                        │   │
│ │ • Average Discount: 18.5%                            │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Discount Editor Page
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Edit Discount » SUMMER24                          │
├───────────────┬─────────────────────────────────────────────┤
│               │ [Form Sections - see above]                │
│   [Steps]     │                                            │
│   1. Basic    │                                            │
│   2. Type     │                                            │
│   3. Scope    │                                            │
│   4. Limits   │                                            │
│   5. Review   │                                            │
│               │                                            │
│               │ [Preview Panel]                            │
│               │ ┌─────────────────────────────────────┐   │
│               │ │ Preview: SUMMER24                   │   │
│               │ │ 20% OFF Summer Sale                │   │
│               │ │ Applies to 15 products             │   │
│               │ │ Valid until Aug 31, 2024           │   │
│               │ └─────────────────────────────────────┘   │
│               │                                            │
│               │ [Back] [Next] [Save] [Save & Activate]    │
└───────────────┴─────────────────────────────────────────────┘
```

### 3. Discount Usage Analytics Page
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Discount Usage » SUMMER24                         │
├─────────────────────────────────────────────────────────────┤
│ [Overview Cards]                                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │Total Uses││Unique Users││Total Saved││Avg Order │      │
│ │   45     ││    32      ││  $1,230   ││  $85.60  │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                           │
│ [Usage Over Time Chart]                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📈 Daily Usage                                      │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ [Recent Usage Table]                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Date        Customer        Order    Amount Saved   │   │
│ │ 2024-06-15  john@email.com  #12345   $24.50         │   │
│ │ 2024-06-14  jane@email.com  #12344   $18.75         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ [Export Data] [View Full Report] [Back to List]          │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### DiscountTypeBadge Component
```tsx
interface DiscountTypeBadgeProps {
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
}

const typeConfig = {
  percentage: { 
    label: (value: number) => `${value}% OFF`,
    color: 'bg-blue-100 text-blue-800',
    icon: '🏷️'
  },
  fixed: {
    label: (value: number) => `$${value} OFF`,
    color: 'bg-green-100 text-green-800',
    icon: '💰'
  },
  shipping: {
    label: 'Free Shipping',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚚'
  }
};
```

### UsageProgressBar Component
```tsx
interface UsageProgressBarProps {
  current: number;
  max: number | null; // null for unlimited
  format?: 'count' | 'percentage';
}

// Shows visual progress bar with usage count
// Changes color based on usage percentage
```

### ProductSelectionGrid Component
```tsx
interface ProductSelectionGridProps {
  products: Product[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onSearch: (query: string) => void;
  onLoadMore: () => void;
}

// Grid view of products with checkboxes
// Search and filter capabilities
// Infinite scroll or pagination
```

## State Management

### Discount Form State
```typescript
interface DiscountFormState {
  // Basic
  name: string;
  description: string;
  code: string;
  requireCode: boolean;
  
  // Type & Value
  discountType: 'percentage' | 'fixed' | 'shipping';
  value: number;
  minimumOrderValue: number | null;
  
  // Application Scope
  applyToAll: boolean;
  productIds: string[];
  categoryIds: string[];
  
  // Limits & Schedule
  startDate: Date | null;
  endDate: Date | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  
  // Status
  active: boolean;
  autoApply: boolean;
  
  // Validation
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}
```

## Integration Points

### 1. Product Catalog Integration
- Fetches products from `/api/admin/products`
- Real-time search and filtering
- Category tree for hierarchical selection
- Stock status indicators

### 2. Order System Integration
- Validates discount against order rules
- Calculates discount amounts in real-time
- Tracks usage against orders
- Revenue impact analysis

### 3. Customer System Integration
- Tracks per-customer usage limits
- Customer segmentation for targeted discounts
- Email notification for discount issuance

## Advanced Features

### 1. Bulk Discount Creation
- Template-based discount creation
- CSV import/export of discount rules
- Batch update of multiple discounts

### 2. Advanced Targeting
- Customer segment targeting
- Geographic restrictions
- Time-of-day restrictions
- Minimum purchase requirements

### 3. A/B Testing
- Multiple discount variations
- Performance comparison
- Automatic optimization

### 4. Expiration Notifications
- Email alerts for expiring discounts
- Automatic renewal options
- Grace period configuration

## Responsive Design

### Mobile View
- Stacked form layout
- Simplified product selection
- Touch-friendly controls
- Mobile-optimized charts

### Tablet View
- Split-screen for form and preview
- Adaptive grid for product selection
- Collapsible sections

## Accessibility Features

- ARIA labels for all form controls
- Keyboard navigation for product grid
- Screen reader announcements
- High contrast mode support
- Focus management in modals

## Performance Considerations

- Virtual scrolling for product lists
- Debounced search inputs
- Optimistic updates for quick actions
- Client-side caching of recent discounts
- Lazy loading of usage analytics data