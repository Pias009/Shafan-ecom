# Promotional Dashboard - Product Selection Interface

## Overview
This document outlines the intuitive product selection interface for applying discounts to specific products or categories.

## Core Requirements
1. **Multiple Selection Methods**: Individual products, categories, or all products
2. **Search & Filter**: Find products quickly with advanced filters
3. **Bulk Operations**: Select/deselect multiple products at once
4. **Visual Preview**: See selected products with key details
5. **Conflict Detection**: Identify products already on discount
6. **Performance**: Handle large product catalogs efficiently

## Component Architecture

### 1. ProductSelectionModal Component
**Primary interface for selecting products to apply discounts to**

**Features:**
- Tabbed interface (Products, Categories, Collections)
- Real-time search with autocomplete
- Advanced filtering (price range, stock status, category, brand)
- Bulk selection with checkboxes
- Selected products counter
- Preview of selected items
- Conflict detection and warnings

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Select Products for Discount                               │
├───────────────┬─────────────────────────────────────────────┤
│               │ [Search: _______________ ] [Filter ▼]      │
│   [Tabs]      │                                            │
│   • Products  │ ┌─────────────────────────────────────┐   │
│   • Categories│ │ [ ] Product A           $49.99      │   │
│   • Collections││ [x] Product B           $89.99      │   │
│               │ │ [ ] Product C           $29.99      │   │
│   [Filters]   │ │ [ ] Product D           $149.99     │   │
│   • In Stock  │ └─────────────────────────────────────┘   │
│   • Price Range│                                           │
│   • Category  │ [← Previous] [1][2][3][4][5] [Next →]    │
│   • Brand     │                                           │
│               │ Selected: 12 products                     │
│               │ [Clear All] [Select All] [Invert]        │
└───────────────┴─────────────────────────────────────────────┘
```

### 2. CategorySelectionTree Component
**Hierarchical category selection with expand/collapse**

**Features:**
- Tree view of categories and subcategories
- Checkbox selection with parent-child relationships
- Breadcrumb navigation
- Product count per category
- Expand/collapse all functionality

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Select Categories                                          │
├─────────────────────────────────────────────────────────────┤
│ [Search Categories: _______ ]                             │
│                                                           │
│ [✓] Electronics (245 products)                            │
│   ├─ [✓] Smartphones (120 products)                       │
│   │   ├─ [ ] iPhone (45 products)                         │
│   │   └─ [ ] Android (75 products)                        │
│   ├─ [ ] Laptops (80 products)                            │
│   └─ [ ] Accessories (45 products)                        │
│                                                           │
│ [ ] Home & Kitchen (189 products)                         │
│ [ ] Fashion (312 products)                                │
│                                                           │
│ Selected: 3 categories (365 products)                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. SelectedProductsPanel Component
**Preview and management of selected products**

**Features:**
- Compact list of selected products
- Quick removal of individual items
- Bulk removal options
- Product details on hover
- Total count and value summary
- Conflict indicators

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Selected Products (12)                                     │
├─────────────────────────────────────────────────────────────┤
│ • Product A - $49.99                    [×] Remove        │
│   SKU: PROD-001 | In Stock: 45          ⚠️ Already discounted│
│                                                           │
│ • Product B - $89.99                    [×] Remove        │
│   SKU: PROD-002 | In Stock: 12                            │
│                                                           │
│ • Product C - $29.99                    [×] Remove        │
│   SKU: PROD-003 | In Stock: 89                            │
│                                                           │
│ [Clear All]                                              │
│                                                           │
│ Total: 12 products | Average Price: $56.25               │
└─────────────────────────────────────────────────────────────┘
```

### 4. ProductSearchWithFilters Component
**Advanced search and filtering interface**

**Filters Available:**
1. **Price Range**: Slider or min/max inputs
2. **Stock Status**: In stock, low stock, out of stock
3. **Category**: Multi-select dropdown
4. **Brand**: Multi-select dropdown
5. **Tags**: Product tags
6. **Date Added**: Recent products
7. **Discount Status**: Already discounted, not discounted

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Search & Filters                                           │
├─────────────────────────────────────────────────────────────┤
│ Search: [_________________________] [🔍]                  │
│                                                           │
│ ┌─ Price Range ───────────────────────────────────────┐  │
│ │ $0 ──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼── $500 │  │
│ │ Min: [$0      ] Max: [$500     ]                   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─ Stock Status ──────────────────────────────────────┐  │
│ │ [✓] In Stock (>10)    [ ] Low Stock (1-10)         │  │
│ │ [ ] Out of Stock      [ ] Any                      │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─ Categories ────────────────────────────────────────┐  │
│ │ [ ] Electronics    [ ] Home & Kitchen               │  │
│ │ [ ] Fashion        [ ] Beauty                       │  │
│ │ [ + Show more ]                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ [Apply Filters] [Reset Filters]                         │
└─────────────────────────────────────────────────────────────┘
```

## Selection Methods

### Method 1: Individual Product Selection
```
Process:
1. Admin searches or browses products
2. Selects individual products with checkboxes
3. Selected products appear in preview panel
4. Can adjust selection before applying discount

Use Case: Targeted discounts on specific bestsellers
```

### Method 2: Category-Based Selection
```
Process:
1. Admin navigates category tree
2. Selects entire categories or subcategories
3. System automatically includes all products in selected categories
4. Real-time product count updates

