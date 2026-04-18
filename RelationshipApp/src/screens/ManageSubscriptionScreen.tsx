import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { SubscriptionPitch } from '../components/SubscriptionPitch';
import { PurchaseCreditsSheet } from '../components/PurchaseCreditsSheet';
import { purchaseCredits, type CreditPackage } from '../api/credits';

export function ManageSubscriptionScreen() {
  const { colors } = useTheme();
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handlePressPack = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleSelectPackage = useCallback(
    async (pkg: CreditPackage) => {
      setSheetVisible(false);
      try {
        const next = await purchaseCredits(pkg.id);
        setCredits(next);
      } catch (error) {
        Alert.alert(
          'Purchase failed',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      }
    },
    [setCredits]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Membership" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SubscriptionPitch mode="settings" onPressPack={handlePressPack} />
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
