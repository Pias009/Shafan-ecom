# Promotional Dashboard - Scheduling & Expiration System

## Overview
This document outlines the comprehensive scheduling and expiration system for promotional banners and discounts, enabling automatic activation/deactivation based on time-based rules.

## Core Requirements
1. **Flexible Scheduling**: Start/end dates with timezone support
2. **Automatic Expiration**: Both time-based and usage-based expiration
3. **Recurring Promotions**: Daily, weekly, monthly, or custom recurrence
4. **Grace Periods**: Configurable buffer periods before/after expiration
5. **Notifications**: Alerts for upcoming expirations
6. **Calendar View**: Visual scheduling interface
7. **Conflict Detection**: Prevent overlapping promotions
8. **Status Tracking**: Clear visibility of active/scheduled/expired promotions

## System Architecture

### 1. Scheduling Engine
**Central service that manages promotion lifecycle**

```typescript
interface SchedulingEngine {
  // Schedule management
  schedulePromotion(promotion: Promotion, schedule: Schedule): Promise<void>;
  unschedulePromotion(promotionId: string): Promise<void>;
  reschedulePromotion(promotionId: string, newSchedule: Schedule): Promise<void>;
  
  // Status queries
  getActivePromotions(): Promise<Promotion[]>;
  getScheduledPromotions(startDate: Date, endDate: Date): Promise<ScheduledPromotion[]>;
  getExpiringPromotions(withinHours: number): Promise<Promotion[]>;
  
  // Automation
  checkAndUpdatePromotions(): Promise<void>;
  processExpiredPromotions(): Promise<void>;
}
```

### 2. Schedule Data Model
```typescript
interface Schedule {
  // Basic scheduling
  startDate: Date;
  endDate: Date | null; // null for no end date
  timezone: string; // e.g., "America/New_York"
  
  // Recurrence patterns
  recurrence: RecurrencePattern | null;
  
  // Activation rules
  activationType: 'immediate' | 'scheduled' | 'manual';
  activationConditions: ActivationCondition[];
  
  // Expiration rules
  expirationType: 'date' | 'usage' | 'manual' | 'never';
  expirationConditions: ExpirationCondition[];
  
  // Grace periods
  preActivationGrace: number; // minutes before activation to prepare
  postExpirationGrace: number; // minutes after expiration to clean up
  
  // Status
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled';
  lastChecked: Date | null;
}

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // e.g., 2 for every 2 days
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  months?: number[]; // 0-11 for January-December
  endAfterOccurrences?: number; // Stop after N occurrences
  endDate?: Date; // Stop after this date
}

interface ActivationCondition {
  type: 'time' | 'inventory' | 'sales' | 'custom';
  condition: any; // Condition-specific configuration
}

interface ExpirationCondition {
  type: 'time' | 'usage_limit' | 'sales_target' | 'inventory' | 'custom';
  condition: any;
}
```

## Scheduling Components

### 1. ScheduleForm Component
**UI for configuring promotion schedules**

**Features:**
- Date/time pickers with timezone support
- Recurrence pattern builder
- Visual calendar for date selection
- Condition builder for activation/expiration rules
- Preview of schedule timeline

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Schedule Configuration                                      │
├─────────────────────────────────────────────────────────────┤
│ [●] Start immediately     [○] Schedule for later           │
│                                                           │
│ Start Date:  [📅 2024-06-01 09:00 AM   ] [Timezone: EST ▼]│
│ End Date:    [📅 2024-06-30 23:59 PM   ] [Never end     ]│
│                                                           │
│ [✓] Recurring Promotion                                   │
│   Pattern: [Weekly ▼] Every [1] week(s) on [Mon, Wed, Fri]│
│   End: [After 4 occurrences] [On 2024-12-31]              │
│                                                           │
│ Activation Conditions:                                     │
│ [ + Add Condition ]                                        │
│ • When inventory > 100 units                              │
│ • When sales target reached                               │
│                                                           │
│ Expiration Conditions:                                     │
│ [ + Add Condition ]                                        │
│ • After 1000 uses                                         │
│ • When inventory < 10 units                               │
│                                                           │
│ [Preview Schedule] [Save Schedule]                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. PromotionCalendar Component
**Visual calendar view of all scheduled promotions**

