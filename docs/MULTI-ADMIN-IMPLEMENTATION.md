# Multi-Admin Platform Implementation Documentation

## Overview

This document describes the implementation of a single-domain multi-administration platform with strict data segregation between UAE and Kuwait admin panels.

## Architecture

### Admin Roles

1. **SUPERADMIN** - Full access to all stores and data
2. **ADMIN (UAE)** - Access to UAE store data only, can manage global products
3. **ADMIN (Kuwait)** - Access to Kuwait store data only, cannot access UAE data

### Data Segregation Model

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERADMIN                           │
│              (Access to All Stores)                     │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
    ┌───────▼────────┐          ┌────────▼────────┐
    │   UAE Admin     │          │  Kuwait Admin   │
    │  (country=UAE)  │          │  (country=KW)   │
    └───────┬────────┘          └────────┬────────┘
            │                               │
    ┌───────▼────────┐          ┌────────▼────────┐
    │  UAE Store     │          │ Kuwait Store    │
    │  (code=UAE)   │          │  (code=KUW)    │
    └───────┬────────┘          └────────┬────────┘
            │                               │
    ┌───────▼────────┐          ┌────────▼────────┐
    │ UAE Orders     │          │ Kuwait Orders   │
    │ UAE Products  │          │ Kuwait Products │
    │ UAE Couriers  │          │ Kuwait Couriers│
    └────────────────┘          └────────────────┘
