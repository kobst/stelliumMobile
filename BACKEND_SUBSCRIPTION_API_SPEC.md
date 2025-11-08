# Backend Subscription API Specification

## Overview

This document specifies the backend API endpoints required to support the Stellium mobile app's subscription system. The system uses a three-tier pricing model (Free, Premium, Pro) with usage tracking, RevenueCat integration for payments, and Stripe for billing.

**Version:** 1.0
**Last Updated:** 2025-10-16

---

## Table of Contents

1. [Subscription Tiers & Pricing](#subscription-tiers--pricing)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [Webhook Endpoints](#webhook-endpoints)
5. [Usage Reset Logic](#usage-reset-logic)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)

---

## Subscription Tiers & Pricing

### Free Plan ($0/month)

**Limits:**
- Quick Charts: 5 per month (combined with Quick Matches)
- Quick Matches: 5 per month (combined with Quick Charts)
- Reports: 0
- Chat Questions: 0

**Features:**
- ✅ Your Quick Chart (at signup)
- ✅ Weekly horoscope (personalized)
- ❌ Daily/Monthly horoscopes
- ❌ Natal Reports
- ❌ Compatibility Reports
- ❌ AI Chat

### Premium Plan ($20/month)

**Limits:**
- Quick Charts: 10 per month
- Quick Matches: 10 per month
- Reports: 2 per month (NO rollover - resets monthly)
- Chat Questions: 100 per month

**Features:**
- ✅ All Free features
- ✅ Your Natal Report included at signup
- ✅ Daily + Weekly + Monthly horoscopes
- ✅ 2 Reports/month (Natal or Compatibility)
- ✅ 100 AI chat questions per month
  - Transit Chat
  - Chart Chat (for anyone with a Natal Report)
  - Relationship Chat (for any pair with a Compatibility Report)

### Pro Plan ($49/month)

**Limits:**
- Quick Charts: Unlimited
- Quick Matches: Unlimited
- Reports: 10 per month (NO rollover - resets monthly)
- Chat Questions: Unlimited

**Features:**
- ✅ Everything in Premium
- ✅ 10 Reports/month
- ✅ Unlimited Quick actions
- ✅ Unlimited chat cap

---

## Data Models

### UserSubscription

Stored in the `users` collection or a dedicated `subscriptions` collection.

```typescript
{
  userId: ObjectId,                    // Reference to user
  tier: "free" | "premium" | "pro",   // Current subscription tier
  status: "active" | "expired" | "cancelled" | "trial",

  // Dates
  subscriptionAnniversary: ISODate,   // Date when usage resets monthly (e.g., 15th of each month)
  expiresAt?: ISODate,                // When subscription expires (if cancelled)
  renewsAt?: ISODate,                 // Next billing date
  cancelledAt?: ISODate,              // When user cancelled (remains active until expiresAt)
  createdAt: ISODate,
  updatedAt: ISODate,

  // Payment Integration
  revenueCatCustomerId?: string,      // RevenueCat customer ID
  revenueCatEntitlementId?: string,   // Active entitlement ID
  stripeCustomerId?: string,          // Stripe customer ID
  stripeSubscriptionId?: string       // Stripe subscription ID
}
```

### UsageMetrics

Stored as a sub-document of the user or in a separate `usage_metrics` collection.

```typescript
{
  userId: ObjectId,

  // Current usage counts (reset on subscriptionAnniversary)
  quickChartsUsed: number,            // Combined charts created this period
  quickMatchesUsed: number,           // Combined matches created this period
  reportsUsed: number,                // Reports generated this period
  chatQuestionsUsed: number,          // Chat queries used this period

  // Reset tracking
  lastResetDate: ISODate,             // Last time usage was reset
  nextResetDate: ISODate,             // Next reset date (subscriptionAnniversary)

  // Metadata
  updatedAt: ISODate
}
```

### SubscriptionEntitlements (Computed)

This is NOT stored but computed based on the user's subscription tier. Return this with every subscription status request.

```typescript
{
  // Horoscope access
  canAccessWeeklyHoroscope: boolean,
  canAccessDailyHoroscope: boolean,
  canAccessMonthlyHoroscope: boolean,

  // Report access
  canGenerateNatalReport: boolean,
  canGenerateCompatibilityReport: boolean,

  // Chart access
  canCreateQuickCharts: boolean,
  canCreateQuickMatches: boolean,

  // Chat access
  canUseTransitChat: boolean,
  canUseChartChat: boolean,
  canUseRelationshipChat: boolean,

  // Unlimited flags
  hasUnlimitedCharts: boolean,
  hasUnlimitedMatches: boolean,
  hasUnlimitedChat: boolean,

  // Limits (computed from tier)
  quickChartsLimit: number | "unlimited",
  quickMatchesLimit: number | "unlimited",
  reportsLimit: number,
  chatQuestionsLimit: number | "unlimited"
}
```

---

## API Endpoints

### 1. Initialize Subscription (New User)

**Endpoint:** `POST /users/:userId/subscription/initialize`

**Description:** Called when a new user signs up. Creates a free subscription and initializes usage metrics.

**Request Body:**
```json
{
  "tier": "free"  // Optional, defaults to "free"
}
```

**Response:** `201 Created`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "free",
    "status": "active",
    "subscriptionAnniversary": "2025-10-16T00:00:00.000Z",
    "createdAt": "2025-10-16T14:32:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "usage": {
    "userId": "507f1f77bcf86cd799439011",
    "quickChartsUsed": 0,
    "quickMatchesUsed": 0,
    "reportsUsed": 0,
    "chatQuestionsUsed": 0,
    "lastResetDate": "2025-10-16T00:00:00.000Z",
    "nextResetDate": "2025-11-16T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "entitlements": {
    "canAccessWeeklyHoroscope": true,
    "canAccessDailyHoroscope": false,
    "canAccessMonthlyHoroscope": false,
    "canGenerateNatalReport": false,
    "canGenerateCompatibilityReport": false,
    "canCreateQuickCharts": true,
    "canCreateQuickMatches": true,
    "canUseTransitChat": false,
    "canUseChartChat": false,
    "canUseRelationshipChat": false,
    "hasUnlimitedCharts": false,
    "hasUnlimitedMatches": false,
    "hasUnlimitedChat": false,
    "quickChartsLimit": 5,
    "quickMatchesLimit": 5,
    "reportsLimit": 0,
    "chatQuestionsLimit": 0
  }
}
```

**Business Logic:**
- Set `subscriptionAnniversary` to current date/time
- Set `nextResetDate` to 1 month from now
- Initialize all usage counters to 0
- Default tier is "free" if not specified

---

### 2. Get Subscription Status

**Endpoint:** `GET /users/:userId/subscription`

**Description:** Returns current subscription, usage, and entitlements. Called on app login and when checking access.

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",
    "status": "active",
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",
    "renewsAt": "2025-11-15T00:00:00.000Z",
    "createdAt": "2025-09-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T08:00:00.000Z",
    "revenueCatCustomerId": "rc_abc123",
    "stripeCustomerId": "cus_xyz789",
    "stripeSubscriptionId": "sub_abc456"
  },
  "usage": {
    "userId": "507f1f77bcf86cd799439011",
    "quickChartsUsed": 3,
    "quickMatchesUsed": 5,
    "reportsUsed": 1,
    "chatQuestionsUsed": 47,
    "lastResetDate": "2025-10-15T00:00:00.000Z",
    "nextResetDate": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:00:00.000Z"
  },
  "entitlements": {
    "canAccessWeeklyHoroscope": true,
    "canAccessDailyHoroscope": true,
    "canAccessMonthlyHoroscope": true,
    "canGenerateNatalReport": true,
    "canGenerateCompatibilityReport": true,
    "canCreateQuickCharts": true,
    "canCreateQuickMatches": true,
    "canUseTransitChat": true,
    "canUseChartChat": true,
    "canUseRelationshipChat": true,
    "hasUnlimitedCharts": false,
    "hasUnlimitedMatches": false,
    "hasUnlimitedChat": false,
    "quickChartsLimit": 10,
    "quickMatchesLimit": 10,
    "reportsLimit": 2,
    "chatQuestionsLimit": 100
  }
}
```