**Features:**
- Month/week/day views
- Color-coded by promotion type (banner, discount, etc.)
- Drag & drop rescheduling
- Quick create/edit from calendar cells
- Conflict detection visual indicators
- Filter by promotion status/type

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Promotion Calendar - June 2024                             │
├─────────────────────────────────────────────────────────────┤
│ [<] June 2024 [>] [Month] [Week] [Day] [List]             │
│                                                           │
│ Sun Mon Tue Wed Thu Fri Sat                              │
│                                                    1      │
│  2   3   4   5   6   7   8                              │
│  ┌─┐ ┌─┐ ┌─────────────────┐                           │
│  │B│ │D│ │ Summer Sale     │                           │
│  └─┘ └─┘ │ Jun 5-15        │                           │
│  9  10  11  12  13  14  15                              │
│  ┌─────────────────┐ ┌─┐ ┌─┐                           │
│  │ Back to School  │ │B│ │D│                           │
│  │ Jun 12-30       │ └─┘ └─┘                           │
│ 16  17  18  19  20  21  22                              │
│ 23  24  25  26  27  28  29                              │
│ 30                                                    │
│                                                           │
│ Legend: [B] Banner [D] Discount [S] Sale                │
└─────────────────────────────────────────────────────────────┘
```

### 3. ScheduleTimeline Component
**Visual timeline of promotion schedule**

**Features:**
- Gantt-chart style timeline
- Zoom in/out for different time scales
- Dependency lines between promotions
- Milestone markers
- Critical path visualization

### 4. ExpirationManager Component
**Dashboard for managing expiring promotions**

**Features:**
- List of promotions expiring soon
- Bulk extension options
- Renewal workflows
- Performance analysis of expiring promotions
- Archive expired promotions

## Expiration Types

### 1. Time-Based Expiration
```typescript
interface TimeBasedExpiration {
  type: 'time';
  endDate: Date;
  timezone: string;
  gracePeriod: number; // minutes
  actionOnExpire: 'deactivate' | 'archive' | 'notify';
}
```

**Use Cases:**
- Seasonal sales (Summer Sale ends August 31)
- Flash sales (24-hour sale)
- Holiday promotions (Christmas sale ends Dec 25)

### 2. Usage-Based Expiration
```typescript
interface UsageBasedExpiration {
  type: 'usage';
  maxUses: number;
  maxUsesPerCustomer?: number;
  currentUses: number;
  actionOnExpire: 'deactivate' | 'hide' | 'show_message';
}
```

**Use Cases:**
- Limited quantity discounts (First 100 customers)
- One-time use coupons
- Referral code limits

### 3. Inventory-Based Expiration
```typescript
interface InventoryBasedExpiration {
  type: 'inventory';
  productId: string;
  threshold: number; // When stock reaches this level
  actionOnExpire: 'deactivate' | 'change_discount' | 'notify';
}
```

**Use Cases:**
- While supplies last promotions
- Clearance sales for overstock
- Limited edition products

### 4. Sales Target Expiration
```typescript
interface SalesTargetExpiration {
  type: 'sales';
  targetAmount: number; // Revenue target
  targetQuantity?: number; // Units target
  currentAmount: number;
  actionOnExpire: 'deactivate' | 'escalate' | 'notify';
}
```

**Use Cases:**
- Volume discount tiers
- Stretch goal promotions
- Fundraising campaigns

### 5. Manual Expiration
```typescript
interface ManualExpiration {
  type: 'manual';
  expiresAt: Date | null; // Optional reminder date
  canExtend: boolean;
  extensionLimit: number; // Maximum extensions allowed
}
```

**Use Cases:**
- Test promotions
- Emergency price changes
- Temporary discounts

## Automation System

### 1. Schedule Worker
**Background job that processes scheduled promotions**

```typescript
class ScheduleWorker {
  async run() {
    while (true) {
      // Check for promotions to activate
      await this.activateDuePromotions();
      
      // Check for promotions to expire
      await this.expireDuePromotions();
      
      // Send notifications
      await this.sendScheduledNotifications();
      
      // Wait before next check
      await sleep(60 * 1000); // Check every minute
    }
  }
  
  async activateDuePromotions() {
    const duePromotions = await this.getPromotionsDueForActivation();
    
    for (const promotion of duePromotions) {
      try {
        await promotion.activate();
        await this.logActivation(promotion);
        await this.sendActivationNotification(promotion);
      } catch (error) {
        await this.handleActivationError(promotion, error);
      }
    }
  }
  
  async expireDuePromotions() {
    const duePromotions = await this.getPromotionsDueForExpiration();
    
    for (const promotion of duePromotions) {
      try {
        await promotion.expire();
        await this.logExpiration(promotion);
        await this.sendExpirationNotification(promotion);
      } catch (error) {
        await this.handleExpirationError(promotion, error);
      }
    }
  }
}
```

### 2. Notification System
**Sends alerts for schedule events**

```typescript
interface NotificationEvent {
  type: 'activation_imminent' | 'activated' | 'expiration_imminent' | 'expired' | 'schedule_conflict';
  promotion: Promotion;
  recipients: string[]; // Email addresses or user IDs
  sentAt: Date | null;
}

