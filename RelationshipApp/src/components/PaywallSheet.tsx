import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { SubscriptionPitch } from './SubscriptionPitch';
import {
  purchaseIrisCreditPack,
  purchaseIrisMonthly,
} from '../services/irisRevenueCatService';

type PurchaseIntent =
  | { kind: 'pack'; packageId: string }
  | { kind: 'subscribe' };

/**
 * App-wide paywall presented when a gated Iris action returns
 * INSUFFICIENT_CREDITS. Any module can trigger it with
 * `useRelationshipAppStore.getState().showPaywall(request)`. Mounted once at the
 * app root.
 */
export function PaywallSheet() {
  const { colors } = useTheme();
  const paywall = useRelationshipAppStore((state) => state.paywall);
  const hidePaywall = useRelationshipAppStore((state) => state.hidePaywall);
  const profileId = useRelationshipAppStore((state) => state.profile?.id ?? null);
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const setSubscription = useRelationshipAppStore((state) => state.setSubscription);

  // Local visibility mirrors the store request so the modal can close for the
  // native purchase without clearing the request itself.
  const [visible, setVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const pendingIntentRef = useRef<PurchaseIntent | null>(null);

  useEffect(() => {
    setVisible(paywall !== null);
  }, [paywall]);

  const runPurchase = useCallback(
    async (intent: PurchaseIntent) => {
      if (!profileId) {
        hidePaywall();
        return;
      }
      const state = useRelationshipAppStore.getState();
      const request = state.paywall;
      const purchasedBefore = state.credits?.purchased ?? 0;
      const subscribedBefore = (state.subscription?.tier ?? 'free') !== 'free';
      setIsPurchasing(true);
      try {
        const next =
          intent.kind === 'subscribe'
            ? await purchaseIrisMonthly(profileId)
            : await purchaseIrisCreditPack(profileId, intent.packageId);
        setCredits(next.credits);
        setSubscription(next.subscription);
        const unblocked =
          next.credits.purchased > purchasedBefore ||
          (next.subscription.tier !== 'free' && !subscribedBefore);
        hidePaywall();
        if (unblocked) {
          request?.onComplete?.();
        }
      } catch {
        // Purchase failed; dismiss and let the user retry the original action,
        // which re-triggers the paywall if still blocked.
        hidePaywall();
      } finally {
        setIsPurchasing(false);
      }
    },
    [hidePaywall, profileId, setCredits, setSubscription]
  );

  const flushPendingPurchase = useCallback(() => {
    const intent = pendingIntentRef.current;
    pendingIntentRef.current = null;
    if (intent) {
      runPurchase(intent);
    }
  }, [runPurchase]);

  // Defer the RevenueCat purchase until this modal's native view controller is
  // gone — otherwise the StoreKit / Test Store alert cannot present (the
  // RCTModalHostViewController issue also handled in PurchaseCreditsSheet).
  useEffect(() => {
    if (visible || Platform.OS !== 'ios' || !pendingIntentRef.current) {
      return;
    }
    const timeout = setTimeout(flushPendingPurchase, 400);
    return () => clearTimeout(timeout);
  }, [visible, flushPendingPurchase]);

  const beginPurchase = useCallback(
    (intent: PurchaseIntent) => {
      if (isPurchasing || pendingIntentRef.current) {
        return;
      }
      pendingIntentRef.current = intent;
      setVisible(false);
      if (Platform.OS !== 'ios') {
        flushPendingPurchase();
      }
    },
    [flushPendingPurchase, isPurchasing]
  );

  const handleClose = useCallback(() => {
    if (isPurchasing || pendingIntentRef.current) {
      return;
    }
    hidePaywall();
  }, [hidePaywall, isPurchasing]);

  if (!paywall) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onDismiss={Platform.OS === 'ios' ? flushPendingPurchase : undefined}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <SubscriptionPitch
              mode="paywall"
              pendingAction={{
                label: paywall.label,
                missingCredits: paywall.missingCredits,
              }}
              onPressPack={(packageId) => beginPurchase({ kind: 'pack', packageId })}
              onPressSubscribe={() => beginPurchase({ kind: 'subscribe' })}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