Use Case: Seasonal category-wide sales
```

### Method 3: Collection/Group Selection
```
Process:
1. Admin selects pre-defined collections
2. Collections can be: New Arrivals, Best Sellers, Trending
3. System dynamically includes products matching criteria

Use Case: Promotions on specific product groups
```

### Method 4: Rule-Based Selection
```
Process:
1. Admin defines rules:
   - Price > $50
   - Stock > 20 units  
   - Added in last 30 days
2. System automatically selects matching products
3. Rules can be saved as templates

Use Case: Automated discount campaigns
```

## Advanced Features

### 1. Conflict Detection
```typescript
interface ConflictDetection {
  checkProductConflicts(productIds: string[]): Promise<Conflict[]>;
}

interface Conflict {
  productId: string;
  productName: string;
  existingDiscount: {
    name: string;
    value: string;
    expires: Date;
  };
  severity: 'warning' | 'error';
}
```

**Visual Indicators:**
- ⚠️ Yellow warning: Product has existing discount
- 🔴 Red error: Discount would create pricing conflict
- 💡 Info: Suggestion for alternative products

### 2. Bulk Operations
- **Select All**: Select all products on current page/filter
- **Select None**: Clear all selections
- **Invert Selection**: Toggle all checkboxes
- **Select by Pattern**: Regex-based selection
- **Save Selection**: Save current selection as template

### 3. Real-time Updates
- Live product count as selection changes
- Estimated discount impact calculation
- Stock level indicators
- Price updates if products change

### 4. Selection Templates
```typescript
interface SelectionTemplate {
  id: string;
  name: string;
  type: 'products' | 'categories' | 'rules';
  items: string[]; // Product IDs, category IDs, or rule definitions
  createdAt: Date;
  lastUsed: Date;
}
```

**Template Management:**
- Save current selection as template
- Load from existing templates
- Share templates between admins
- Schedule template-based discounts

## Integration with Discount Form

### Flow 1: Creating New Discount
```
1. Admin fills discount details (name, type, value)
2. Clicks "Select Products" button
3. ProductSelectionModal opens
4. Admin selects products/categories
5. Selection is saved to discount form state
6. Admin completes discount configuration
7. Discount is created with selected products
```

### Flow 2: Editing Existing Discount
```
1. Admin opens discount for editing
2. Current product selection loads
3. Admin can add/remove products
4. Changes are previewed in real-time
5. Admin saves updated discount
```

### Flow 3: Bulk Discount Application
```
1. Admin selects multiple discounts
2. Opens bulk product selection
3. Selects products to apply all selected discounts to
4. System validates for conflicts
5. Applies discounts in batch
```

## Performance Optimization

### 1. Virtual Scrolling
```typescript
// For large product catalogs
const ProductVirtualList = ({ products, onSelect }) => {
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72, // Product row height
  });
  
  return (
    <div ref={scrollRef}>
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <ProductRow 
          product={products[virtualItem.index]}
          onSelect={onSelect}
          style={{ height: virtualItem.size }}
        />
      ))}
    </div>
  );
};
```

### 2. Debounced Search
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchProducts(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 3. Pagination & Infinite Scroll
- Server-side pagination for large datasets
- Load more on scroll
- Progressive loading of product images
- Caching of recently viewed products

### 4. Optimistic Updates
```typescript
// When selecting/deselecting products
const handleSelectProduct = async (productId) => {
  // Optimistically update UI
  setSelectedProducts(prev => [...prev, productId]);
  
  try {
    // Server validation
    await validateProductSelection(productId);
  } catch (error) {
    // Revert on error
    setSelectedProducts(prev => prev.filter(id => id !== productId));
    showError('Product cannot be selected');
  }
};
```

## Accessibility Features

### 1. Keyboard Navigation
- Tab through product rows
- Space/Enter to select
- Arrow keys for navigation
- Escape to close modal

### 2. Screen Reader Support
- ARIA labels for all interactive elements
- Live announcements for selection changes
- Descriptive product information
- Status announcements for loading/errors

### 3. High Contrast Mode
- Custom CSS for contrast ratios
- Visible focus indicators
- Color-independent status indicators
- Adjustable text sizes

## Mobile Responsive Design

### Mobile Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ Select Products                                            │
├─────────────────────────────────────────────────────────────┤
│ [Search] [Filter]                                          │
│                                                           │
│ [ ] Product A                                             │
│     $49.99 • In Stock                                     │
│                                                           │
│ [x] Product B                                             │
│     $89.99 • Low Stock                                    │
│                                                           │
│ [ ] Product C                                             │
│     $29.99 • In Stock                                     │
│                                                           │
│ [View Selected (3)]                                       │
└─────────────────────────────────────────────────────────────┘
```

### Tablet Layout:
- Split view with selection on left, preview on right
- Collapsible filters
- Touch-friendly checkboxes and buttons

## Implementation Notes

### 1. State Management
```typescript
interface ProductSelectionState {
  // Selection
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  
  // UI State
  searchQuery: string;
  activeFilters: Filter[];
  currentPage: number;
  isLoading: boolean;
  
  // Conflicts
  conflicts: Conflict[];
  hasConflicts: boolean;
  
  // Templates
  activeTemplate: string | null;
}
```

### 2. API Integration
- Product search endpoint with filters
- Category tree endpoint
- Conflict detection endpoint
- Bulk selection validation

### 3. Error Handling
- Network error recovery
- Invalid product handling
- Conflict resolution flows
- Undo/redo for selection changes