# Promotional Dashboard - Banner Management UI Components

## Overview
This document outlines the UI components for managing promotional banners in the admin dashboard.

## Component Architecture

### 1. BannerList Component
**Location:** `/src/app/ueadmin/promotional/banners/page.tsx`
**Purpose:** Display all banners with filtering, sorting, and bulk actions

**Features:**
- List view of all banners with key information
- Filter by status (Active, Scheduled, Expired, Draft)
- Sort by creation date, start date, priority, clicks
- Search by title or offer text
- Bulk actions (activate, deactivate, delete)
- Pagination

**UI Elements:**
```
┌─────────────────────────────────────────────────────────────┐
│ Banner Management ┌─────────────┐ ┌─────────────┐          │
│                   │ Filter: All ▼│ │ Sort: Newest│ [+ Add]  │
├─────────────────────────────────────────────────────────────┤
│ [ ] Title              Status    Start Date   Clicks Actions│
│ [x] Summer Sale       Active     Jun 1       1,234  [⋮]    │
│ [ ] Black Friday     Scheduled   Nov 20       0     [⋮]    │
│ [ ] Spring Clearance  Expired    Mar 1        567   [⋮]    │
│ [ ] Back to School    Draft      -            0     [⋮]    │
└─────────────────────────────────────────────────────────────┘
```

### 2. BannerForm Component
**Location:** `/src/app/ueadmin/promotional/banners/[id]/edit/page.tsx`
**Purpose:** Create or edit banner with all configurable fields

**Features:**
- Tabbed interface for different sections
- Live preview of banner
- Image upload with drag & drop
- Color pickers for background/text colors
- Date/time pickers for scheduling
- Discount association selector
- Validation and error handling

**Form Sections:**

#### Section 1: Basic Information
```
┌─────────────────────────────────────────────────────────────┐
│ Basic Information                                           │
├─────────────────────────────────────────────────────────────┤
│ Title:        [Summer Sale              ]                   │
│ Subtitle:     [Up to 70% OFF            ]                   │
│ Offer Text:   [70% OFF                   ]                  │
│ CTA Text:     [Shop Now                 ]                   │
└─────────────────────────────────────────────────────────────┘
```

#### Section 2: Visual Design
```
┌─────────────────────────────────────────────────────────────┐
│ Visual Design                                              │
├─────────────────────────────────────────────────────────────┤
│ [●] Use Image   [○] Use Background Color                  │
│                                                           │
│ Image URL:     [https://...              ] [Upload]       │
│                                                           │
│ Background:    [▉ #FF6B35               ] [Pick Color]   │
│ Text Color:    [▉ #FFFFFF               ] [Pick Color]   │
└─────────────────────────────────────────────────────────────┘
```

#### Section 3: Scheduling & Behavior
```
┌─────────────────────────────────────────────────────────────┐
│ Scheduling & Behavior                                      │
├─────────────────────────────────────────────────────────────┤
│ Start Date:   [📅 2024-06-01 09:00 AM   ]                 │
│ End Date:     [📅 2024-06-30 23:59 PM   ]                 │
│                                                           │
│ Link URL:     [/products/summer-sale    ]                 │
│ Discount:     [Select Discount ▼        ]                 │
│                                                           │
│ [✓] Active    Priority: [Medium ▼]      Order: [1     ]  │
└─────────────────────────────────────────────────────────────┘
```

#### Section 4: Live Preview
```
┌─────────────────────────────────────────────────────────────┐
│ Live Preview (Desktop & Mobile)                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  SUMMER SALE                                        │   │
│ │  Up to 70% OFF                                      │   │
│ │                                                     │   │
│ │  [ SHOP NOW ]                                       │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3. BannerCard Component
**Location:** `/src/components/admin/BannerCard.tsx`
**Purpose:** Display individual banner in list with status indicators

**Features:**
- Compact card layout
- Status badge (Active, Scheduled, Expired, Draft)
- Thumbnail preview
- Quick actions (edit, duplicate, delete)
- Performance metrics (clicks, conversions)

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Thumbnail]  Summer Sale                Active ✓          │
│               Up to 70% OFF              Starts: Jun 1     │
│                                          Clicks: 1,234     │
│               [Edit] [Duplicate] [Delete]                  │
└─────────────────────────────────────────────────────────────┘
```

