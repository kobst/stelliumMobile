import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { ApiError, relationshipUsersApi } from '../api';
import { useRelationshipAppStore } from '../store';

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
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