**Business Logic:**
- Check if current date > `nextResetDate`
- If yes, reset usage counters to 0 and update `lastResetDate` and `nextResetDate`
- Compute entitlements based on current tier
- Return all three objects

---

### 3. Get Usage Metrics Only

**Endpoint:** `GET /users/:userId/subscription/usage`

**Description:** Returns only usage metrics. Lighter weight endpoint for frequent checks.

**Response:** `200 OK`
```json
{
  "usage": {
    "userId": "507f1f77bcf86cd799439011",
    "quickChartsUsed": 3,
    "quickMatchesUsed": 5,
    "reportsUsed": 1,
    "chatQuestionsUsed": 47,
    "lastResetDate": "2025-10-15T00:00:00.000Z",
    "nextResetDate": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:00:00.000Z"
  }
}
```

---

### 4. Update Usage Metric (Increment)

**Endpoint:** `POST /users/:userId/subscription/usage`

**Description:** Increments a usage counter. Called when user performs an action (creates chart, sends chat message, etc.).

**Request Body:**
```json
{
  "metric": "quickChartsUsed",  // "quickChartsUsed" | "quickMatchesUsed" | "reportsUsed" | "chatQuestionsUsed"
  "increment": 1                 // Usually 1, but could be > 1
}
```

**Response:** `200 OK`
```json
{
  "usage": {
    "userId": "507f1f77bcf86cd799439011",
    "quickChartsUsed": 4,         // Incremented from 3
    "quickMatchesUsed": 5,
    "reportsUsed": 1,
    "chatQuestionsUsed": 47,
    "lastResetDate": "2025-10-15T00:00:00.000Z",
    "nextResetDate": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "limitReached": false,          // true if user hit their limit
  "remainingCount": 6             // Or "unlimited" for pro users
}
```

