import { relationshipApiClient } from '../../../shared/api/relationshipClient';
import type {
  CreditTransaction,
  CreditTransactionKind,
  CreditsState,
  SubscriptionState,
  SubscriptionTier,
} from '../store';

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

// ── /relationship-app/users/:userId/entitlements ────────────────────────────
interface EntitlementsResponse {
  success?: boolean;
  appDomain?: string;
  billingSystem?: string;
  bootstrapSource?: string;
  plan?: string | null;
  planActiveUntil?: string | null;
  isSubscriptionActive?: boolean;
  hasEverSubscribed?: boolean;
  credits?: {
    total?: number;
    monthly?: number;
    pack?: number;
    monthlyLimit?: number;
    resetDate?: string | null;
  };
}

export interface Entitlements {
  credits: CreditsState;
  subscription: SubscriptionState;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function planPriceLabelFor(plan: string | null | undefined): string | null {
  if (plan === 'monthly') return '$9.99';
  if (plan === 'annual') return '$79.99';
  return null;
}

function planDisplayName(plan: string | null | undefined): string | null {
  if (plan === 'monthly') return 'Iris Monthly';
  if (plan === 'annual') return 'Iris Annual';
  return null;
}

function subscriptionTier(plan: string | null | undefined): SubscriptionTier {
  if (plan === 'monthly') return 'monthly';
  if (plan === 'annual') return 'annual';
  return 'free';
}

function subscriptionLabel(tier: SubscriptionTier): string {
  if (tier === 'monthly') return 'Monthly';
  if (tier === 'annual') return 'Annual';
  return 'Free';
}

function normalizeEntitlements(response: EntitlementsResponse): Entitlements {
  const creditsBlock = response.credits ?? {};
  const total = toNumber(creditsBlock.total);
  const monthly = toNumber(creditsBlock.monthly);
  const pack = toNumber(creditsBlock.pack);
  const monthlyLimit = toNumber(creditsBlock.monthlyLimit);
  const plan = response.plan ?? 'free';

  const tier = subscriptionTier(plan);

  const credits: CreditsState = {
    balance: total,
    fromPlan: monthly,
    purchased: pack,
    planRenewsAt: creditsBlock.resetDate ?? null,
    planName: planDisplayName(plan),
    planPriceLabel: planPriceLabelFor(plan),
    planCreditsPerCycle: monthlyLimit > 0 ? monthlyLimit : null,
  };

  const subscription: SubscriptionState = {
    tier,
    renewsAt: response.planActiveUntil ?? creditsBlock.resetDate ?? null,
    label: subscriptionLabel(tier),
  };

  return { credits, subscription };
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  if (!userId) {
    throw new Error('getEntitlements requires a userId');
  }
  const response = await relationshipApiClient.get<EntitlementsResponse>(
    `/relationship-app/users/${encodeURIComponent(userId)}/entitlements`
  );
  if (response && response.success === false) {
    throw new Error('Failed to load entitlements');
  }
  return normalizeEntitlements(response ?? {});
}

export async function getCreditBalance(userId: string): Promise<CreditsState> {
  const { credits } = await getEntitlements(userId);
  return credits;
}

export async function getSubscription(userId: string): Promise<SubscriptionState> {
  const { subscription } = await getEntitlements(userId);
  return subscription;
}

// ── /api/credits/transactions ───────────────────────────────────────────────
interface RawCreditTransaction {
  id?: string;
  _id?: string;
  transactionId?: string;
  kind?: string;
  type?: string;
  category?: string;
  description?: string;
  memo?: string;
  note?: string;
  delta?: number;
  amount?: number;
  credits?: number;
  createdAt?: string;
  occurredAt?: string;
  timestamp?: string;
  date?: string;
}

interface CreditTransactionsResponse {
  success?: boolean;
  transactions?: RawCreditTransaction[];
  items?: RawCreditTransaction[];
  data?: RawCreditTransaction[];
}

const KIND_ALIASES: Record<string, CreditTransactionKind> = {
  analysis_full: 'analysis_full',
  full_analysis: 'analysis_full',
  relationship_full: 'analysis_full',
  analysis_overview: 'analysis_overview',
  overview: 'analysis_overview',
  preview: 'analysis_overview',
  score_reveal: 'analysis_overview',
  ask_iris: 'ask_iris',
  chat: 'ask_iris',
  ask: 'ask_iris',
  purchase: 'purchase',
  pack_purchase: 'purchase',
  renewal: 'renewal',
  subscription_renewal: 'renewal',
  plan_renewal: 'renewal',
  bonus: 'bonus',
  welcome_bonus: 'bonus',
};

function normalizeKind(raw: string | undefined, delta: number): CreditTransactionKind {
  if (raw) {
    const normalized = raw.toLowerCase();
    if (KIND_ALIASES[normalized]) return KIND_ALIASES[normalized];
    if (normalized.includes('full')) return 'analysis_full';
    if (normalized.includes('overview') || normalized.includes('preview')) {
      return 'analysis_overview';
    }
    if (normalized.includes('ask') || normalized.includes('chat')) return 'ask_iris';
    if (normalized.includes('purchase') || normalized.includes('pack')) return 'purchase';
    if (normalized.includes('renew') || normalized.includes('subscription')) {
      return 'renewal';
    }
    if (normalized.includes('bonus')) return 'bonus';
  }
  return delta > 0 ? 'bonus' : 'ask_iris';
}

function normalizeTransaction(raw: RawCreditTransaction, index: number): CreditTransaction {
  const deltaRaw =
    typeof raw.delta === 'number'
      ? raw.delta
      : typeof raw.amount === 'number'
      ? raw.amount
      : typeof raw.credits === 'number'
      ? raw.credits
      : 0;
  const delta = Number.isFinite(deltaRaw) ? deltaRaw : 0;

  const kindRaw = raw.kind ?? raw.type ?? raw.category;
  const kind = normalizeKind(kindRaw, delta);

  const description =
    raw.description ?? raw.memo ?? raw.note ?? fallbackDescription(kind);

  const occurredAt =
    raw.occurredAt ?? raw.createdAt ?? raw.timestamp ?? raw.date ?? new Date().toISOString();

  const id =
    raw.id ?? raw._id ?? raw.transactionId ?? `tx-${occurredAt}-${index}`;

  return {
    id,
    occurredAt,
    kind,
    description,
    delta,
  };
}

function fallbackDescription(kind: CreditTransactionKind): string {
  switch (kind) {
    case 'analysis_full':
      return 'Full analysis';
    case 'analysis_overview':
      return 'Score reveal';
    case 'ask_iris':
      return 'Ask Iris';
    case 'purchase':
      return 'Credit pack purchase';
    case 'renewal':
      return 'Plan renewal';
    case 'bonus':
      return 'Bonus credits';
    default:
      return 'Credit activity';
  }
}

export async function getCreditHistory(): Promise<CreditTransaction[]> {
  const response = await relationshipApiClient.get<
    CreditTransactionsResponse | RawCreditTransaction[]
  >('/api/credits/transactions');

  const rawList = Array.isArray(response)
    ? response
    : response?.transactions ?? response?.items ?? response?.data ?? [];

  return rawList
    .map((entry, index) => normalizeTransaction(entry, index))
    .sort((a, b) => {
      const aTs = Date.parse(a.occurredAt);
      const bTs = Date.parse(b.occurredAt);
      const aValid = Number.isFinite(aTs) ? aTs : 0;
      const bValid = Number.isFinite(bTs) ? bTs : 0;
      return bValid - aValid;
    });
}

// ── Unimplemented: purchase/restore still use local stubs until the store
// ── endpoints ship.  Keep these here so existing call sites don't break.
export async function purchaseCredits(packageId: string): Promise<CreditsState> {
  await delay(STUB_DELAY_MS);
  const pkg = CREDIT_PACKAGES.find((candidate) => candidate.id === packageId);
  if (!pkg) {
    throw new Error(`Unknown credit package: ${packageId}`);
  }
  throw new Error('Credit purchases are not wired to the backend yet.');
}

export async function restorePurchases(): Promise<CreditsState> {
  await delay(STUB_DELAY_MS);
  throw new Error('Restore purchases is not wired to the backend yet.');
}
