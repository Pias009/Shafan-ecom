# Promotional Dashboard - API Endpoints Design

## Overview
This document outlines the REST API endpoints for managing promotional banners and discounts in the admin dashboard.

## API Base Path
- Admin endpoints: `/api/admin/promotional/`
- Public endpoints: `/api/promotional/`

## Authentication & Authorization
- All admin endpoints require ADMIN or SUPERADMIN role
- Public endpoints are accessible to all users

## 1. Banner Management Endpoints

### 1.1 Get All Banners (Admin)
```
GET /api/admin/promotional/banners
```
**Query Parameters:**
- `status`: active, scheduled, expired, all (default: all)
- `page`: pagination page number (default: 1)
- `limit`: items per page (default: 20)
- `sort`: field to sort by (createdAt, startDate, priority)
- `order`: asc or desc (default: desc)

**Response:**
```json
{
  "banners": [
    {
      "id": "string",
      "imageUrl": "string",
      "title": "string | null",
      "subtitle": "string | null",
      "offerText": "string | null",
      "ctaText": "string | null",
      "backgroundColor": "string | null",
      "textColor": "string | null",
      "backgroundImage": "string | null",
      "startDate": "ISO date | null",
      "endDate": "ISO date | null",
      "active": "boolean",
      "link": "string | null",
      "discountId": "string | null",
      "sortOrder": "number",
      "priority": "number",
      "clicks": "number",
      "conversions": "number",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 1.2 Get Single Banner (Admin)
```
GET /api/admin/promotional/banners/:id
```

### 1.3 Create Banner (Admin)
```
POST /api/admin/promotional/banners
```
**Request Body:**
```json
{
  "imageUrl": "string (required)",
  "title": "string",
  "subtitle": "string",
  "offerText": "string",
  "ctaText": "string",
  "backgroundColor": "string",
  "textColor": "string",
  "backgroundImage": "string",
  "startDate": "ISO date",
  "endDate": "ISO date",
  "active": "boolean",
  "link": "string",
  "discountId": "string",
  "sortOrder": "number",
  "priority": "number"
}
```

### 1.4 Update Banner (Admin)
```
PUT /api/admin/promotional/banners/:id
```
**Request Body:** Same as create (all fields optional)

### 1.5 Delete Banner (Admin)
```
DELETE /api/admin/promotional/banners/:id
```

### 1.6 Update Banner Status (Admin)
```
PATCH /api/admin/promotional/banners/:id/status
```
**Request Body:**
```json
{
  "active": "boolean"
}
```

### 1.7 Track Banner Click (Public)
```
POST /api/promotional/banners/:id/click
```
**Request Body:**
```json
{
  "source": "homepage | product | email",
  "userId": "string (optional)"
}
```

### 1.8 Get Active Banners (Public)
```
GET /api/promotional/banners/active
```
**Response:** Array of active banners (filtered by date and active status)

## 2. Discount Management Endpoints

### 2.1 Get All Discounts (Admin)
```
GET /api/admin/promotional/discounts
```
**Query Parameters:**
- `status`: active, scheduled, expired, all (default: all)
- `type`: percentage, fixed, shipping, all (default: all)
- `page`, `limit`, `sort`, `order`: same as banners

**Response:** Paginated list of discounts with product/category associations

### 2.2 Get Single Discount (Admin)
```
GET /api/admin/promotional/discounts/:id
```
**Response:** Discount with detailed product/category associations

### 2.3 Create Discount (Admin)
```
POST /api/admin/promotional/discounts
```
**Request Body:**
```json
{
  "code": "string (optional)",
  "name": "string (required)",
  "description": "string",
  "discountType": "PERCENTAGE | FIXED_AMOUNT | FREE_SHIPPING",
  "value": "number (required)",
  "applyToAll": "boolean",
  "minimumOrderValue": "number",
  "startDate": "ISO date",
  "endDate": "ISO date",
  "maxUses": "number",
  "active": "boolean",
  "autoApply": "boolean",
  "productIds": ["string[]"],
  "categoryIds": ["string[]"]
}
```

### 2.4 Update Discount (Admin)
```
PUT /api/admin/promotional/discounts/:id
```
**Request Body:** Same as create (all fields optional)

### 2.5 Delete Discount (Admin)
```
DELETE /api/admin/promotional/discounts/:id
```

### 2.6 Validate Discount (Public)
```
POST /api/promotional/discounts/validate
```
**Request Body:**
```json
{
  "code": "string",
  "productIds": ["string[]"],
  "subtotal": "number"
}
```
**Response:**
```json
{
  "valid": "boolean",
  "discount": {
    "id": "string",
    "name": "string",
    "discountType": "string",
    "value": "number",
    "description": "string"
  },
  "discountAmount": "number",
  "message": "string"
}
```

### 2.7 Apply Discount to Order (Public)
```
POST /api/promotional/discounts/apply
```
**Request Body:**
```json
{
  "code": "string",
  "orderId": "string",
  "userId": "string (optional)"
}
```

### 2.8 Get Discount Usage Statistics (Admin)
```
GET /api/admin/promotional/discounts/:id/usage
```
**Response:** Usage statistics and history

## 3. Product Selection Endpoints

### 3.1 Search Products for Discount (Admin)
```
GET /api/admin/promotional/products/search
```
**Query Parameters:**
- `q`: search query
- `categoryId`: filter by category
- `brandId`: filter by brand
- `inStockOnly`: boolean
- `page`, `limit`: pagination

**Response:** List of products with basic info

### 3.2 Bulk Apply Discount to Products (Admin)
```
POST /api/admin/promotional/discounts/:id/products/bulk
```
**Request Body:**
```json
{
  "productIds": ["string[]"],
  "action": "add | remove | replace"
}
```

### 3.3 Get Products with Active Discounts (Admin)
```
GET /api/admin/promotional/products/discounted
```
**Response:** Products with their active discounts

## 4. Analytics Endpoints

### 4.1 Get Banner Performance (Admin)
```
GET /api/admin/promotional/analytics/banners
```
**Query Parameters:**
- `startDate`: ISO date
- `endDate`: ISO date
- `bannerId`: specific banner

**Response:** Click-through rates, conversions, performance metrics

### 4.2 Get Discount Performance (Admin)
```
GET /api/admin/promotional/analytics/discounts
```
**Response:** Usage statistics, revenue impact, popular discounts

### 4.3 Get Promotional Dashboard Summary (Admin)
```
GET /api/admin/promotional/analytics/summary
```
**Response:** Overview of active promotions, performance metrics

## 5. Schedule Management Endpoints

### 5.1 Get Scheduled Promotions (Admin)
```
GET /api/admin/promotional/schedule
```
**Query Parameters:**
- `startDate`: ISO date
- `endDate`: ISO date
- `type`: banner, discount, all

**Response:** Calendar view of scheduled promotions

### 5.2 Update Promotion Schedule (Admin)
```
PUT /api/admin/promotional/:type/:id/schedule
```
**Request Body:**
```json
{
  "startDate": "ISO date",
  "endDate": "ISO date"
}
```

## Error Responses
All endpoints return standard error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `FORBIDDEN`: Insufficient permissions
- `DISCOUNT_EXPIRED`: Discount is no longer valid
- `MAX_USES_EXCEEDED`: Discount usage limit reached
- `MINIMUM_ORDER_NOT_MET`: Order value below minimum

## Implementation Notes

1. **Caching**: Public endpoints should be cached (Redis) for performance
2. **Validation**: All dates and values should be validated server-side
3. **Audit Logging**: All admin actions should be logged
4. **Rate Limiting**: Apply rate limits to public endpoints
5. **Webhooks**: Consider webhooks for promotion expiration notifications