```

## Implementation Details

### 1. Core Access Control Library

**File:** [`src/lib/admin-store-guard.ts`](src/lib/admin-store-guard.ts)

This library provides the foundation for all access control:

- `getAdminStoreAccess()` - Returns admin's store access permissions
- `canAccessStore(storeCode)` - Checks if admin can access a specific store
- `getAccessibleStoreIds()` - Returns store IDs for database filtering
- `requireStoreAccess(storeCode)` - Server-side guard that redirects on unauthorized access
- `requireKuwaitAccess()` - Guard for Kuwait-specific pages
- `requireUAEAccess()` - Guard for UAE-specific pages

### 2. Data Segregation Rules

#### Orders
- Orders are strictly segregated by `storeId`
- UAE Admin can only see orders from UAE store
- Kuwait Admin can only see orders from Kuwait store
- SUPERADMIN can see all orders

#### Products
- Products can be shared across stores via `StoreInventory`
- UAE Admin can see global products (storeId=null) and UAE store products
- Kuwait Admin can only see Kuwait store products (no global access)
- Product inventory is managed per-store

#### Courier Services
- Courier services are strictly segregated by `storeId`
- Each store has its own set of courier services
- No sharing of courier configurations between stores

#### Users
- Users can place orders in multiple stores
- Admins can only see users who have placed orders in their accessible stores
- User data is not segregated by country, but access is filtered by order history

### 3. Modified Files

#### Server Components
- [`src/app/ueadmin/kuwait/page.tsx`](src/app/ueadmin/kuwait/page.tsx) - Kuwait dashboard with access control
- [`src/app/ueadmin/kuwait/orders/page.tsx`](src/app/ueadmin/kuwait/orders/page.tsx) - Kuwait orders with access control
- [`src/app/ueadmin/dashboard/page.tsx`](src/app/ueadmin/dashboard/page.tsx) - UAE dashboard with store filtering

#### API Routes
- [`src/app/api/admin/orders/route.ts`](src/app/api/admin/orders/route.ts) - Orders API with store filtering
- [`src/app/api/admin/products/route.ts`](src/app/api/admin/products/route.ts) - Products API with access control

#### New Files
- [`src/lib/admin-store-guard.ts`](src/lib/admin-store-guard.ts) - Core access control library
- [`src/app/ueadmin/unauthorized/page.tsx`](src/app/ueadmin/unauthorized/page.tsx) - Unauthorized access page
- [`prisma/seed-multi-admin.ts`](prisma/seed-multi-admin.ts) - Database seeding script
- [`scripts/test-multi-admin-security.ts`](scripts/test-multi-admin-security.ts) - Security test suite

## Security Features

### 1. Server-Side Access Control
All admin pages enforce access control at the server component level before rendering:

```typescript
export default async function KuwaitDashboard() {
  // Enforce strict access control - only Kuwait admins can access this page
  await requireKuwaitAccess();
  // ... rest of component
}
```

### 2. API Route Protection
All API routes filter data based on admin's accessible store IDs:

```typescript
const accessibleStoreIds = await getAccessibleStoreIds();
const orders = await prisma.order.findMany({
  where: { storeId: { in: accessibleStoreIds } }
});
```

### 3. Country-Based Assignment
Admin access is determined by the `country` field in the User model:
- `country='UAE'` → UAE Admin access
- `country='KW'` → Kuwait Admin access
- No country → No access

### 4. Global Admin Privileges
UAE Admins have `isGlobalAdmin=true`, allowing them to:
- Manage global products (storeId=null)
- Access all UAE store data
- Cannot access Kuwait-specific data

## Database Schema

### Store Model
```prisma
model Store {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  code      String   @unique  // 'UAE', 'KUW'
  name      String
  country   String   // 'UAE', 'KW'
  region    String
  active    Boolean  @default(true)
  currency  String   @default("usd")
  // ... relations
}
```

### StoreInventory Model
```prisma
model StoreInventory {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  storeId   String   @db.ObjectId
  productId String   @db.ObjectId
  quantity  Int
  price     Float
  
  @@unique([storeId, productId])
}
```

## Setup Instructions

### 1. Seed the Database

Run the multi-admin seed script to create stores, admin users, and sample data:

```bash
npx tsx prisma/seed-multi-admin.ts
```

This creates:
- UAE Store (code: UAE)
- Kuwait Store (code: KUW)
- UAE Admin (uae-admin@shafanglobal.com)
- Kuwait Admin (kuwait-admin@shafanglobal.com)
- SUPERADMIN (superadmin@shafanglobal.com)
- Sample products, orders, and courier services

### 2. Admin Credentials

| Role | Email | Password | Access |
|------|--------|----------|---------|
| UAE Admin | uae-admin@shafanglobal.com | Admin123! | UAE Store only |
| Kuwait Admin | kuwait-admin@shafanglobal.com | Admin123! | Kuwait Store only |
| SUPERADMIN | superadmin@shafanglobal.com | Admin123! | All stores |

### 3. Run Security Tests

Verify the implementation with the security test suite:

```bash
npx tsx scripts/test-multi-admin-security.ts
```

Expected output: 18/18 tests passing (100% success rate)

## Access Control Matrix

| Resource | UAE Admin | Kuwait Admin | SUPERADMIN |
|----------|-----------|--------------|-------------|
| UAE Orders | ✅ | ❌ | ✅ |
| Kuwait Orders | ❌ | ✅ | ✅ |
| UAE Products | ✅ | ❌ | ✅ |
| Kuwait Products | ❌ | ✅ | ✅ |
| Global Products | ✅ | ❌ | ✅ |
| UAE Couriers | ✅ | ❌ | ✅ |
| Kuwait Couriers | ❌ | ✅ | ✅ |
| UAE Users | ✅ | ❌ | ✅ |
| Kuwait Users | ❌ | ✅ | ✅ |

## Troubleshooting

### Kuwait Admin Connection Error

**Symptom:** Kuwait Admin panel shows "Connection Failed" error

**Solution:**
1. Ensure Kuwait Store exists in database: `code='KUW'`
2. Ensure Kuwait Admin user has `country='KW'`
3. Run seed script: `npx tsx prisma/seed-multi-admin.ts`
4. Check browser console for specific error messages

### Access Denied Errors

**Symptom:** Admin redirected to unauthorized page

**Solution:**
1. Verify admin user's `country` field matches target store
2. Ensure store is active (`active=true`)
3. Check that admin role is 'ADMIN' or 'SUPERADMIN'

### Data Visibility Issues

**Symptom:** Admin cannot see expected data

**Solution:**
1. Verify data has correct `storeId`
2. Check admin's accessible store IDs
3. Run security tests to verify configuration

## Deployment Checklist

### Environment Variables
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Application URL

### Vercel Deployment
1. Push code to repository
2. Connect Vercel to repository
3. Set environment variables in Vercel dashboard
4. Deploy

### Post-Deployment Steps
1. Run seed script in production environment
2. Create admin users with strong passwords
3. Configure courier services for each region
4. Set up payment integrations
5. Test access control with each admin role

## Security Considerations

### Implemented Protections
1. ✅ Server-side access control on all admin pages
2. ✅ API route data filtering by store
3. ✅ Country-based admin assignment
4. ✅ Unauthorized access redirect
5. ✅ Strict data segregation by storeId

### Recommended Enhancements
1. Add audit logging for all admin actions
2. Implement IP-based access restrictions
3. Add MFA requirement for admin login
4. Implement session timeout for admin users
5. Add rate limiting to admin API routes

## Support

For issues or questions:
1. Check this documentation
2. Run security test suite
3. Review browser console for errors
4. Check server logs for detailed error messages
