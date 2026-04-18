import type { CreditTransaction, CreditsState, SubscriptionState } from '../store';

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

// TODO: replace with real `/getCreditHistory` once endpoint ships.
export async function getCreditHistory(): Promise<CreditTransaction[]> {
  await delay(STUB_DELAY_MS);
  return [
    {
      id: 'tx-001',
      occurredAt: '2026-04-15T00:00:00.000Z',
      kind: 'analysis_full',
      description: 'Full analysis · You & Emma Watson',
      delta: -3,
    },
    {
      id: 'tx-002',
      occurredAt: '2026-04-14T12:00:00.000Z',
      kind: 'ask_iris',
      description: 'Ask Iris · Your chart',
      delta: -1,
    },
    {
      id: 'tx-003',
      occurredAt: '2026-04-14T08:00:00.000Z',
      kind: 'analysis_overview',
      description: 'Score reveal · You & Harry Styles',
      delta: -1,
    },
    {
      id: 'tx-004',
      occurredAt: '2026-04-12T00:00:00.000Z',
      kind: 'ask_iris',
      description: 'Ask Iris · You & Sarah Chen',
      delta: -1,
    },
    {
      id: 'tx-005',
      occurredAt: '2026-04-10T00:00:00.000Z',
      kind: 'analysis_full',
      description: 'Full analysis · You & Sarah Chen',
      delta: -3,
    },
    {
      id: 'tx-006',
      occurredAt: '2026-04-08T00:00:00.000Z',
      kind: 'analysis_overview',
      description: 'Score reveal · You & Alex Rivera',
      delta: -1,
    },
    {
      id: 'tx-007',
      occurredAt: '2026-04-01T00:00:00.000Z',
      kind: 'renewal',
      description: 'Monthly renewal · Iris Monthly',
      delta: 200,
    },
    {
      id: 'tx-008',
      occurredAt: '2026-03-28T00:00:00.000Z',
      kind: 'purchase',
      description: 'Credit pack purchase',
      delta: 100,
    },
    {
      id: 'tx-009',
      occurredAt: '2026-03-25T00:00:00.000Z',
      kind: 'ask_iris',
      description: 'Ask Iris · Your chart',
      delta: -1,
    },
    {
      id: 'tx-010',
      occurredAt: '2026-03-01T00:00:00.000Z',
      kind: 'renewal',
      description: 'Monthly renewal · Iris Monthly',
      delta: 200,
    },
    {
      id: 'tx-011',
      occurredAt: '2026-02-28T00:00:00.000Z',
      kind: 'bonus',
      description: 'Welcome bonus',
      delta: 3,
    },
  ];
}
