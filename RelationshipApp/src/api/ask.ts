import { relationshipApiClient } from '../../../shared/api/relationshipClient';
import type { AskMessage } from '../store';

export const ASK_COST_PER_MESSAGE = 1;

/** Which chart/relationship the question is scoped to. */
export type AskTarget =
  | { kind: 'relationship'; compositeChartId: string }
  | { kind: 'subject'; subjectId: string }
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
  // `scoredItems` (cluster items with codes); the self and subject endpoints
  // take `selectedAspects` (structured aspect/position objects). Sent only when set.
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
      : target.kind === 'subject'
      ? `/relationship-app/subjects/${encodeURIComponent(target.subjectId)}/ask-iris`
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

interface AskHistoryMessage {
  role?: string;
  content?: string;
  timestamp?: string;
}

interface AskHistoryResponse {
  success?: boolean;
  chatHistory?: AskHistoryMessage[];
}

/**
 * Load the persisted chat history for a target (server is the source of truth;
 * the in-memory thread is wiped on reload). Returns messages oldest-first.
 */
export async function fetchAskHistory(target: AskTarget, limit = 20): Promise<AskMessage[]> {
  const endpoint =
    target.kind === 'relationship'
      ? `/relationships/${encodeURIComponent(target.compositeChartId)}/chat-history?limit=${limit}`
      : `/users/${encodeURIComponent(
          target.kind === 'subject' ? target.subjectId : target.userId
        )}/birthchart/chat-history?limit=${limit}`;

  const response = await relationshipApiClient.get<AskHistoryResponse>(endpoint);
  const history = response?.chatHistory ?? [];

  return history
    .map((message, index): AskMessage | null => {
      const text = typeof message?.content === 'string' ? message.content.trim() : '';
      if (!text) {
        return null;
      }
      return {
        id: `hist-${index}-${message.timestamp ?? ''}`,
        role: message.role === 'user' ? 'user' : 'iris',
        text,
        createdAt: message.timestamp ? String(message.timestamp) : new Date().toISOString(),
      };
    })
    .filter((message): message is AskMessage => message !== null);
}