**Business Logic:**
- Increment the specified counter
- Check user's tier and limits
- If `tier === "pro"` and metric is charts/matches/chat, return `remainingCount: "unlimited"`
- If usage >= limit, set `limitReached: true`
- Return updated usage with limit status

**Error Cases:**
- `400 Bad Request` - Invalid metric name
- `403 Forbidden` - User already at limit (if you want to prevent over-limit actions server-side)

---

### 5. Reset Usage Metrics (Manual)

**Endpoint:** `POST /users/:userId/subscription/usage/reset`

**Description:** Manually resets usage counters. Primarily for testing or admin use. Normally happens automatically.

**Response:** `200 OK`
```json
{
  "usage": {
    "userId": "507f1f77bcf86cd799439011",
    "quickChartsUsed": 0,
    "quickMatchesUsed": 0,
    "reportsUsed": 0,
    "chatQuestionsUsed": 0,
    "lastResetDate": "2025-10-16T14:32:00.000Z",
    "nextResetDate": "2025-11-16T14:32:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  }
}
```

**Business Logic:**
- Set all counters to 0
- Update `lastResetDate` to now
- Calculate `nextResetDate` based on subscription anniversary

---

### 6. Sync RevenueCat Purchase

**Endpoint:** `POST /users/:userId/subscription/sync-revenuecat`

**Description:** Called by the mobile app after a successful purchase through RevenueCat. Updates user's subscription to reflect the purchase.

