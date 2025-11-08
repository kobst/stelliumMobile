/**
 * Credit Purchase Screen - Enhanced Edition
 *
 * Premium UX for purchasing credits and discovering subscription plans.
 * Includes subscription upsell, a-la-carte packs, and comprehensive info.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { useCreditBalance } from '../hooks/useCreditBalance';
import { useStore } from '../store';
import { revenueCatService } from '../services/RevenueCatService';
import { superwallService } from '../services/SuperwallService';
import { CREDIT_PACKS, CreditPack, SUBSCRIPTION_PLANS } from '../config/subscriptionConfig';

interface CreditPurchaseScreenProps {
  navigation: any;
  route: {
    params?: {
      recommendedPack?: 'small' | 'medium' | 'large';
      source?: string;
    };
  };
}

const CreditPurchaseScreen: React.FC<CreditPurchaseScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { total, monthly, pack, monthlyLimit, addCredits, refreshBalance } = useCreditBalance();
  const { userSubscription } = useStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const recommendedPack = route.params?.recommendedPack || 'medium';
  const source = route.params?.source || 'manual';
  const currentTier = userSubscription?.tier || 'free';

  const handlePurchasePack = async (creditPack: CreditPack) => {
    console.log('[CreditPurchase] Starting pack purchase:', {
      packId: creditPack.id,
      credits: creditPack.credits,
      price: creditPack.price,
      source,
    });

    setPurchasing(creditPack.id);

    try {
      const result = await revenueCatService.purchaseProduct(
        creditPack.revenueCatProductId
      );

      if (!result.success) {
        if (result.error?.includes('cancelled')) {
          console.log('[CreditPurchase] User cancelled purchase');
          return;
        }

        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[CreditPurchase] Purchase successful');

      // Optimistically add credits
      addCredits(creditPack.credits);

      // Refresh balance from backend
      await refreshBalance();

      // Show success message
      Alert.alert(
        'Credits Added!',
        `${creditPack.credits} credits have been added to your account.`,
        [
          {
            text: 'Great!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[CreditPurchase] Unexpected error:', error);

      Alert.alert(
        'Purchase Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleUpgradeSubscription = async () => {
    try {
      console.log('[CreditPurchase] Showing upgrade paywall');
      await superwallService.showSettingsUpgradePaywall();
      console.log('[CreditPurchase] Paywall presented');

      // Refresh balance after potential purchase
      await refreshBalance();
    } catch (error) {
      console.error('[CreditPurchase] Failed to show paywall:', error);
    }
  };

  const premiumPlan = SUBSCRIPTION_PLANS.premium;
  const proPlan = SUBSCRIPTION_PLANS.pro;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8F6FF' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#F8F6FF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Buy Credits
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance Card */}
        <View style={styles.section}>
          <View
            style={[
              styles.balanceCard,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.primary,
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              },
            ]}
          >
            <Text style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
              ⚡ Current Balance
            </Text>
            <Text style={[styles.balanceValue, { color: colors.onSurface }]}>
              {total} credits
            </Text>
            {monthlyLimit > 0 && (
              <Text style={[styles.balanceSubtext, { color: colors.onSurfaceVariant }]}>
                {monthly} / {monthlyLimit} monthly
                {pack > 0 && ` • ${pack} pack credits`}
              </Text>
            )}
          </View>
        </View>

        {/* Subscription Upsell - Only show if not already Pro */}
        {currentTier !== 'pro' && (
          <View style={styles.section}>
            <View style={styles.upsellDivider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>
                {currentTier === 'free' ? '✨ Want premium access?' : '💫 Need more power?'}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.upsellSubtext, { color: colors.onSurfaceVariant }]}>
              {currentTier === 'free'
                ? 'Skip per-credit purchases and unlock everything with a Stellium plan'
                : 'Upgrade to Stellium Pro for higher limits and unlimited access'}
            </Text>

            {/* Single Card - Premium for free users, Pro for premium users */}
            <TouchableOpacity
              style={[
                styles.subscriptionCard,
                {
                  backgroundColor: currentTier === 'free' ? '#F7F3FF' : '#ECE7FF',
                  borderColor: currentTier === 'free' ? colors.primary : '#7A5BFF',
                  shadowColor: currentTier === 'free' ? colors.primary : '#7A5BFF',
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                },
              ]}
              onPress={handleUpgradeSubscription}
              activeOpacity={0.8}
            >
              <View style={styles.subscriptionHeader}>
                <Text
                  style={[
                    styles.subscriptionBadge,
                    { color: currentTier === 'free' ? colors.primary : '#7A5BFF' },
                  ]}
                >
                  {currentTier === 'free' ? '✨ PREMIUM' : '💫 PRO'}
                </Text>
                <Text style={[styles.subscriptionPrice, { color: colors.onSurface }]}>
                  {currentTier === 'free' ? premiumPlan.priceDisplay : proPlan.priceDisplay}
                </Text>
              </View>

              {currentTier === 'free' && (
                <Text style={[styles.subscriptionIncludes, { color: colors.onSurfaceVariant }]}>
                  Includes:
                </Text>
              )}

              {currentTier === 'free' ? (
                <>
                  <Text style={[styles.subscriptionFeature, { color: colors.onSurface }]}>
                    • Daily, weekly, and monthly horoscopes
                  </Text>
                  <Text style={[styles.subscriptionFeature, { color: colors.onSurface }]}>
                    • Use up to {premiumPlan.monthlyCredits} credits a month
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.subscriptionFeature, { color: colors.onSurface }]}>
                    • Everything in Premium
                  </Text>
                  <Text style={[styles.subscriptionFeature, { color: colors.onSurface }]}>
                    • Use up to {proPlan.monthlyCredits} credits a month
                  </Text>
                </>
              )}

              <View
                style={[
                  styles.upgradeButton,
                  { backgroundColor: currentTier === 'free' ? colors.primary : '#7A5BFF' },
                ]}
              >
                <Text style={[styles.upgradeButtonText, { color: '#FFFFFF' }]}>
                  {currentTier === 'free' ? 'Upgrade to Premium →' : 'Upgrade to Pro →'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Credit Packs Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            💎 Add More Credits
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
            Credits never expire • Add more anytime
          </Text>

          {CREDIT_PACKS.map((creditPack, index) => {
            const isBestValue = index === CREDIT_PACKS.length - 1;
            const isPurchasing = purchasing === creditPack.id;
            const pricePerCredit = (creditPack.price / creditPack.credits).toFixed(2);

            return (
              <View key={creditPack.id} style={styles.packContainer}>
                {isBestValue && (
                  <View
                    style={[
                      styles.packBadge,
                      { backgroundColor: '#10B981' },
                    ]}
                  >
                    <Text style={styles.packBadgeText}>
                      BEST VALUE
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.packCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isBestValue ? colors.primary : colors.border,
                      borderWidth: isBestValue ? 2 : 1,
                    },
                  ]}
                  onPress={() => handlePurchasePack(creditPack)}
                  disabled={isPurchasing}
                  activeOpacity={0.7}
                >
                  <View style={styles.packContent}>
                    <View style={styles.packLeft}>
                      <Text style={[styles.packCredits, { color: colors.onSurface }]}>
                        {creditPack.credits} Credits
                      </Text>
                      <Text style={[styles.packPricePerCredit, { color: colors.onSurfaceVariant }]}>
                        ${pricePerCredit} per credit
                      </Text>
                    </View>

                    <View style={styles.packRight}>
                      <Text style={[styles.packPrice, { color: colors.onSurface }]}>
                        {creditPack.priceDisplay}
                      </Text>

                      {isPurchasing ? (
                        <View style={[styles.buyButton, { backgroundColor: colors.surfaceVariant }]}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      ) : (
                        <View style={[styles.buyButton, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.buyButtonText, { color: colors.onPrimary }]}>
                            Add to Balance
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* How Credits Work - Collapsible */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.infoToggle, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => setShowHowItWorks(!showHowItWorks)}
            activeOpacity={0.7}
          >
            <Text style={[styles.infoToggleText, { color: colors.onSurface }]}>
              💡 How Credits Work
            </Text>
            <Text style={[styles.infoToggleIcon, { color: colors.onSurfaceVariant }]}>
              {showHowItWorks ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showHowItWorks && (
            <View style={[styles.infoContent, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                • Credits are used for readings, charts, and personalized chats
              </Text>
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                • Pack credits never expire and roll over forever
              </Text>
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                • Monthly credits are used first, then pack credits
              </Text>
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                • Credits are shared across all Stellium features
              </Text>
            </View>
          )}
        </View>

        {/* Usage Guide */}
        <View style={[styles.usageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.usageTitle, { color: colors.onSurface }]}>
            What Can You Do?
          </Text>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.onSurface }]}>Quick Chart Overview</Text>
            <Text style={[styles.usageCost, { color: colors.primary }]}>5 credits</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.onSurface }]}>Full Natal Report</Text>
            <Text style={[styles.usageCost, { color: colors.primary }]}>15 credits</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.onSurface }]}>Relationship Overview</Text>
            <Text style={[styles.usageCost, { color: colors.primary }]}>5 credits</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.onSurface }]}>Full Relationship Report</Text>
            <Text style={[styles.usageCost, { color: colors.primary }]}>15 credits</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.onSurface }]}>Ask Stellium Question</Text>
            <Text style={[styles.usageCost, { color: colors.primary }]}>1 credit</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },

  // Balance Card
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
  },

  // Subscription Upsell
  upsellDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  upsellSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  subscriptionCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionBadge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subscriptionPrice: {
    fontSize: 17,
    fontWeight: '700',
  },
  subscriptionIncludes: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subscriptionFeature: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Credit Packs
  packContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  packBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 1,
  },
  packBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  packCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  packContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packLeft: {
    flex: 1,
  },
  packCredits: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  packPricePerCredit: {
    fontSize: 13,
  },
  packRight: {
    alignItems: 'flex-end',
  },
  packPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  buyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Info Section
  infoToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  infoToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoToggleIcon: {
    fontSize: 14,
  },
  infoContent: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },

  // Usage Guide
  usageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  usageLabel: {
    fontSize: 15,
    flex: 1,
  },
  usageCost: {
    fontSize: 15,
    fontWeight: '600',
  },

  bottomSpacing: {
    height: 40,
  },
});

export default CreditPurchaseScreen;
