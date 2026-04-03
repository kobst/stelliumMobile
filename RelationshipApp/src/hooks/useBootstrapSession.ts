import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { ApiError, relationshipUsersApi } from '../api';
import { useRelationshipAppStore } from '../store';

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
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const setProfile = useRelationshipAppStore((state) => state.setProfile);

  useEffect(() => {
    setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });

    const unsubscribe = auth().onAuthStateChanged(async (user) => {
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

      setAuthState({
        authStatus: 'signedIn',
        firebaseUid: user.uid,
        firebaseEmail: user.email ?? null,
      });
      setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });

      try {
        const profile = await relationshipUsersApi.getProfileByFirebaseUid(user.uid);
        setProfile(profile);
        setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
      } catch (error) {
        if (isMissingFirebaseUserError(error)) {
          try {
            await auth().signOut();
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
  }, [setAuthState, setBootstrapState, setProfile]);
}