**Request Body:**
```json
{
  "revenueCatCustomerId": "rc_abc123xyz",
  "productId": "premium_monthly",
  "entitlementId": "premium",
  "purchaseDate": "2025-10-16T14:00:00.000Z",
  "expirationDate": "2025-11-16T14:00:00.000Z"  // Optional for monthly subscriptions
}
```

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",
    "status": "active",
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",  // Remains unchanged
    "renewsAt": "2025-11-16T14:00:00.000Z",
    "revenueCatCustomerId": "rc_abc123xyz",
    "revenueCatEntitlementId": "premium",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "synced": true
}
```

**Business Logic:**
- Map `productId` to tier:
  - `"premium_monthly"` → `tier: "premium"`
  - `"pro_monthly"` → `tier: "pro"`
- Update subscription with RevenueCat IDs
- Set `status` to "active"
- Set `renewsAt` to `expirationDate` (if provided)
- **DO NOT change `subscriptionAnniversary`** - this is set once and remains fixed
- Return updated subscription

**Important:** The `subscriptionAnniversary` should only be set on initial subscription creation and should never change, even on upgrades/downgrades. This ensures consistent monthly reset dates.

---

### 7. Validate Entitlement (Server-Side Check)

**Endpoint:** `POST /users/:userId/subscription/validate`

**Description:** Server-side validation for critical features. Used before generating expensive reports or allowing access to premium features.

**Request Body:**
```json
{
  "featureName": "canGenerateNatalReport"  // Any entitlement key
}
```

**Response:** `200 OK`
```json
{
  "hasAccess": true,
  "reason": "User has premium subscription"
}
```

**Response (Access Denied):** `200 OK`
```json
{
  "hasAccess": false,
  "reason": "Feature requires premium or pro subscription"
}
```

**Business Logic:**
- Get user's current subscription tier
- Compute entitlements based on tier
- Check if the requested feature is enabled
- Return boolean with explanation

---

### 8. Upgrade Subscription

**Endpoint:** `POST /users/:userId/subscription/upgrade`

**Description:** Upgrades user to a higher tier. Immediate effect, prorated billing.

**Request Body:**
```json
{
  "tier": "premium"  // "premium" | "pro"
}
```

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",
    "status": "active",
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",  // UNCHANGED
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "upgraded": true
}
```

**Business Logic:**
- Validate new tier is higher than current
- Update tier immediately
- **DO NOT change `subscriptionAnniversary`**
- Trigger Stripe proration (if applicable)
- Return updated subscription

---

### 9. Downgrade Subscription

**Endpoint:** `POST /users/:userId/subscription/downgrade`

**Description:** Downgrades user to a lower tier. Takes effect at next billing cycle, not immediately.

**Request Body:**
```json
{
  "tier": "free"  // "free" | "premium"
}
```

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",              // Current tier (UNCHANGED until renewal)
    "status": "active",
    "pendingDowngradeTo": "free",   // NEW: Scheduled downgrade
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",
    "renewsAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "downgraded": false,
  "effectiveDate": "2025-11-15T00:00:00.000Z"
}
```

**Business Logic:**
- Validate new tier is lower than current
- Set `pendingDowngradeTo` field with new tier
- Keep current tier active until `renewsAt`
- On renewal date, apply downgrade and clear `pendingDowngradeTo`
- Return subscription with effective date

---

### 10. Cancel Subscription

**Endpoint:** `POST /users/:userId/subscription/cancel`

**Description:** Cancels user's subscription. Remains active until expiration, then downgrades to free.

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",
    "status": "cancelled",          // Changed from "active"
    "cancelledAt": "2025-10-16T14:32:00.000Z",
    "expiresAt": "2025-11-15T00:00:00.000Z",  // Remains active until this date
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "cancelled": true,
  "expiresAt": "2025-11-15T00:00:00.000Z"
}
```

**Business Logic:**
- Set `status` to "cancelled"
- Set `cancelledAt` to current time
- Set `expiresAt` to end of current billing period
- Keep tier and entitlements active until `expiresAt`
- On expiration date, downgrade to "free" tier
- Cancel Stripe subscription (at period end)

---

### 11. Reactivate Subscription

**Endpoint:** `POST /users/:userId/subscription/reactivate`

**Description:** Reactivates a cancelled subscription before it expires.

**Response:** `200 OK`
```json
{
  "subscription": {
    "userId": "507f1f77bcf86cd799439011",
    "tier": "premium",
    "status": "active",             // Changed from "cancelled"
    "cancelledAt": null,            // Cleared
    "expiresAt": null,              // Cleared
    "renewsAt": "2025-11-15T00:00:00.000Z",
    "subscriptionAnniversary": "2025-09-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T14:32:00.000Z"
  },
  "reactivated": true
}
```

**Response (Cannot Reactivate):** `400 Bad Request`
```json
{
  "error": "Subscription has already expired",
  "code": "SUBSCRIPTION_EXPIRED"
}
```

**Business Logic:**
- Check if subscription is currently "cancelled" and not yet expired
- If yes, restore to "active" status
- Clear `cancelledAt` and `expiresAt`
- Resume Stripe subscription
- If already expired, return error

---

### 12. Get Available Plans

**Endpoint:** `GET /subscription/plans`

