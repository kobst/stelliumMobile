import { usersApi } from '../../../shared/api/users';

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

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  // Backend deletes all user data but may leave the Firebase Auth record for
  // the client to remove (auth deletion needs a recent client-side sign-in).
  firebaseAuthDeletionRequired: boolean;
}

export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  if (!userId) {
    throw new Error('No signed-in user to delete.');
  }
  const response = await usersApi.deleteAccount(userId);
  if (!response.success) {
    throw new Error(response.message || 'Account deletion failed.');
  }
  return response;
}

export interface UpdateNameResult {
  firstName: string;
  lastName: string;
}

// Backend contract: PUT /users/:userId/profile accepts firstName/lastName only.
// Gender has no update endpoint, so the edit screen renders it read-only.
export async function updateName(
  userId: string,
  firstName: string,
  lastName: string
): Promise<UpdateNameResult> {
  if (!userId) {
    throw new Error('No signed-in user.');
  }
  const trimmedFirst = firstName.trim();
  if (!trimmedFirst) {
    throw new Error('First name is required.');
  }
  const response = await usersApi.updateUserProfile(userId, {
    firstName: trimmedFirst,
    lastName: lastName.trim(),
  });
  if (!response.success) {
    throw new Error('Name update failed.');
  }
  return {
    firstName: response.user.firstName,
    lastName: response.user.lastName,
  };
}
