import { ApiError } from './client';

const MAX_ERROR_PREVIEW = 160;

function truncate(value: string, max = MAX_ERROR_PREVIEW): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

function flattenMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

export function devLog(label: string, payload?: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[${label}]`, payload ?? '');
}

export function devError(label: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (error instanceof ApiError) {
    console.warn(`[${label}] ApiError`, {
      status: error.status ?? 'unknown',
      code: error.code || undefined,
      message: truncate(flattenMessage(error.message)),
    });
    return;
  }

  if (error instanceof Error) {
    console.warn(`[${label}] error`, {
      name: error.name,
      message: truncate(flattenMessage(error.message)),
    });
    return;
  }

  console.warn(`[${label}] error`, error);
}