**Description:** Returns all available subscription plans with pricing and features. Used for displaying pricing page.

**Response:** `200 OK`
```json
{
  "plans": [
    {
      "tier": "free",
      "name": "Free Plan",
      "priceMonthly": 0,
      "features": [
        "Your Quick Chart (at signup)",
        "Weekly horoscope (personalized)",
        "5 Quick Charts or Quick Matches per month",
        "No chat access"
      ]
    },
    {
      "tier": "premium",
      "name": "Premium Plan",
      "priceMonthly": 20,
      "features": [
        "Your Natal Report included",
        "Daily + Weekly + Monthly horoscopes",
        "2 Reports/month (Natal or Compatibility)",
        "10 Quick Charts or Quick Matches per month",
        "100 AI chat questions per month"
      ]
    },
    {
      "tier": "pro",
      "name": "Pro Plan",
      "priceMonthly": 49,
      "features": [
        "Everything in Premium",
        "10 Reports/month",
        "Unlimited Quick Charts & Quick Matches",
        "Unlimited AI chat"
      ]
    }
  ]
}
```

---

## Webhook Endpoints

### RevenueCat Webhook

**Endpoint:** `POST /webhooks/revenuecat`

**Description:** Receives events from RevenueCat when purchases/renewals/cancellations occur.

**Request Headers:**
```
X-RevenueCat-Signature: <webhook_signature>
```

**Request Body (Example - Purchase Event):**
```json
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "507f1f77bcf86cd799439011",
    "product_id": "premium_monthly",
    "purchased_at_ms": 1697461920000,
    "expiration_at_ms": 1700140320000,
    "entitlement_ids": ["premium"],
    "transaction_id": "abc123xyz"
  }
}
```

**Event Types to Handle:**
- `INITIAL_PURCHASE` - First purchase → Update subscription tier
- `RENEWAL` - Subscription renewed → Update `renewsAt`
- `CANCELLATION` - User cancelled → Set status to "cancelled", keep active until expiry
- `EXPIRATION` - Subscription expired → Downgrade to free tier
- `PRODUCT_CHANGE` - Upgrade/downgrade → Update tier

**Response:** `200 OK`
```json
{
  "received": true
}
```

**Business Logic:**
- Verify webhook signature for security
- Map event to user via `app_user_id`
- Update subscription based on event type
- Handle each event type appropriately

---

### Stripe Webhook

**Endpoint:** `POST /webhooks/stripe`

**Description:** Receives events from Stripe for payment processing.

**Request Headers:**
```
Stripe-Signature: <webhook_signature>
```

**Request Body (Example - Invoice Paid):**
```json
{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "customer": "cus_xyz789",
      "subscription": "sub_abc456",
      "amount_paid": 2000,
      "currency": "usd"
    }
  }
}
```

**Event Types to Handle:**
- `invoice.payment_succeeded` - Payment successful → Ensure subscription is active
- `invoice.payment_failed` - Payment failed → Mark subscription at risk, notify user
- `customer.subscription.deleted` - Subscription cancelled → Downgrade to free

**Response:** `200 OK`
```json
{
  "received": true
}
```

---

## Usage Reset Logic

### Automatic Reset on Subscription Anniversary

**When:** Every month on the user's `subscriptionAnniversary` date.

**Example:**
- User subscribes on **September 15, 2025 at 2:30 PM**
- `subscriptionAnniversary` is set to **September 15, 2025, 00:00:00 UTC**
- Usage resets on **October 15, November 15, December 15**, etc. at **00:00:00 UTC**

**Implementation:**
1. Run a scheduled job (cron) every hour or when user makes API request
2. Check if `currentDate >= nextResetDate`
3. If true:
   - Reset all usage counters to 0
   - Set `lastResetDate = nextResetDate`
   - Set `nextResetDate = lastResetDate + 1 month`

**Alternative (Lazy Reset):**
- On every API call to get usage/subscription:
  - Check if `currentDate >= nextResetDate`
  - If true, perform reset inline before returning data
  - More efficient, no cron job needed

