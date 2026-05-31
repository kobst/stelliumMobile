import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { relationshipAppEnv } from '../config/env';
import { getEntitlements, type Entitlements } from '../api/credits';

const OFFERING_ID = 'iris_default';
const MONTHLY_PRODUCT_ID = 'IRIS_SUB_MONTHLY';
const CREDIT_PACK_GRANTS: Record<string, number> = {
  IRIS_CREDITS_SMALL: 75,
  IRIS_CREDITS_LARGE: 250,
};
// Guards only the non-interactive setup (configure + fetch offerings). The
// interactive purchase itself is intentionally NOT timed out — see the purchase
// functions below.
const SETUP_TIMEOUT_MS = 20_000;

let configuredUserId: string | null = null;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'userCancelled' in error &&
    (error as { userCancelled?: boolean }).userCancelled === true
  );
}

function requireApiKey(): string {
  if (!relationshipAppEnv.revenueCatApiKey) {
    throw new Error('Iris purchases are not configured for this build.');
  }
  return relationshipAppEnv.revenueCatApiKey;
}

async function configure(userId: string): Promise<void> {
  const apiKey = requireApiKey();
  if (configuredUserId === userId) {
    if (__DEV__) {
      console.log('[IrisRevenueCat] already configured', { userId });
    }
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    console.log('[IrisRevenueCat] configuring SDK', {
      userId,
      keyPrefix: apiKey.slice(0, 8),
    });
  }

  if (!configuredUserId) {
    Purchases.configure({ apiKey, appUserID: userId });
  } else {
    await Purchases.logIn(userId);
  }

  configuredUserId = userId;
}

async function findPackage(userId: string, productId: string): Promise<PurchasesPackage> {
  await configure(userId);
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[OFFERING_ID] ?? offerings.current;
  if (__DEV__) {
    console.log('[IrisRevenueCat] offerings loaded', {
      requestedOffering: OFFERING_ID,
      currentOffering: offerings.current?.identifier ?? null,
      availableOfferings: Object.keys(offerings.all),
      packages: offering?.availablePackages.map((candidate) => ({
        identifier: candidate.identifier,
        productId: candidate.product.identifier,
        price: candidate.product.priceString,
      })) ?? [],
    });
  }
  const purchasePackage = offering?.availablePackages.find(
    (candidate) => candidate.product.identifier === productId
  );

  if (!purchasePackage) {
    throw new Error('This Iris purchase is not available right now.');
  }

  return purchasePackage;
}

async function refreshFulfilledEntitlements(
  userId: string,
  predicate?: (entitlements: Entitlements) => boolean
): Promise<Entitlements> {
  let latest = await getEntitlements(userId);
  if (__DEV__) {
    console.log('[IrisRevenueCat] entitlement refresh start', {
      userId,
      purchased: latest.credits.purchased,
      tier: latest.subscription.tier,
      fullAnalysesRemaining: latest.credits.fullAnalysesRemaining,
    });
  }
  if (!predicate || predicate(latest)) {
    return latest;
  }

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    await delay(1250);
    latest = await getEntitlements(userId);
    if (__DEV__) {
      console.log('[IrisRevenueCat] entitlement refresh poll', {
        attempt,
        purchased: latest.credits.purchased,
        tier: latest.subscription.tier,
        fullAnalysesRemaining: latest.credits.fullAnalysesRemaining,
      });
    }
    if (predicate(latest)) {
      return latest;
    }
  }
  return latest;
}

export async function initializeIrisRevenueCat(userId: string): Promise<void> {
  await configure(userId);
}

export async function purchaseIrisMonthly(userId: string): Promise<Entitlements> {
  const before = await getEntitlements(userId);
  const purchasePackage = await withTimeout(
    findPackage(userId, MONTHLY_PRODUCT_ID),
    SETUP_TIMEOUT_MS,
    'Could not reach the store to start your subscription. Check your connection and try again.'
  );
  if (__DEV__) {
    console.log('[IrisRevenueCat] starting monthly purchase', {
      userId,
      productId: MONTHLY_PRODUCT_ID,
      tierBefore: before.subscription.tier,
    });
  }
  try {
    if (__DEV__) {
      console.log('[IrisRevenueCat] purchase call: direct product', {
        productId: purchasePackage.product.identifier,
      });
    }
    // No timeout here: the interactive purchase includes the user reading the
    // store sheet, Face ID, password, and SCA challenges. Real failures
    // (network, store errors) reject on their own.
    await Purchases.purchaseProduct(MONTHLY_PRODUCT_ID);
  } catch (error) {
    if (isUserCancelled(error)) {
      // The user backed out — leave state untouched and skip entitlement polling.
      return before;
    }
    throw error;
  }
  return refreshFulfilledEntitlements(
    userId,
    (entitlements) => entitlements.subscription.tier === 'monthly'
  );
}

export async function purchaseIrisCreditPack(
  userId: string,
  productId: string
): Promise<Entitlements> {
  const grant = CREDIT_PACK_GRANTS[productId];
  if (!grant) {
    throw new Error('This Iris credit pack is not available.');
  }
  const before = await getEntitlements(userId);
  const purchasePackage = await withTimeout(
    findPackage(userId, productId),
    SETUP_TIMEOUT_MS,
    'Could not reach the store to start your purchase. Check your connection and try again.'
  );
  if (__DEV__) {
    console.log('[IrisRevenueCat] starting credit pack purchase', {
      userId,
      productId,
      grant,
      purchasedBefore: before.credits.purchased,
    });
  }
  try {
    if (__DEV__) {
      console.log('[IrisRevenueCat] purchase call: direct product', {
        productId: purchasePackage.product.identifier,
      });
    }
    // No timeout here: the interactive purchase includes the user reading the
    // store sheet, Face ID, password, and SCA challenges. Real failures
    // (network, store errors) reject on their own.
    await Purchases.purchaseProduct(productId);
  } catch (error) {
    if (isUserCancelled(error)) {
      // The user backed out — leave state untouched and skip entitlement polling.
      return before;
    }
    throw error;
  }
  return refreshFulfilledEntitlements(
    userId,
    (entitlements) => entitlements.credits.purchased >= before.credits.purchased + grant
  );
}

export async function restoreIrisPurchases(userId: string): Promise<Entitlements> {
  await configure(userId);
  await Purchases.restorePurchases();
  return refreshFulfilledEntitlements(userId);
}
