import { useEffect } from 'react';
import { useRelationshipAppStore } from '../store';
import { initializeIrisRevenueCat } from '../services/irisRevenueCatService';

export function useIrisRevenueCat(): void {
  const profileId = useRelationshipAppStore((state) => state.profile?.id ?? null);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    initializeIrisRevenueCat(profileId).catch((error) => {
      if (__DEV__) {
        console.warn('[IrisRevenueCat] Configuration failed', error);
      }
    });
  }, [profileId]);
}
