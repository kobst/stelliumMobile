import type { NotificationPrefs, ProfileGender } from '../store';

const STUB_DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BirthDetailsPayload {
  dateOfBirth: string;
  time: string | null;
  placeOfBirth: string;
  latitude: number | null;
  longitude: number | null;
  totalOffsetHours: number | null;
}

export async function getBirthEditsRemaining(): Promise<number> {
  await delay(STUB_DELAY_MS);
  return 2;
}

// TODO: wire to real `/updateBirthDetails` endpoint. Server will recalc
// profile + all relationship scores and decrement the edits remaining.
export async function updateBirthDetails(
  _payload: BirthDetailsPayload
): Promise<{ remaining: number }> {
  await delay(STUB_DELAY_MS);
  return { remaining: 1 };
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  await delay(STUB_DELAY_MS);
  return {
    weeklyArticle: true,
    productUpdates: true,
    transitAlerts: false,
  };
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs
): Promise<NotificationPrefs> {
  await delay(STUB_DELAY_MS);
  return prefs;
}

// TODO: real delete-account endpoint. See BACKLOG.md → "Wire real
// delete-account endpoint".
export async function deleteAccount(): Promise<{ success: true }> {
  await delay(STUB_DELAY_MS);
  return { success: true };
}

// TODO: wire to real `/updateProfileName` endpoint. See BACKLOG.md.
export async function updateName(
  _firstName: string,
  _lastName: string
): Promise<{ success: true }> {
  await delay(STUB_DELAY_MS);
  return { success: true };
}

// TODO: wire to real `/updateProfileGender` endpoint. See BACKLOG.md.
export async function updateGender(
  _gender: ProfileGender
): Promise<{ success: true }> {
  await delay(STUB_DELAY_MS);
  return { success: true };
}
