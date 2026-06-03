import { relationshipApiClient } from '../../../shared/api/relationshipClient';
import type { AskMessage } from '../store';

export const ASK_COST_PER_MESSAGE = 1;

/** Which chart/relationship the question is scoped to. */
export type AskTarget =
  | { kind: 'relationship'; compositeChartId: string }
  | { kind: 'self'; userId: string };

export interface AskBilling {
  creditsCharged: number;
  packBalance: number | null;
  resolution: string | null;
}

export interface SendAskMessageInput {
  target: AskTarget;
  question: string;
  // Optional aspect-context (Phase 2). The relationship endpoint takes
  // `scoredItems` (cluster items with codes); the self endpoint takes
  // `selectedAspects` (structured aspect/position objects). Sent only when set.
  scoredItems?: unknown[];
  selectedAspects?: unknown[];
}

export interface SendAskMessageResult {
  reply: AskMessage;
  billing: AskBilling | null;
}

interface AskApiResponse {
  success?: boolean;
  answer?: string;
  referencedCodes?: string[];
  billing?: { creditsCharged?: number; packBalance?: number; resolution?: string } | null;
  billingSystem?: string;
  mode?: string;
}

export async function sendAskMessage(input: SendAskMessageInput): Promise<SendAskMessageResult> {
  const { target, question } = input;
  const endpoint =
    target.kind === 'relationship'
      ? `/relationship-app/relationships/${encodeURIComponent(target.compositeChartId)}/ask-iris`
      : `/relationship-app/users/${encodeURIComponent(target.userId)}/ask-iris`;

  const body =
    target.kind === 'relationship'
      ? { query: question, scoredItems: input.scoredItems }
      : { query: question, selectedAspects: input.selectedAspects };

  const response = await relationshipApiClient.post<AskApiResponse>(endpoint, body);

  const answer = (response?.answer ?? '').trim();
  if (!answer) {
    throw new Error('Iris had no response. Please try again.');
  }

  const reply: AskMessage = {
    id: `iris-${Date.now()}`,
    role: 'iris',
    text: answer,
    createdAt: new Date().toISOString(),
  };

  const billing: AskBilling | null = response?.billing
    ? {
        creditsCharged: response.billing.creditsCharged ?? 0,
        packBalance:
          typeof response.billing.packBalance === 'number' ? response.billing.packBalance : null,
        resolution: response.billing.resolution ?? null,
      }
    : null;

  return { reply, billing };
}
