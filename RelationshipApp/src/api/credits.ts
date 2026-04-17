import type { CreditsState, SubscriptionState } from '../store';

const STUB_DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CreditPackage {
  id: string;
  credits: number;
  priceLabel: string;
  bonusLabel?: string;
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  { id: 'credits_20', credits: 20, priceLabel: '$1.99' },
  { id: 'credits_60', credits: 60, priceLabel: '$4.99', bonusLabel: 'Most popular' },
  { id: 'credits_150', credits: 150, priceLabel: '$9.99', bonusLabel: 'Best value' },
];

export async function getCreditBalance(): Promise<CreditsState> {
  await delay(STUB_DELAY_MS);
  return {
    balance: 147,
    fromPlan: 127,
    purchased: 20,
    planRenewsAt: '2026-05-14',
    planName: 'Iris Monthly',
    planPriceLabel: '$9.99',
    planCreditsPerCycle: 200,
  };
}

export async function getSubscription(): Promise<SubscriptionState> {
  await delay(STUB_DELAY_MS);
  return {
    tier: 'monthly',
    renewsAt: '2026-05-14',
    label: 'Monthly',
  };
}

export async function purchaseCredits(packageId: string): Promise<CreditsState> {
  await delay(STUB_DELAY_MS);
  const pkg = CREDIT_PACKAGES.find((candidate) => candidate.id === packageId);
  if (!pkg) {
    throw new Error(`Unknown credit package: ${packageId}`);
  }
  const fromPlan = 127;
  const purchased = 20 + pkg.credits;
  return {
    balance: fromPlan + purchased,
    fromPlan,
    purchased,
    planRenewsAt: '2026-05-14',
    planName: 'Iris Monthly',
    planPriceLabel: '$9.99',
    planCreditsPerCycle: 200,
  };
}

export async function restorePurchases(): Promise<CreditsState> {
  await delay(STUB_DELAY_MS);
  return getCreditBalance();
}
