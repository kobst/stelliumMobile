# 🚀 Credit System Migration - Implementation Plan

**Status:** Ready for Implementation
**Estimated Time:** 2-3 weeks
**Risk Level:** High (requires coordinated changes across all systems)

---

## 📋 Table of Contents

1. [Phase 1: Backend Changes](#phase-1-backend-changes)
2. [Phase 2: App Store Connect & RevenueCat Setup](#phase-2-app-store-connect--revenuecat-setup)
3. [Phase 3: Mobile App Changes](#phase-3-mobile-app-changes)
4. [Phase 4: Superwall Updates](#phase-4-superwall-updates)
5. [Phase 5: Testing & Rollout](#phase-5-testing--rollout)
6. [Phase 6: Data Migration](#phase-6-data-migration)

---

## Phase 1: Backend Changes
**Priority:** HIGHEST - Must be completed first
**Time Estimate:** 3-5 days

###  1.1 Database Schema Updates

**Add to User/Subscription Collection:**
```javascript
{
  // NEW FIELDS
  remainingCredits: Number,          // Current credit balance
  totalCreditsAllotted: Number,      // Monthly allotment (10/200/1000)
  lastCreditRefillDate: Date,        // When credits were last refilled
  creditRefillDay: Number,           // Day of month to refill (1-31)
  creditPurchaseHistory: [{          // A-la-carte purchase history
    packId: String,                  // 'small', 'medium', 'large'
    credits: Number,                 // Credits added
    price: Number,                   // Amount paid
    purchaseDate: Date,
    revenueCatTransactionId: String,
    productId: String
  }],
  creditUsageHistory: [{             // Optional: audit trail
    action: String,                  // 'quickChartOverview', 'fullNatalReport', etc.
    creditsDeducted: Number,
    remainingAfter: Number,
    timestamp: Date,
    relatedId: String                // Chart ID, report ID, etc.
  }],

  // DEPRECATED (keep for migration, then remove)
  quickChartsUsed: Number,
  quickMatchesUsed: Number,
  reportsUsed: Number,
  chatQuestionsUsed: Number
}
```

### 1.2 Backend Configuration

**Create `/config/creditSystem.js`:**
```javascript
module.exports = {
  // Monthly credit allotments
  TIER_CREDITS: {
    free: 10,
    premium: 200,
    pro: 1000
  },

  // Action costs
  CREDIT_COSTS: {
    quickChartOverview: 5,
    fullNatalReport: 15,
    relationshipOverview: 5,
    fullRelationshipReport: 15,
    askStelliumQuestion: 1
  },

  // A-la-carte packs
  CREDIT_PACKS: {
    small: { credits: 20, productId: 'com.stelliumapp.dev.credits.small' },
    medium: { credits: 100, productId: 'com.stelliumapp.dev.credits.medium' },
    large: { credits: 300, productId: 'com.stelliumapp.dev.credits.large' }
  }
};
```

### 1.3 New API Endpoints

**Create `/routes/credits.js`:**

```javascript
// Get current credit balance
GET    /api/v1/users/:userId/credits
Response: {
  remainingCredits: 150,
  totalCreditsAllotted: 200,
  nextRefillDate: "2025-11-21",
  tier: "premium"
}

// Deduct credits for action
POST   /api/v1/users/:userId/credits/deduct
Body: {
  action: "quickChartOverview",  // or "fullNatalReport", etc.
  relatedId: "chart_12345"       // Optional: for audit trail
}
Response: {
  success: true,
  creditsDeducted: 5,
  remainingCredits: 145
}

// Validate if user has enough credits
POST   /api/v1/users/:userId/credits/validate
Body: {
  action: "fullNatalReport"
}
Response: {
  hasEnoughCredits: true,
  required: 15,
  available: 145
}

// Purchase a-la-carte credit pack
POST   /api/v1/users/:userId/credits/purchase
Body: {
  packId: "medium",  // 'small', 'medium', or 'large'
  revenueCatTransactionId: "..."
}
Response: {
  success: true,
  creditsAdded: 100,
  newBalance: 245
}

// Refill monthly credits (called by subscription webhook)
POST   /api/v1/users/:userId/credits/refill
Body: {
  tier: "premium"
}
Response: {
  success: true,
  creditsRefilled: 200,
  newBalance: 200
}
```

### 1.4 Update Existing Endpoints

**Endpoints that need credit checks:**

1. **Chart Generation (`POST /api/v1/charts`):**
   ```javascript
   // Before generating
   const validation = await validateCredits(userId, 'quickChartOverview');
   if (!validation.hasEnoughCredits) {
     return res.status(402).json({
       error: 'INSUFFICIENT_CREDITS',
       required: 5,
       available: validation.available
     });
   }

   // Generate chart...

   // After success
   await deductCredits(userId, 'quickChartOverview', chartId);
   ```

2. **Full Report Generation (`POST /api/v1/reports`):**
   - Check for 15 credits before generating
   - Deduct after success

3. **Relationship Overview (`POST /api/v1/relationships/overview`):**
   - Check for 5 credits
   - Deduct after success

4. **Full Relationship Report (`POST /api/v1/relationships/report`):**
   - Check for 15 credits
   - Deduct after success

5. **Ask Stellium Q&A (`POST /api/v1/chat/ask`):**
   - Check for 1 credit
   - Deduct after success

### 1.5 RevenueCat Webhook Handler

**Update `/webhooks/revenuecat.js`:**

```javascript
// Handle subscription renewal
case 'RENEWAL':
case 'INITIAL_PURCHASE':
  // Determine tier from productId
  const tier = mapProductIdToTier(event.product_id);

  // Refill credits
  await refillMonthlyCredits(userId, tier);
  break;

// Handle credit pack purchase (consumable)
case 'NON_SUBSCRIPTION_PURCHASE':
  const packId = mapProductIdToPackId(event.product_id);
  await addPurchasedCredits(userId, packId, event.id);
  break;
```

### 1.6 Monthly Credit Refill Logic

**Create cron job or use webhook:**
```javascript
async function refillMonthlyCredits(userId, tier) {
  const user = await User.findById(userId);
  const creditsToAdd = TIER_CREDITS[tier];

  // Refill to full allotment (don't stack)
  user.remainingCredits = creditsToAdd;
  user.totalCreditsAllotted = creditsToAdd;
  user.lastCreditRefillDate = new Date();

  await user.save();

  console.log(`Refilled ${creditsToAdd} credits for user ${userId}`);
}
```

---

## Phase 2: App Store Connect & RevenueCat Setup
**Priority:** HIGH - Required before mobile app can sell credit packs
**Time Estimate:** 1-2 days

### 2.1 App Store Connect - Create Credit Pack Products

**Steps:**
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to: **My Apps** → **Stellium** → **In-App Purchases**
3. Click **"+"** button → Select **"Consumable"**

**Create 3 consumables:**

**Small Credit Pack:**
- Reference Name: `Stellium Credits - Small Pack`
- Product ID: `com.stelliumapp.dev.credits.small`
- Price: **$7.99 USD**
- Description: "Add 20 credits to unlock insights"

**Medium Credit Pack:**
- Reference Name: `Stellium Credits - Medium Pack`
- Product ID: `com.stelliumapp.dev.credits.medium`
- Price: **$24.99 USD**
- Description: "Add 100 credits for expanded access"

**Large Credit Pack:**
- Reference Name: `Stellium Credits - Large Pack`
- Product ID: `com.stelliumapp.dev.credits.large`
- Price: **$49.99 USD**
- Description: "Add 300 credits - best value"

4. **Submit each for review** (or wait until app submission)

### 2.2 Update StoreKit Configuration File (for testing)

**Edit `ios/StelliumApp.storekit` in Xcode:**

```xml
<!-- Add these products -->
<Product ID="com.stelliumapp.dev.credits.small" ReferenceID="credits_small" Type="Consumable">
  <Price>7.99</Price>
  <Locale>en_US</Locale>
</Product>

<Product ID="com.stelliumapp.dev.credits.medium" ReferenceID="credits_medium" Type="Consumable">
  <Price>24.99</Price>
  <Locale>en_US</Locale>
</Product>

<Product ID="com.stelliumapp.dev.credits.large" ReferenceID="credits_large" Type="Consumable">
  <Price>49.99</Price>
  <Locale>en_US</Locale>
</Product>
```

### 2.3 RevenueCat Dashboard Setup

**Steps:**
1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Go to: **Products**
3. Click **"Add Product"**

**Add 3 products:**
- ID: `credits_small` → App Store ID: `com.stelliumapp.dev.credits.small`
- ID: `credits_medium` → App Store ID: `com.stelliumapp.dev.credits.medium`
- ID: `credits_large` → App Store ID: `com.stelliumapp.dev.credits.large`

4. **Don't add to Offerings** (we'll handle presentation manually)

5. **Update webhook URL** (if not already set):
   - Go to **Settings** → **Integrations** → **Webhooks**
   - URL: `https://api.dev.stellium.ai/webhooks/revenuecat`
   - Events: `INITIAL_PURCHASE`, `RENEWAL`, `NON_SUBSCRIPTION_PURCHASE`, `CANCELLATION`

---

## Phase 3: Mobile App Changes
**Priority:** HIGH
**Time Estimate:** 3-4 days

### 3.1 Update Types

**Already started in `src/config/subscriptionConfig.ts`**

Complete the migration:
1. Remove `limits` property
2. Add `monthlyCredits` property to each plan
3. Update descriptions to mention credits
4. Add credit pack definitions

### 3.2 Update Backend API Types

**Create `src/types/credits.ts`:**
```typescript
export interface CreditBalance {
  remainingCredits: number;
  totalCreditsAllotted: number;
  nextRefillDate: string;
  tier: SubscriptionTier;
}

export interface CreditValidation {
  hasEnoughCredits: boolean;
  required: number;
  available: number;
}

export interface CreditPurchase {
  packId: 'small' | 'medium' | 'large';
  credits: number;
  price: number;
  revenueCatTransactionId: string;
}
```

### 3.3 Create Credit Service

**Create `src/services/CreditService.ts`:**
```typescript
import { subscriptionsApi } from '../api/subscriptions';
import { CREDIT_COSTS, CREDIT_PACKS } from '../config/subscriptionConfig';
import { revenueCatService } from './RevenueCatService';

class CreditService {
  async getCreditBalance(userId: string): Promise<CreditBalance> {
    return subscriptionsApi.getCreditBalance(userId);
  }

  async validateAction(userId: string, action: CreditAction): Promise<boolean> {
    const cost = CREDIT_COSTS[action];
    const validation = await subscriptionsApi.validateCredits(userId, action);
    return validation.hasEnoughCredits;
  }

  async deductCredits(userId: string, action: CreditAction, relatedId?: string): Promise<void> {
    await subscriptionsApi.deductCredits(userId, action, relatedId);
  }

  async purchaseCreditPack(packId: string): Promise<void> {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) throw new Error('Invalid pack ID');

    // Purchase through RevenueCat
    const result = await revenueCatService.purchaseProduct(pack.revenueCatProductId);

    if (result.success) {
      // Backend webhook will handle credit addition
      console.log('[CreditService] Credit pack purchased:', packId);
    }
  }
}

export const creditService = new CreditService();
```

### 3.4 Create Credit Display Component

**Create `src/components/credits/CreditBalance.tsx`:**
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { useStore } from '../../store';

const CreditBalance: React.FC = () => {
  const { colors } = useTheme();
  const { creditBalance } = useStore();

  if (!creditBalance) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant }]}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
        Credits
      </Text>
      <Text style={[styles.balance, { color: colors.primary }]}>
        {creditBalance.remainingCredits}
      </Text>
    </View>
  );
};
```

### 3.5 Update Subscription Screen

Replace usage progress bars with single credit balance display.

### 3.6 Create Credit Purchase Screen

**Create `src/screens/credits/CreditPurchaseScreen.tsx`** - Show 3 credit packs with purchase buttons

---

## Phase 4: Superwall Updates
**Priority:** MEDIUM
**Time Estimate:** 1 day

### 4.1 Update Subscription Paywall Copy

**Current → New:**
- ❌ "2 Full Natal or Compatibility Reports / Month"
- ✅ "200 Credits per Month"

- ❌ "Ask Stellium 200 Questions per Month"
- ✅ "1 credit per question - flexible usage"

**New descriptions:**
```
Premium:
• 200 Credits per Month
• Quick Overviews: 5 credits
• Full Reports: 15 credits
• Ask Stellium: 1 credit/question
• Daily + Weekly + Monthly Horoscopes

Pro:
• 1000 Credits per Month
• Effectively Unlimited
• All Premium Features
```

### 4.2 Create Credit Pack Paywall (Optional)

Create new paywall for when user runs out of credits:
- Show 3 credit pack options
- Trigger on `CREDITS_DEPLETED` event

---

## Phase 5: Testing & Rollout
**Priority:** CRITICAL
**Time Estimate:** 3-5 days

### 5.1 Backend Testing Checklist

- [ ] Credit deduction works for all actions
- [ ] Credit validation prevents actions when insufficient
- [ ] Monthly credit refill works on subscription renewal
- [ ] A-la-carte purchase adds credits correctly
- [ ] Webhook handles all RevenueCat events
- [ ] Credits never go negative
- [ ] Audit trail logs all transactions

### 5.2 Mobile App Testing Checklist

- [ ] Credit balance displays correctly
- [ ] Actions blocked when insufficient credits
- [ ] Credit packs can be purchased
- [ ] Credits refill on subscription renewal
- [ ] Paywall shows correct credit information
- [ ] Theme switching works on credit screens

### 5.3 End-to-End Testing Scenarios

**Scenario 1: Free User**
1. Sign up → receives 10 credits
2. Generate Quick Chart → 5 credits deducted
3. Attempt Full Report → blocked (needs 15, has 5)
4. Purchase Small Pack ($7.99) → 20 credits added
5. Generate Full Report → succeeds, 15 credits deducted

**Scenario 2: Premium Subscriber**
1. Subscribe to Premium → 200 credits granted
2. Generate 10 Quick Charts → 50 credits deducted
3. Generate 5 Full Reports → 75 credits deducted
4. Use Ask Stellium 50 times → 50 credits deducted
5. Wait for renewal → credits refill to 200

**Scenario 3: Upgrade Path**
1. Start as Free (10 credits)
2. Use 5 credits
3. Upgrade to Premium → 200 credits granted (not 205)
4. Confirm credits reset to monthly allotment

---

## Phase 6: Data Migration
**Priority:** CRITICAL - Must happen before launch
**Time Estimate:** 1 day

### 6.1 Migration Script

**Create `scripts/migrateToCredits.js`:**
```javascript
async function migrateUser(user) {
  const tier = user.subscription?.tier || 'free';
  const monthlyCredits = TIER_CREDITS[tier];

  // Calculate credits to grant based on remaining usage
  // This is optional - you could just grant full monthly allotment
  const remainingCredits = monthlyCredits; // Or calculate from old usage

  user.remainingCredits = remainingCredits;
  user.totalCreditsAllotted = monthlyCredits;
  user.lastCreditRefillDate = new Date();
  user.creditRefillDay = user.subscription?.renewsAt ?
    new Date(user.subscription.renewsAt).getDate() : 1;

  // Archive old usage data
  user.legacyUsage = {
    quickChartsUsed: user.quickChartsUsed,
    quickMatchesUsed: user.quickMatchesUsed,
    reportsUsed: user.reportsUsed,
    chatQuestionsUsed: user.chatQuestionsUsed
  };

  await user.save();
  console.log(`Migrated user ${user._id}: ${remainingCredits} credits`);
}

// Run for all users
const users = await User.find({});
for (const user of users) {
  await migrateUser(user);
}
```

### 6.2 Rollback Plan

Keep old fields for 30 days in case rollback is needed:
```javascript
// Don't delete these immediately
user.quickChartsUsed
user.quickMatchesUsed
user.reportsUsed
user.chatQuestionsUsed
```

---

## 🎯 Launch Checklist

### Pre-Launch (Week Before)
- [ ] Backend deployed to staging
- [ ] Mobile app tested on TestFlight
- [ ] All credit packs created in App Store Connect
- [ ] RevenueCat products configured
- [ ] Superwall paywalls updated
- [ ] Migration script tested on copy of production DB
- [ ] Rollback plan documented

### Launch Day
- [ ] Run migration script on production DB
- [ ] Deploy backend to production
- [ ] Submit app update to App Store
- [ ] Monitor error logs for credit-related issues
- [ ] Test live purchases with real money (small amounts)

### Post-Launch (First Week)
- [ ] Monitor credit purchases daily
- [ ] Check for credit deduction bugs
- [ ] Verify refills happen on renewals
- [ ] Collect user feedback
- [ ] Remove old usage fields after 30 days

---

## 📊 Success Metrics

Track these after launch:
- Credit pack purchase rate
- Average credits consumed per user per month
- Conversion rate from free → Premium (compare before/after)
- Support tickets about credit confusion

---

## 🚨 Risk Mitigation

**Risk:** Credits deducted but action fails
**Mitigation:** Implement refund logic + transaction logging

**Risk:** User purchases credit pack but doesn't receive credits
**Mitigation:** Webhook idempotency + manual verification endpoint

**Risk:** Monthly refill doesn't happen
**Mitigation:** Cron job backup + manual refill endpoint

**Risk:** Users confused by new system
**Mitigation:** In-app tutorial + updated help docs

---

## 📝 Documentation Updates Needed

1. Update API documentation with new credit endpoints
2. Create user-facing credit system FAQ
3. Update mobile app onboarding to explain credits
4. Add credit costs to each feature UI
5. Update marketing site pricing page

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Next Review:** After Phase 1 completion