class NotificationService {
  async sendScheduleNotifications() {
    // Notify 24 hours before activation
    await this.sendPreActivationNotifications();
    
    // Notify 24 hours before expiration
    await this.sendPreExpirationNotifications();
    
    // Notify on activation
    await this.sendActivationNotifications();
    
    // Notify on expiration
    await this.sendExpirationNotifications();
  }
}
```

## Conflict Detection & Resolution

### 1. Conflict Types
```typescript
enum ConflictType {
  TIME_OVERLAP = 'time_overlap', // Two promotions active simultaneously
  PRODUCT_OVERLAP = 'product_overlap', // Same product in multiple promotions
  DISCOUNT_STACKING = 'discount_stacking', // Multiple discounts on same product
  RESOURCE_CONFLICT = 'resource_conflict', // Banner slot conflict
  BUSINESS_RULE = 'business_rule', // Violates business rules
}
```

### 2. Conflict Detection Algorithm
```typescript
class ConflictDetector {
  async detectConflicts(promotion: Promotion): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    
    // Check time overlaps
    const timeConflicts = await this.checkTimeOverlaps(promotion);
    conflicts.push(...timeConflicts);
    
    // Check product overlaps
    const productConflicts = await this.checkProductOverlaps(promotion);
    conflicts.push(...productConflicts);
    
    // Check discount stacking
    const stackingConflicts = await this.checkDiscountStacking(promotion);
    conflicts.push(...stackingConflicts);
    
    // Check business rules
    const ruleConflicts = await this.checkBusinessRules(promotion);
    conflicts.push(...ruleConflicts);
    
    return conflicts;
  }
}
```

### 3. Conflict Resolution Strategies
1. **Automatic Resolution**: System automatically adjusts schedule
2. **Manual Resolution**: Admin must resolve conflicts
3. **Priority-Based**: Higher priority promotions take precedence
4. **First-Come-First-Served**: Earlier scheduled promotions win
5. **Split Scheduling**: Divide time between conflicting promotions

## Status Tracking & Reporting

### 1. Promotion Status Lifecycle
```
Draft → Scheduled → Active → Expired → Archived
         ↑           ↑
       Cancel      Extend
```

### 2. Status Dashboard
**Real-time view of promotion status**

```
┌─────────────────────────────────────────────────────────────┐
│ Promotion Status Dashboard                                 │
├─────────────────────────────────────────────────────────────┤
│ Active: 12 promotions                                      │
│   • 8 banners                                             │
│   • 4 discounts                                           │
│                                                           │
│ Scheduled: 5 promotions (next 7 days)                    │
│   • Starts tomorrow: Summer Sale                         │
│   • Starts in 3 days: Back to School                     │
│                                                           │
│ Expiring Soon: 3 promotions (next 48 hours)              │
│   • Expires today: Spring Clearance                      │
│   • Expires tomorrow: Welcome Discount                   │
│                                                           │
│ Conflicts: 1 detected                                     │
│   • Time overlap: Summer Sale & Flash Sale               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Schedule Audit Log
**Track all schedule changes**

```typescript
interface ScheduleAuditLog {
  id: string;
  promotionId: string;
  action: 'schedule' | 'unschedule' | 'reschedule' | 'activate' | 'expire' | 'extend';
  oldSchedule: Schedule | null;
  newSchedule: Schedule | null;
  performedBy: string; // User ID or 'system'
  performedAt: Date;
  reason?: string;
}
```

## Implementation Considerations

### 1. Timezone Handling
```typescript
// Store all dates in UTC
// Convert to local timezone for display
// Handle daylight saving time transitions
class TimezoneService {
  static toUTC(date: Date, timezone: string): Date {
    // Convert from local timezone to UTC
  }
  
  static fromUTC(date: Date, timezone: string): Date {
    // Convert from UTC to local timezone
  }
}
```

### 2. Scalability
- Use message queues for schedule processing
- Implement database indexing for date queries
- Cache frequently accessed schedules
- Batch process expiration checks

### 3. Reliability
- Implement retry logic for failed activations/expirations
- Maintain audit trail of all schedule changes
- Regular backup of schedule data
- Monitor schedule worker health

### 4. Performance Optimization
```typescript
// Use database views for common queries
CREATE VIEW active_promotions AS
SELECT * FROM promotions
WHERE status = 'active'
AND (start_date <= NOW() AND (end_date IS NULL OR end_date > NOW()));

// Index critical columns
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
```

## Integration Points

### 1. Email Notification Integration
- Send schedule confirmation emails
- Alert admins of expiring promotions
- Notify customers of upcoming sales
- Send performance reports

### 2. Analytics Integration
- Track schedule adherence
- Measure promotion performance by time slot
- Analyze optimal scheduling patterns
- Predict future schedule conflicts

### 3. External Calendar Integration
- Sync with Google Calendar
- Export to iCal format
- Share schedules with team members
- Public promotion calendar

## Security Considerations

### 1. Access Control
- Role-based schedule management
- Approval workflows for major schedule changes
- Audit logs for all schedule modifications
- IP restriction for schedule API

### 2. Data Validation
- Validate schedule dates (no past dates, reasonable ranges)
- Prevent infinite recurrence loops
- Validate timezone strings
- Sanitize schedule descriptions

### 3. Rate Limiting
- Limit schedule changes per hour
- Prevent rapid schedule toggling
- Queue large batch schedule operations
- Implement cool-down periods