# Payment System Architecture - Stellium App

**Last Updated**: October 25, 2025
**Version**: 2.0 (Dual-Credit System)

---

## Table of Contents

1. [Overview](#overview)
2. [Dual-Credit System](#dual-credit-system)
3. [Payment Product Types](#payment-product-types)
4. [Paywall Strategy](#paywall-strategy)
5. [Payment Flow Architecture](#payment-flow-architecture)
6. [RevenueCat Integration](#revenuecat-integration)
7. [Superwall Integration](#superwall-integration)
8. [User Journey Flows](#user-journey-flows)
9. [UX Integration Points](#ux-integration-points)
10. [Backend Integration](#backend-integration)
11. [Testing Strategy](#testing-strategy)

---

## Overview

Stellium uses a **hybrid payment model** combining:
- **Subscription Tiers** (Free, Premium, Pro) - Managed via Superwall
- **Consumable Credit Packs** - Managed via custom purchase screens
- **Dual-Credit System** - Monthly credits (reset) + Pack credits (permanent)

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Subscription Management** | RevenueCat | Unified purchase handling |
| **Paywall UI (Subscriptions)** | Superwall | A/B tested subscription paywalls |
| **Credit Packs UI** | Custom React Native | Credit pack purchase screens |
| **Payment Processing** | Apple App Store / Google Play | Platform-native payments |
| **Backend Webhooks** | RevenueCat Webhooks | Server-side fulfillment |

---

## Dual-Credit System

### Credit Types

#### 1. Monthly Credits
- **Source**: Subscription tier allotment
- **Lifecycle**: Reset every billing cycle
- **Deduction Priority**: Used FIRST
- **Allotments**:
  - Free: 10/month
  - Premium: 200/month
  - Pro: 1000/month

#### 2. Pack Credits
- **Source**: A-la-carte purchases
- **Lifecycle**: Never expire
- **Deduction Priority**: Used SECOND (after monthly depleted)
- **Purchase Options**:
  - Small Pack: 20 credits ($7.99)
  - Medium Pack: 100 credits ($24.99)
  - Large Pack: 300 credits ($49.99)

### Credit Costs

| Action | Credits | Notes |
|--------|---------|-------|
| **Quick Chart Overview** | 5 | Basic birth chart reading |
| **Full Natal Report** | 15 | Comprehensive analysis |
| **Relationship Overview** | 5 | Quick compatibility check |
| **Full Relationship Report** | 15 | Deep relationship analysis |
| **Ask Stellium Question** | 1 | Single AI chat question |

### Deduction Logic

```
When user performs action (cost: X credits):

1. Check total = monthlyRemaining + packBalance
2. If total < X: Show insufficient credits flow
3. Otherwise, deduct in priority order:
   a. Deduct from monthlyRemaining (up to X)
   b. If shortfall remains, deduct from packBalance
4. Update backend with new balances
```

**Example**:
```
User has: monthlyRemaining=3, packBalance=10 (total=13)
Action cost: 5 credits

Deduction:
- monthlyRemaining: 3 → 0 (deduct 3)
- packBalance: 10 → 8 (deduct remaining 2)

Result: total=8
```

---

## Payment Product Types

### 1. Auto-Renewable Subscriptions

Managed via **RevenueCat + Superwall**

| Tier | RevenueCat Product ID | Price | Monthly Credits | Features |
|------|----------------------|-------|-----------------|----------|
| **Free** | `free_plan` | $0 | 10 | Basic access |
| **Premium** | `com.stelliumapp.dev.premium.monthly` | $19.99/mo | 200 | All features |
| **Pro** | `com.stelliumapp.dev.pro.monthly` | $49.99/mo | 1000 | Unlimited use |

**Key Behaviors**:
- Renew automatically each month
- Grant `monthlyAllotment` credits
- Reset `monthlyRemaining` to `monthlyAllotment` on renewal
- Superwall handles paywall presentation
- RevenueCat handles purchase + entitlement management

### 2. Consumable Credit Packs

Managed via **RevenueCat + Custom UI**

| Pack | RevenueCat Product ID | Credits | Price |
|------|----------------------|---------|-------|
| **Small** | `com.stelliumapp.dev.credits.small` | 20 | $7.99 |
| **Medium** | `com.stelliumapp.dev.credits.medium` | 100 | $24.99 |
| **Large** | `com.stelliumapp.dev.credits.large` | 300 | $49.99 |

**Key Behaviors**:
- One-time purchase (consumable type)
- Add credits to `packBalance`
- Never expire
- Custom React Native UI for purchase flow
- RevenueCat handles transaction

---

## Paywall Strategy

### Decision Tree: When to Show What

```
User runs out of credits
         ↓
    Check tier
         ↓
    ┌────┴────┐
    ↓         ↓
  FREE      PAID
    ↓         ↓
Superwall   Check shortfall
 Paywall        ↓
(Convert    ┌───┴───┐
 to paid)   ↓       ↓
          ≤20   >20
            ↓       ↓
         Credit  Show
          Pack   Options
                    ↓
              ┌─────┴─────┐
              ↓           ↓
         Buy Pack    Upgrade Tier
        (Custom UI)   (Superwall)
```

### Strategy Breakdown

#### Free Users (Tier: `free`)
**Goal**: Convert to paid subscription

**Flow**:
```javascript
if (tier === 'free') {
  showSuperwallPaywall('credits_depleted_free_user');
  // Emphasize: "Upgrade to Premium for 200 credits/month!"
}
```

**Superwall Event**: `credits_depleted_free_user`

---

#### Premium Users (Tier: `premium`)
**Goal**: Intelligent routing based on usage patterns

**Small Shortfall (≤20 credits)**:
```javascript
if (shortfall <= 20) {
  navigate('CreditPurchase', { recommendedPack: 'small' });
  // Direct to small pack purchase ($7.99)
}
```

**Medium Shortfall (21-100 credits)**:
```javascript
if (shortfall <= 100) {
  showAlert({
    title: 'Need More Credits?',
    options: [
      'Buy 100 credits ($24.99)',
      'Upgrade to Pro (1000/mo)'
    ]
  });
}
```

**Large Shortfall (>100 credits)**:
```javascript
if (shortfall > 100) {
  showAlert({
    title: 'Consider Pro Plan',
    message: 'You're using a lot of credits! Pro is better value.',
    options: [
      'View Pro Plan (Superwall)',
      'Buy Credits Instead (Custom UI)'
    ]
  });
}
```

---

#### Pro Users (Tier: `pro`)
**Goal**: Sell credit packs (already at max tier)

**Flow**:
```javascript
if (tier === 'pro') {
  const pack = shortfall <= 20 ? 'small' :
               shortfall <= 100 ? 'medium' : 'large';
  navigate('CreditPurchase', { recommendedPack: pack });
}
```

---

## Payment Flow Architecture

### Component Responsibilities

```
┌─────────────────────────────────────────────────────┐
│                    User Action                       │
│              (e.g., "Generate Chart")                │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│             CreditService.hasEnoughCredits()         │
│  Checks: total >= cost                               │
└───────────┬───────────────────┬─────────────────────┘
            ↓                   ↓
          YES                  NO
            ↓                   ↓
   ┌────────────────┐   ┌──────────────────────┐
   │ Perform Action │   │ CreditErrorHandler   │
   │ Deduct Credits │   │ Parse 402 Error      │
   └────────────────┘   └──────┬───────────────┘
                               ↓
                    ┌──────────────────────┐
                    │ CreditFlowManager    │
                    │ Route based on tier  │
                    └──────┬───────────────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ SuperwallService │    │ CreditPurchase   │
    │ Show Paywall     │    │ Custom Screen    │
    └──────┬───────────┘    └────────┬─────────┘
           ↓                         ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ RevenueCat SDK   │    │ RevenueCat SDK   │
    │ Purchase Sub     │    │ Purchase Pack    │
    └──────┬───────────┘    └────────┬─────────┘
           │                         │
           └────────┬────────────────┘
                    ↓
         ┌────────────────────────┐
         │ RevenueCat Webhook     │
         │ → Backend Fulfillment  │
         └────────┬───────────────┘
                  ↓
         ┌────────────────────────┐
         │ Update Credits         │
         │ Subscription → Monthly │
         │ Pack → Pack Balance    │
         └────────────────────────┘
```

### Key Services

#### 1. CreditService (`src/services/CreditService.ts`)
**Responsibilities**:
- Fetch and cache credit balance
- Check if user has enough credits
- Optimistic local updates
- Notify listeners of balance changes

**Key Methods**:
```typescript
fetchBalance(userId: string): Promise<CreditBalance>
hasEnoughCredits(action: CreditAction): boolean
deductCreditsOptimistically(action: CreditAction): void
addCreditsOptimistically(amount: number): void
```

#### 2. CreditFlowManager (`src/services/CreditFlowManager.ts`)
**Responsibilities**:
- Orchestrate insufficient credits journey
- Route to Superwall vs Custom screens
- Smart recommendations based on tier + shortfall

**Key Methods**:
```typescript
handleInsufficientCredits(options: {
  currentTier: SubscriptionTier;
  currentCredits: number;
  requiredCredits: number;
  source: string;
}): Promise<void>
```

#### 3. CreditErrorHandler (`src/utils/creditErrorHandler.ts`)
**Responsibilities**:
- Catch API 402 errors (insufficient credits)
- Parse error details
- Delegate to CreditFlowManager

**Key Methods**:
```typescript
handleInsufficientCredits(
  error: InsufficientCreditsError | ApiError,
  source?: string
): Promise<void>
```

#### 4. SuperwallService (`src/services/SuperwallService.ts`)
**Responsibilities**:
- Present Superwall paywalls
- Track paywall events
- Update user attributes

**Key Methods**:
```typescript
presentPaywall(event: string, params?: object): Promise<void>
showSettingsUpgradePaywall(): Promise<void>
```

#### 5. RevenueCatService (`src/services/RevenueCatService.ts`)
**Responsibilities**:
- Initialize RevenueCat SDK
- Purchase products
- Restore purchases
- Get customer info

**Key Methods**:
```typescript
purchaseProduct(productId: string): Promise<CustomerInfo>
restorePurchases(): Promise<CustomerInfo>
```

---

## RevenueCat Integration

### Setup

**1. Initialize SDK** (`App.tsx`):
```typescript
await revenueCatService.initialize(userId);
```

**2. Configure Products** (RevenueCat Dashboard):
- Create entitlements: `Premium`, `Pro`
- Add subscription products
- Add consumable products (credit packs)
- Configure webhook URL

### Purchase Flow

#### Subscription Purchase
```typescript
// Via Superwall paywall
const customerInfo = await Purchases.purchasePackage(package);

// Webhook triggers backend:
POST /webhooks/revenuecat
{
  event_type: "INITIAL_PURCHASE",
  product_id: "com.stelliumapp.dev.premium.monthly",
  entitlement_ids: ["Premium"]
}

// Backend updates:
- subscription.tier = 'premium'
- subscription.monthlyAllotment = 200
- subscription.monthlyRemaining = 200
```

#### Credit Pack Purchase
```typescript
// Via custom CreditPurchase screen
const customerInfo = await revenueCatService.purchaseProduct(
  'com.stelliumapp.dev.credits.small'
);

// Webhook triggers backend:
POST /webhooks/revenuecat
{
  event_type: "NON_SUBSCRIPTION_PURCHASE",
  product_id: "com.stelliumapp.dev.credits.small"
}

// Backend updates:
- subscription.packBalance += 20
```

### Webhook Events to Handle

| Event | Type | Action |
|-------|------|--------|
| `INITIAL_PURCHASE` | Subscription | Grant tier + monthly credits |
| `RENEWAL` | Subscription | Refill monthly credits |
| `NON_SUBSCRIPTION_PURCHASE` | Consumable | Add to pack balance |
| `CANCELLATION` | Subscription | Mark cancelled (retain until expiry) |
| `EXPIRATION` | Subscription | Downgrade to free |

---

## Superwall Integration

### Paywall Events

#### Credits Depleted (Free User)
```typescript
Superwall.register('credits_depleted_free_user', {
  message: 'Upgrade to Premium for 200 credits per month!'
});
```

**Displays**: Premium vs Pro comparison paywall

---

#### Tier Upgrade (Pro)
```typescript
Superwall.register('tier_upgrade_pro', {
  source: 'credit_flow'
});
```

**Displays**: Pro plan benefits paywall

---

#### Manual Upgrade
```typescript
Superwall.register('settings_upgrade', {
  source: 'subscription_screen'
});
```

**Displays**: All tier options with A/B tested messaging

---

### User Attributes

Sync to Superwall for paywall personalization:

```typescript
await Superwall.setUserAttributes({
  tier: 'premium',
  credits_total: 180,
  credits_monthly: 150,
  credits_pack: 30,
  monthly_allotment: 200,
  is_monthly_depleted: false
});
```

**Use Cases**:
- Show different paywall variants based on tier
- Personalize messaging based on usage
- A/B test based on credit balance

---

## User Journey Flows

### Journey 1: Free User Runs Out of Credits

```
1. User: "Generate Birth Chart" (cost: 5 credits)
2. User has: 2 credits remaining
3. API returns: 402 Insufficient Credits
4. CreditErrorHandler catches error
5. CreditFlowManager checks tier: 'free'
6. Show Superwall paywall: "Upgrade to Premium!"
7. User purchases Premium ($19.99/mo)
8. RevenueCat webhook → Backend grants 200 monthly credits
9. User completes "Generate Birth Chart" action
```

---

### Journey 2: Premium User Small Shortfall

```
1. User: "Full Natal Report" (cost: 15 credits)
2. User has: 12 credits (10 monthly + 2 pack)
3. API returns: 402 Insufficient Credits (shortfall: 3)
4. CreditFlowManager: shortfall ≤ 20 → Direct to small pack
5. Navigate to CreditPurchase screen
6. User purchases Small Pack (20 credits, $7.99)
7. RevenueCat webhook → Backend adds 20 to packBalance
8. User now has: 32 total (10 monthly + 22 pack)
9. User completes "Full Natal Report" action
10. Deduction: monthly 10→0, pack 22→17
```

---

### Journey 3: Premium User Heavy Usage

```
1. User: Multiple actions depleting credits
2. User has: 5 credits remaining
3. User: "Full Natal Report" (cost: 15 credits)
4. Shortfall: 10 credits
5. CreditFlowManager: shortfall ≤ 20 → Small pack
6. User purchases small pack

Later...

7. User runs out again (shortfall: 95 credits)
8. CreditFlowManager: 21-100 → Show options
9. Alert:
   - "Buy 100 credits ($24.99)"
   - "Upgrade to Pro (1000/mo)"
10. User selects: "Upgrade to Pro"
11. Superwall shows Pro paywall
12. User upgrades → 1000 monthly credits granted
```

---

### Journey 4: Pro User Needs Extra Credits

```
1. User: Very heavy usage month
2. User depletes all 1000 monthly credits
3. User has: 0 monthly, 0 pack
4. User: "Full Natal Report" (cost: 15 credits)
5. CreditFlowManager: tier='pro' → Direct to packs
6. Recommend: small pack (shortfall ≤ 20)
7. User purchases small pack (20 credits)
8. User now has: 0 monthly + 20 pack
9. Action completes using pack credits
```

---

## UX Integration Points

### 1. Credit Balance Display

**Navigation Header**:
```tsx
<CreditBalanceDisplay
  variant="compact"
  onPress={() => navigate('Subscription')}
/>
```

**Shows**: `⚡ 180` (compact badge)

---

**Profile Modal**:
```tsx
<CreditBalanceDisplay
  variant="card"
  onPress={() => navigate('Subscription')}
/>
```

**Shows**:
```
⚡ 180 Credits
150 monthly + 30 pack

[Low balance warning if total < 10]
```

---

### 2. Subscription Screen

**Location**: `src/screens/subscription/SubscriptionScreen.tsx`

**Displays**:
- Subscription tier card
- **Total Available**: 180 Credits (large)
- **Monthly Credits**: Progress bar (150/200)
- **Pack Credits**: 30 (never expire)
- Info box explaining priority
- Upgrade/Buy Credits buttons

---

### 3. Pre-Action Checks

**Before expensive actions**:
```tsx
const handleGenerateChart = async () => {
  const { hasEnoughCredits, getCost } = useCreditBalance();

  if (!hasEnoughCredits('fullNatalReport')) {
    // API will return 402, which triggers flow
    // OR: Show paywall proactively
    return;
  }

  // Proceed with action
  await generateChart();
};
```

---

### 4. Credit Purchase Screen (Custom)

**Location**: `src/screens/CreditPurchaseScreen.tsx` (to be created)

**Displays**:
- Current balance
- Recommended pack (highlighted)
- All pack options with credit amounts
- Purchase buttons
- "Why buy credits?" explainer

**Flow**:
```tsx
const handlePurchase = async (pack: CreditPack) => {
  try {
    const customerInfo = await revenueCatService.purchaseProduct(
      pack.revenueCatProductId
    );

    // Optimistically update
    addCredits(pack.credits);

    Alert.alert('Success', `${pack.credits} credits added!`);
    navigation.goBack();
  } catch (error) {
    // Handle cancellation or error
  }
};
```

---

### 5. Insufficient Credits Modal

**Trigger**: API returns 402

**Current**: Handled automatically by `creditErrorHandler`

**Future Enhancement**: Could add a custom modal UI before routing:
```tsx
<InsufficientCreditsModal
  required={15}
  available={12}
  shortfall={3}
  tier="premium"
  onDismiss={handleDismiss}
/>
```

---

## Backend Integration

### API Endpoints

#### 1. Get Subscription Status
```http
GET /api/subscriptions/status/:userId

Response:
{
  "subscription": {
    "tier": "premium",
    "status": "active",
    "monthlyAllotment": 200,
    "monthlyRemaining": 150,
    "packBalance": 30,
    "renewsAt": "2025-11-21T17:44:01.000Z"
  },
  "entitlements": {
    "canAccessDailyHoroscope": true,
    "monthlyCredits": 200
  }
}
```

---

#### 2. Deduct Credits (Action)
```http
POST /api/credits/deduct
{
  "userId": "68e0aa77df74dc6bce3abca2",
  "action": "fullNatalReport",
  "cost": 15
}

Success Response (200):
{
  "success": true,
  "monthlyRemaining": 135,
  "packBalance": 30,
  "total": 165,
  "deduction": {
    "fromMonthly": 15,
    "fromPack": 0
  }
}

Error Response (402):
{
  "error": "INSUFFICIENT_CREDITS",
  "required": 15,
  "available": 12,
  "action": "fullNatalReport"
}
```

---

#### 3. RevenueCat Webhook
```http
POST /webhooks/revenuecat
Headers:
  X-RevenueCat-Signature: <webhook_signature>

Body:
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "68e0aa77df74dc6bce3abca2",
    "product_id": "com.stelliumapp.dev.premium.monthly",
    "entitlement_ids": ["Premium"],
    "price_in_purchased_currency": 19.99,
    "currency": "USD"
  }
}

Response: 200 OK
```

**Backend Actions**:
1. Verify webhook signature
2. Identify event type
3. Update subscription record:
   - Subscription purchase → Set tier, grant monthly credits
   - Renewal → Refill monthly credits
   - Consumable purchase → Add to pack balance
   - Cancellation → Mark cancelled
   - Expiration → Downgrade tier

---

### Database Schema

```typescript
interface Subscription {
  userId: ObjectId;
  tier: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';

  // Monthly Credits
  monthlyAllotment: number;      // 10, 200, or 1000
  monthlyRemaining: number;      // Current balance
  lastRefillAt: Date;            // Last monthly reset

  // Pack Credits
  packBalance: number;           // Purchased credits

  // Subscription Management
  revenueCatCustomerId: string;
  revenueCatEntitlementId: string;
  subscriptionAnniversary: Date; // When monthly resets
  renewsAt: Date;                // Next billing date

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Testing Strategy

### Unit Tests

#### CreditService
```typescript
describe('CreditService', () => {
  it('should deduct monthly credits first', () => {
    // monthly: 10, pack: 20
    // action: 15 credits
    // result: monthly: 0, pack: 15
  });

  it('should add purchased credits to pack balance', () => {
    // initial: monthly: 50, pack: 10
    // purchase: 20 credits
    // result: monthly: 50, pack: 30
  });
});
```

#### CreditFlowManager
```typescript
describe('CreditFlowManager', () => {
  it('should show Superwall for free users', async () => {
    await flowManager.handleInsufficientCredits({
      currentTier: 'free',
      currentCredits: 5,
      requiredCredits: 10,
      source: 'test'
    });
    expect(superwallService.presentPaywall).toHaveBeenCalled();
  });

  it('should navigate to credit packs for small shortfall', async () => {
    // tier: premium, shortfall: 15
    expect(navigation.navigate).toHaveBeenCalledWith('CreditPurchase');
  });
});
```

---

### Integration Tests

#### End-to-End Purchase Flow (Subscription)
```typescript
it('should grant monthly credits on subscription purchase', async () => {
  // 1. User starts as free (10 credits)
  // 2. Purchase Premium via Superwall
  // 3. Webhook fires
  // 4. Backend grants 200 monthly credits
  // 5. App refreshes balance
  // 6. Verify: monthlyAllotment=200, monthlyRemaining=200
});
```

#### End-to-End Purchase Flow (Credit Pack)
```typescript
it('should add pack credits on consumable purchase', async () => {
  // 1. User has: monthly=50, pack=10
  // 2. Purchase small pack (20 credits)
  // 3. Webhook fires
  // 4. Backend adds to packBalance
  // 5. App refreshes balance
  // 6. Verify: monthly=50, pack=30
});
```

#### Credit Deduction Priority
```typescript
it('should deduct monthly first, then pack', async () => {
  // 1. User has: monthly=8, pack=20
  // 2. Perform action (cost: 15)
  // 3. Verify deduction: monthly=0, pack=13
});
```

---

### Manual Testing Checklist

#### Free User Flow
- [ ] Deplete 10 free credits
- [ ] Trigger action requiring credits
- [ ] Verify Superwall paywall shows
- [ ] Complete purchase (sandbox)
- [ ] Verify monthly credits granted
- [ ] Verify action completes

#### Premium User Flow
- [ ] Deplete to small shortfall (≤20)
- [ ] Verify direct navigation to credit packs
- [ ] Purchase small pack
- [ ] Verify pack credits added
- [ ] Trigger large shortfall (>100)
- [ ] Verify Pro upgrade suggestion shows

#### Pro User Flow
- [ ] Deplete all monthly credits
- [ ] Verify pack credits used
- [ ] Trigger action when out of both
- [ ] Verify credit pack recommendation
- [ ] Purchase pack
- [ ] Verify pack credits added

#### Subscription Screen
- [ ] Navigate to subscription screen
- [ ] Verify total credits displayed correctly
- [ ] Verify monthly progress bar accurate
- [ ] Verify pack credits shown
- [ ] Verify info text explains priority

#### Balance Display
- [ ] Check compact badge in navigation
- [ ] Check card variant in profile
- [ ] Verify breakdown shows correctly
- [ ] Verify warnings appear when low

---

## Appendices

### A. File Structure

```
src/
├── services/
│   ├── CreditService.ts                  # Core credit management
│   ├── CreditFlowManager.ts              # Insufficient credits routing
│   ├── RevenueCatService.ts              # Purchase handling
│   └── SuperwallService.ts               # Paywall presentation
├── hooks/
│   └── useCreditBalance.ts               # React hook for credits
├── components/
│   └── CreditBalanceDisplay.tsx          # Credit UI component
├── screens/
│   ├── subscription/
│   │   └── SubscriptionScreen.tsx        # Subscription management
│   └── CreditPurchaseScreen.tsx          # [TO CREATE] Pack purchases
├── utils/
│   └── creditErrorHandler.ts             # 402 error handling
└── config/
    └── subscriptionConfig.ts             # Product configurations
```

---

### B. RevenueCat Product IDs

**Subscriptions**:
- `com.stelliumapp.dev.premium.monthly`
- `com.stelliumapp.dev.pro.monthly`

**Consumables**:
- `com.stelliumapp.dev.credits.small`
- `com.stelliumapp.dev.credits.medium`
- `com.stelliumapp.dev.credits.large`

**Production** (replace `dev` with nothing):
- `com.stelliumapp.premium.monthly`
- `com.stelliumapp.credits.small`
- etc.

---

### C. Superwall Paywall Events

- `credits_depleted_free_user` - Free user needs upgrade
- `tier_upgrade_pro` - Show Pro upgrade option
- `settings_upgrade` - Manual upgrade from settings
- `upgrade_prompt` - Generic upgrade prompt

---

### D. Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `402` | Insufficient Credits | Trigger CreditFlowManager |
| `404` | Subscription Not Found | Create default subscription |
| `400` | Invalid Action | Show error message |

---

## Next Steps

### Immediate (Sprint 1)
1. ✅ Dual-credit system frontend (COMPLETE)
2. 🔄 Backend credit deduction logic (IN PROGRESS)
3. ⏳ Create CreditPurchaseScreen.tsx
4. ⏳ Test RevenueCat webhook integration
5. ⏳ Configure Superwall paywalls

### Short-term (Sprint 2)
1. Implement 402 error handling in all API calls
2. Add optimistic UI updates for credit deductions
3. Add credit balance warnings/notifications
4. A/B test paywall messaging with Superwall
5. Add analytics tracking for conversion funnels

### Long-term (Sprint 3+)
1. Promotional credit campaigns
2. Referral credit bonuses
3. Credit gift cards
4. Subscription family sharing
5. Annual subscription options

---

**End of Document**