### 4. BannerCalendar Component
**Location:** `/src/components/admin/BannerCalendar.tsx`
**Purpose:** Visual calendar view of scheduled banners

**Features:**
- Month/week/day views
- Color-coded by banner priority
- Drag & drop rescheduling
- Quick create/edit from calendar
- Conflict detection

### 5. BannerAnalytics Component
**Location:** `/src/components/admin/BannerAnalytics.tsx`
**Purpose:** Display performance metrics for banners

**Features:**
- Click-through rate (CTR)
- Conversion rate
- Impressions vs clicks
- Time-series charts
- Comparison between banners

## Page Layouts

### 1. Banners Dashboard Page
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Banner Management                                  │
├─────────────────────────────────────────────────────────────┤
│ [Summary Cards]                                            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│ │Active││Sched││Expired││Total │                          │
│ │  12  ││  3  ││  8   ││  23  │                          │
│ └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                           │
│ [Quick Actions]                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [+ Create Banner] [View Calendar] [Export Data]     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ [Banner List Component - see above]                       │
│                                                           │
│ [Performance Chart]                                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📈 Clicks Over Time                                 │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Banner Editor Page
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Edit Banner » Summer Sale                         │
├───────────────┬─────────────────────────────────────────────┤
│               │ [Form Sections - see above]                │
│   [Tabs]      │                                            │
│   • Basic     │                                            │
│   • Visual    │                                            │
│   • Schedule  │                                            │
│   • Advanced  │                                            │
│               │                                            │
│               │ [Live Preview - see above]                 │
│               │                                            │
│               │ [Save] [Save & Schedule] [Cancel]          │
└───────────────┴─────────────────────────────────────────────┘
```

## Component Specifications

### BannerStatusBadge Component
```tsx
interface BannerStatusBadgeProps {
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  startDate?: Date;
  endDate?: Date;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800' },
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
};
```

### BannerPreview Component
```tsx
interface BannerPreviewProps {
  banner: Banner;
  mode: 'desktop' | 'mobile';
}

// Renders a live preview using the actual banner styling
// but scaled down for the admin interface
```

### ColorPicker Component
```tsx
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Uses a color picker library with hex/rgb/hsl support
// Shows recent colors and preset palette
```

## State Management

### Banner Form State
```typescript
interface BannerFormState {
  // Basic
  title: string;
  subtitle: string;
  offerText: string;
  ctaText: string;
  
  // Visual
  imageUrl: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage: string;
  
  // Scheduling
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
  
  // Behavior
  link: string;
  discountId: string | null;
  
  // Display
  sortOrder: number;
  priority: 1 | 2 | 3;
  
  // Validation
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}
```

## Integration Points

### 1. Image Upload Integration
- Uses existing `/api/admin/upload` endpoint
- Supports drag & drop
- Image optimization and resizing
- Cloudinary integration for CDN

### 2. Discount Selection Integration
- Fetches active discounts from API
- Searchable dropdown
- Shows discount details on hover

### 3. Product Link Integration
- Product search for link URL
- Auto-generates product page URLs
- Validation for valid product IDs

## Responsive Design

### Mobile View
- Stacked layout for form sections
- Simplified preview
- Touch-friendly controls
- Mobile-optimized date pickers

### Tablet View
- Split layout for form and preview
- Collapsible sections
- Adaptive grid for lists

## Accessibility Features

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for status changes
- High contrast mode support
- Focus management in modals

## Performance Considerations

- Lazy loading for banner images in lists
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic updates for quick actions
- Client-side caching of recent banners