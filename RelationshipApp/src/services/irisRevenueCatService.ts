import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { relationshipAppEnv } from '../config/env';
import { getEntitlements, type Entitlements } from '../api/credits';

const OFFERING_ID = 'iris_default';
const MONTHLY_PRODUCT_ID = 'IRIS_SUB_MONTHLY';
const CREDIT_PACK_PRODUCT_IDS = new Set(['IRIS_CREDITS_SMALL', 'IRIS_CREDITS_LARGE']);

let configuredUserId: string | null = null;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
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
  const purchasePackage = offering?.availablePackages.find(
    (candidate) => candidate.product.identifier === productId
  );

  if (!purchasePackage) {
    throw new Error('This Iris purchase is not available right now.');
  }

  return purchasePackage;
}

async function refreshFulfilledEntitlements(userId: string): Promise<Entitlements> {
  let latest = await getEntitlements(userId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await delay(750);
    latest = await getEntitlements(userId);
  }
  return latest;
}

export async function initializeIrisRevenueCat(userId: string): Promise<void> {
  await configure(userId);
}

export async function purchaseIrisMonthly(userId: string): Promise<Entitlements> {
  const purchasePackage = await findPackage(userId, MONTHLY_PRODUCT_ID);
  await Purchases.purchasePackage(purchasePackage);
  return refreshFulfilledEntitlements(userId);
}

export async function purchaseIrisCreditPack(
  userId: string,
  productId: string
): Promise<Entitlements> {
  if (!CREDIT_PACK_PRODUCT_IDS.has(productId)) {
    throw new Error('This Iris credit pack is not available.');
  }
  const purchasePackage = await findPackage(userId, productId);
  await Purchases.purchasePackage(purchasePackage);
  return refreshFulfilledEntitlements(userId);
}

export async function restoreIrisPurchases(userId: string): Promise<Entitlements> {
  await configure(userId);
  await Purchases.restorePurchases();
  return refreshFulfilledEntitlements(userId);
}
