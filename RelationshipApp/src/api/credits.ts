import { relationshipApiClient } from '../../../shared/api/relationshipClient';
import type {
  CreditTransaction,
  CreditTransactionKind,
  CreditsState,
  SubscriptionState,
  SubscriptionTier,
} from '../store';

export interface CreditPackage {
  id: string;
  credits: number;
  priceLabel: string;
  bonusLabel?: string;
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  { id: 'IRIS_CREDITS_SMALL', credits: 75, priceLabel: '$9.99' },
  { id: 'IRIS_CREDITS_LARGE', credits: 250, priceLabel: '$24.99', bonusLabel: 'Best value' },
];

interface BillingPlan {
  productKey: string;
  displayName: string;
  interval: 'month' | 'one_time';
  priceLabel: string;
  fullAnalysesPerPeriod?: number;
  askQuestionsPerDayLimit?: number;
}

interface BillingProductsResponse {
  success?: boolean;
  plans?: BillingPlan[];
  creditPacks?: Array<{
    productKey: string;
    credits: number;
    priceLabel: string;
  }>;
}

export interface BillingProducts {
  plans: BillingPlan[];
  creditPacks: CreditPackage[];
}

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
    purchased?: number;
  };
  fullAnalysisQuota?: {
    limit?: number;
    remaining?: number;
    resetsAt?: string | null;
  };
  fairUse?: {
    askQuestionsDailyLimit?: number;
    askQuestionsUsedToday?: number;
    askQuestionsRemainingToday?: number;
  };
}

export interface Entitlements {
  credits: CreditsState;
  subscription: SubscriptionState;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function planPriceLabelFor(plan: string | null | undefined): string | null {
  if (plan === 'monthly') {
    return '$14.99';
  }
  return null;
}

function planDisplayName(plan: string | null | undefined): string | null {
  if (plan === 'monthly') {
    return 'Iris Monthly';
  }
  return null;
}

function subscriptionTier(plan: string | null | undefined): SubscriptionTier {
  if (plan === 'monthly') {
    return 'monthly';
  }
  return 'free';
}

function subscriptionLabel(tier: SubscriptionTier): string {
  if (tier === 'monthly') {
    return 'Monthly';
  }
  return 'Free';
}

function normalizeEntitlements(response: EntitlementsResponse): Entitlements {
  const creditsBlock = response.credits ?? {};
  const purchased = toNumber(creditsBlock.purchased ?? creditsBlock.total);
  const quota = response.fullAnalysisQuota ?? {};
  const fairUse = response.fairUse ?? {};
  const plan = response.plan ?? 'free';

  const tier = subscriptionTier(plan);

  const credits: CreditsState = {
    balance: purchased,
    purchased,
    planRenewsAt: quota.resetsAt ?? null,
    planName: planDisplayName(plan),
    planPriceLabel: planPriceLabelFor(plan),
    fullAnalysesRemaining: toNumber(quota.remaining),
    fullAnalysesLimit: toNumber(quota.limit),
    askQuestionsRemainingToday: toNumber(fairUse.askQuestionsRemainingToday),
    askQuestionsDailyLimit: toNumber(fairUse.askQuestionsDailyLimit),
  };

  const subscription: SubscriptionState = {
    tier,
    renewsAt: response.planActiveUntil ?? quota.resetsAt ?? null,
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

export async function getBillingProducts(): Promise<BillingProducts> {
  const response = await relationshipApiClient.get<BillingProductsResponse>(
    '/relationship-app/billing/products'
  );
  if (response && response.success === false) {
    throw new Error('Failed to load billing products');
  }

  return {
    plans: response?.plans ?? [],
    creditPacks:
      response?.creditPacks?.map((pack) => ({
        id: pack.productKey,
        credits: pack.credits,
        priceLabel: pack.priceLabel,
      })) ?? [...CREDIT_PACKAGES],
  };
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
  >('/relationship-app/api/credits/transactions');

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
