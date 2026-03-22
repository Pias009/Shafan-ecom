# Promotional Dashboard - Database Schema Design

## Overview
This document outlines the enhanced database schema for the comprehensive admin dashboard for promotional offer banners and discount management.

## Current Schema Analysis
The existing system has:
1. `OfferBanner` model - Basic banner with imageUrl, title, subtitle, link, sortOrder, active
2. `Product` model - Has `discountCents` field for simple discounts
3. No dedicated discount management system

## Enhanced Schema Design

### 1. Enhanced OfferBanner Model
```prisma
model EnhancedOfferBanner {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  // Core content
  imageUrl          String   @unique
  title             String?
  subtitle          String?
  offerText         String?  // e.g., "70% OFF" or "$50 OFF"
  ctaText           String?  // Custom CTA button text
  
  // Visual customization
  backgroundColor   String?  // Hex color for background
  textColor         String?  // Hex color for text
  backgroundImage   String?  // Alternative to imageUrl for full background
  
  // Scheduling
  startDate         DateTime?
  endDate           DateTime?
  active            Boolean  @default(true)
  
  // Behavior
  link              String?  // Product page URL or discount code
  discountId        String?  @db.ObjectId  // Associated discount
  discount          Discount? @relation(fields: [discountId], references: [id])
  
  // Display
  sortOrder         Int      @default(0)
  priority          Int      @default(1)  // 1=Low, 2=Medium, 3=High
  
  // Tracking
  clicks            Int      @default(0)
  conversions       Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([active, startDate, endDate])
  @@index([sortOrder])
}
```

### 2. Discount Model
```prisma
model Discount {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  code              String?  @unique  // Optional discount code
  name              String   // Display name
  description       String?
  
  // Discount type and value
  discountType      DiscountType  @default(PERCENTAGE)
  value             Float         // e.g., 20 for 20% or 15.50 for $15.50
  
  // Application scope
  applyToAll        Boolean  @default(false)
  minimumOrderValue Int?     // Minimum order amount in cents
  
  // Validity
  startDate         DateTime?
  endDate           DateTime?
  maxUses           Int?     // Maximum number of uses
  uses              Int      @default(0)  // Current usage count
  
  // Status
  active            Boolean  @default(true)
  autoApply         Boolean  @default(false)  // Auto-apply to eligible products
  
  // Relationships
  products          Product[]  @relation("DiscountProducts")
  categories        Category[] @relation("DiscountCategories")
  banners           EnhancedOfferBanner[]  // Banners that use this discount
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([active, startDate, endDate])
  @@index([code])
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

### 3. ProductDiscount Junction (for many-to-many)
```prisma
model ProductDiscount {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  productId   String   @db.ObjectId
  discountId  String   @db.ObjectId
  product     Product  @relation(fields: [productId], references: [id])
  discount    Discount @relation(fields: [discountId], references: [id])
  createdAt   DateTime @default(now())
  
  @@unique([productId, discountId])
  @@index([discountId])
}
```

### 4. CategoryDiscount Junction
```prisma
model CategoryDiscount {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  categoryId  String   @db.ObjectId
  discountId  String   @db.ObjectId
  category    Category @relation(fields: [categoryId], references: [id])
  discount    Discount @relation(fields: [discountId], references: [id])
  createdAt   DateTime @default(now())
  
  @@unique([categoryId, discountId])
  @@index([discountId])
}
```

### 5. DiscountUsage Tracking
```prisma
model DiscountUsage {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  discountId  String   @db.ObjectId
  userId      String?  @db.ObjectId
  orderId     String?  @db.ObjectId
  email       String?  // For guest users
  amountSaved Int      // Amount saved in cents
  usedAt      DateTime @default(now())
  
  discount    Discount @relation(fields: [discountId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
  order       Order?   @relation(fields: [orderId], references: [id])
  
  @@index([discountId])
  @@index([userId])
  @@index([orderId])
}
```

## Schema Migration Strategy

### Phase 1: Add New Models
1. Create new `EnhancedOfferBanner`, `Discount`, `ProductDiscount`, `CategoryDiscount`, `DiscountUsage` models
2. Keep existing `OfferBanner` for backward compatibility during migration

### Phase 2: Data Migration
1. Copy existing banners to new model with default values
2. Create discounts from existing product `discountCents` values

### Phase 3: Update Application
1. Update frontend to use new models
2. Update API endpoints
3. Remove old `OfferBanner` model once migration complete

## Key Features Enabled

### For Banners:
- **Scheduling**: Start/end dates for automatic activation
- **Customization**: Background colors, images, text colors
- **Offer amounts**: Configurable offer text (70% OFF, $50 OFF, etc.)
- **Priority system**: Control which banners show first
- **Analytics**: Track clicks and conversions

### For Discounts:
- **Multiple discount types**: Percentage, fixed amount, free shipping
- **Flexible application**: All products, selected products, or categories
- **Usage limits**: Maximum uses and minimum order value
- **Auto-expiration**: Based on end date or usage limits
- **Tracking**: Detailed usage analytics

### Integration:
- **Banner-Discount linking**: Banners can directly apply discounts
- **Auto-application**: Discounts automatically applied when clicking banners
- **Product selection**: Intuitive interface for selecting products/categories