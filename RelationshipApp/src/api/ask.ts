import type { AskMessage, AskThreadKey } from '../store';

const STUB_DELAY_MS = 600;

export const ASK_COST_PER_MESSAGE = 1;

export interface AskContext {
  threadKey: AskThreadKey;
  contextLabel: string;
}

export interface SendAskMessageInput {
  context: AskContext;
  thread: AskMessage[];
  question: string;
}

export interface SendAskMessageResult {
  reply: AskMessage;
  creditsCharged: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStubReply(contextLabel: string, question: string): string {
  return `(${contextLabel}) Stubbed Iris reply — real streaming response will replace this. You asked: "${question}"`;
}

export async function sendAskMessage({
  context,
  question,
}: SendAskMessageInput): Promise<SendAskMessageResult> {
  await delay(STUB_DELAY_MS);
  const reply: AskMessage = {
    id: `iris-${Date.now()}`,
    role: 'iris',
    text: buildStubReply(context.contextLabel, question),
    createdAt: new Date().toISOString(),
  };
  return {
    reply,
    creditsCharged: ASK_COST_PER_MESSAGE,
  };
}