**Recommended:** Lazy reset for simplicity.

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional context
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_TIER` | Invalid subscription tier provided |
| 400 | `INVALID_METRIC` | Invalid usage metric name |
| 400 | `SUBSCRIPTION_EXPIRED` | Cannot reactivate expired subscription |
| 403 | `LIMIT_REACHED` | User has reached their usage limit |
| 403 | `FEATURE_NOT_AVAILABLE` | Feature not available on current tier |
| 404 | `SUBSCRIPTION_NOT_FOUND` | No subscription found for user |
| 404 | `USER_NOT_FOUND` | User does not exist |
| 409 | `SUBSCRIPTION_ALREADY_EXISTS` | User already has a subscription |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Security Considerations

### 1. Webhook Signature Verification

**RevenueCat:**
- Verify `X-RevenueCat-Signature` header
- Use shared secret from RevenueCat dashboard
- Reject webhooks with invalid signatures

**Stripe:**
- Verify `Stripe-Signature` header using Stripe SDK
- Use webhook secret from Stripe dashboard
- Reject webhooks with invalid signatures

### 2. User Authentication

- All `/users/:userId/*` endpoints require authentication
- Validate JWT token or Firebase Auth token
- Ensure `userId` in URL matches authenticated user (or admin)

### 3. Idempotency

- Webhook endpoints should be idempotent
- Use `transaction_id` or `event_id` to prevent duplicate processing
- Store processed event IDs in database

### 4. Rate Limiting

- Implement rate limiting on all endpoints
- Prevent abuse of free tier accounts
- Suggested limits:
  - Subscription status: 100 req/min
  - Usage updates: 50 req/min
  - Webhooks: No limit (but verify signatures)

---

## Testing Checklist

### Unit Tests
- [ ] Usage increment correctly updates counters
- [ ] Entitlements computed correctly for each tier
- [ ] Usage resets on subscription anniversary
- [ ] Upgrade changes tier immediately
- [ ] Downgrade schedules for next billing cycle
- [ ] Cancellation keeps subscription active until expiry

### Integration Tests
- [ ] RevenueCat webhook processes purchase correctly
- [ ] Stripe webhook handles payment failure
- [ ] Manual usage reset works
- [ ] Cannot exceed usage limits (if enforced server-side)

### Edge Cases
- [ ] User upgrades mid-cycle (usage stays, limits increase)
- [ ] User downgrades mid-cycle (current tier remains until renewal)
- [ ] Subscription expires on exact anniversary date
- [ ] Timezone handling for subscription anniversary
- [ ] Cancelled subscription reactivated before expiry

---

## Additional Notes

### Subscription Anniversary vs. Billing Date

**Subscription Anniversary:**
- Set once when user first subscribes (or upgrades from free)
- **Never changes**, even on tier changes
- Used for usage reset timing
- Example: User subscribes on 15th → usage always resets on 15th

**Billing Date (renewsAt):**
- When Stripe/RevenueCat charges the user
- Can change based on trial periods, prorations, etc.
- Managed by payment provider

**Important:** These are two separate dates! Don't confuse them.

### Report Rollover

- Reports **do NOT roll over** beyond the monthly reset
- Example: Premium user (2 reports/month)
  - October: Uses 1 report, 1 unused
  - November 1: Resets to 2 reports total (not 3)

### Quick Charts/Matches Combined Limit

- Free tier: "5 Quick Charts or Quick Matches per month"
- This means: `quickChartsUsed + quickMatchesUsed <= 5`
- Track separately but enforce combined limit
- Frontend will handle this, but backend should validate

---

## Questions for Backend Team

1. **Database Choice:** MongoDB or PostgreSQL? (Spec assumes MongoDB ObjectIds)
2. **Webhook Storage:** Should we store all webhook events for audit trail?
3. **Timezone:** Should `subscriptionAnniversary` be stored in UTC or user's local timezone?
4. **Scheduled Jobs:** Do you have a cron system for daily/hourly tasks, or prefer lazy reset?
5. **Admin API:** Do we need admin endpoints to manually adjust subscriptions/usage?

---

## Changelog

**Version 1.0 (2025-10-16)**
- Initial specification
- Three-tier pricing model
- Usage tracking with monthly reset
- RevenueCat and Stripe integration
- Complete CRUD operations for subscriptions

---

**End of Specification**

For questions or clarifications, contact the mobile development team.
