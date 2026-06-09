import { useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { ApiError, relationshipUsersApi } from '../api';
import { relationshipAppEnv } from '../config/env';
import { useRelationshipAppStore } from '../store';
import { getEntitlements } from '../api/credits';

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function isMissingFirebaseUserError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode =
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const maybeMessage =
    error instanceof Error ? error.message : String(error);

  return (
    maybeCode === 'auth/user-not-found' ||
    maybeMessage.includes('auth/user-not-found')
  );
}

export function useBootstrapSession() {
  const firebaseAuth = getAuth();
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const setProfile = useRelationshipAppStore((state) => state.setProfile);
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const setSubscription = useRelationshipAppStore((state) => state.setSubscription);
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);

  useEffect(() => {
    if (relationshipAppEnv.enableLocalUxMode) {
      setAuthState({
        authStatus: 'signedOut',
        firebaseUid: null,
        firebaseEmail: null,
      });
      setProfile(null);
      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
      return;
    }

    // Check current auth state without blocking on it.
    // Guest users proceed without Firebase auth; signed-in users get their profile loaded.
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      setAuthState({
        authStatus: 'signedOut',
        firebaseUid: null,
        firebaseEmail: null,
      });
      setProfile(null);
      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
    } else {
      setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setAuthState({
          authStatus: 'signedOut',
          firebaseUid: null,
          firebaseEmail: null,
        });
        setProfile(null);
        setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
        return;
      }

      if (guestProfileDraft && profileReveal) {
        setAuthState({
          authStatus: 'signedIn',
          firebaseUid: user.uid,
          firebaseEmail: user.email ?? null,
        });
        setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
        return;
      }

      setAuthState({
        authStatus: 'signedIn',
        firebaseUid: user.uid,
        firebaseEmail: user.email ?? null,
      });
      setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });

      try {
        const profile = await relationshipUsersApi.getMe();
        setProfile(profile);
        setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
        getEntitlements(profile.id)
          .then(({ credits, subscription }) => {
            setCredits(credits);
            setSubscription(subscription);
          })
          .catch((entitlementsError) => {
            if (__DEV__) {
              console.warn(
                '[useBootstrapSession] entitlements hydration failed',
                entitlementsError
              );
            }
          });
      } catch (error) {
        if (isMissingFirebaseUserError(error)) {
          try {
            await signOut(firebaseAuth);
          } catch (signOutError) {
            console.error('Failed to clear stale Firebase session:', signOutError);
          }

          setAuthState({
            authStatus: 'signedOut',
            firebaseUid: null,
            firebaseEmail: null,
          });
          setProfile(null);
          setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
          return;
        }

        if (isNotFoundError(error)) {
          setProfile(null);
          setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
          return;
        }

        setProfile(null);
        setBootstrapState({
          bootstrapStatus: 'error',
          bootstrapError: error instanceof Error ? error.message : 'Failed to load account',
        });
      }
    });

    return unsubscribe;
  }, [
    firebaseAuth,
    guestProfileDraft,
    profileReveal,
    setAuthState,
    setBootstrapState,
    setProfile,
    setCredits,
    setSubscription,
  ]);
}
