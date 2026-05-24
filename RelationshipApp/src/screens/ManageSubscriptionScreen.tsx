import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { SubscriptionPitch } from '../components/SubscriptionPitch';
import { PurchaseCreditsSheet } from '../components/PurchaseCreditsSheet';
import type { CreditPackage } from '../api/credits';
import {
  purchaseIrisCreditPack100,
  purchaseIrisMonthly,
} from '../services/irisRevenueCatService';

export function ManageSubscriptionScreen() {
  const { colors } = useTheme();
  const profileId = useRelationshipAppStore((state) => state.profile?.id ?? null);
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const setSubscription = useRelationshipAppStore((state) => state.setSubscription);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handlePressPack = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleSelectPackage = useCallback(
    async (pkg: CreditPackage) => {
      setSheetVisible(false);
      if (!profileId) {
        Alert.alert('Sign in required', 'Sign in before purchasing credits.');
        return;
      }
      try {
        if (pkg.id !== 'IRIS_CREDITS_100') {
          throw new Error('This credit pack is no longer available.');
        }
        const next = await purchaseIrisCreditPack100(profileId);
        setCredits(next.credits);
        setSubscription(next.subscription);
      } catch (error) {
        Alert.alert(
          'Purchase failed',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      }
    },
    [profileId, setCredits, setSubscription]
  );

  const handleSubscribe = useCallback(async () => {
    if (!profileId) {
      Alert.alert('Sign in required', 'Sign in before starting a subscription.');
      return;
    }
    try {
      const next = await purchaseIrisMonthly(profileId);
      setCredits(next.credits);
      setSubscription(next.subscription);
    } catch (error) {
      Alert.alert(
        'Subscription failed',
        error instanceof Error ? error.message : 'Please try again shortly.'
      );
    }
  }, [profileId, setCredits, setSubscription]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Membership" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SubscriptionPitch
          mode="settings"
          onPressPack={handlePressPack}
          onPressSubscribe={handleSubscribe}
        />
      </ScrollView>

      <PurchaseCreditsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelectPackage={handleSelectPackage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
});
