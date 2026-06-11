import { getAuth, signOut } from '@react-native-firebase/auth';
import { useRelationshipAppStore } from '../store';
import { resetRootTo } from '../navigation/navigationRef';

function isNoCurrentUserError(message: string): boolean {
  return (
    message.includes('auth/no-current-user') ||
    message.includes('No user currently signed in.')
  );
}

/**
 * Fully sign the user out: clear the Firebase session first, then reset local
 * app state.
 *
 * Order matters. resetSession() clears guestProfileDraft/profileReveal, which
 * are dependencies of the bootstrap auth listener (useBootstrapSession). If the
 * Firebase session is still active when that listener re-runs, it re-fetches
 * the profile via getMe() and routes the user straight back into the app — so a
 * store-only reset never actually logs them out. Signing out of Firebase first
 * makes onAuthStateChanged resolve to a signed-out state, which clears the
 * profile and routes back to the start/sign-in screen.
 *
 * Best-effort: a missing or failed Firebase sign-out must not prevent clearing
 * local state.
 */
export async function signOutAndResetSession(): Promise<void> {
  const firebaseAuth = getAuth();
  try {
    if (firebaseAuth.currentUser) {
      await signOut(firebaseAuth);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isNoCurrentUserError(message)) {
      console.warn('[signOut] Firebase sign-out failed; clearing local state anyway:', message);
    }
  } finally {
    useRelationshipAppStore.getState().resetSession();
    // Drive the root navigator directly — the key/initialRouteName remount in
    // RootNavigator does not reliably swap the active screen on sign-out.
    resetRootTo('Welcome');
  }
}
