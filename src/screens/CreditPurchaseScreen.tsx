/**
 * Credit Purchase Screen
 *
 * Custom screen for purchasing a-la-carte credit packs.
 * Shows current balance, available packs, and handles RevenueCat purchases.
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
import { revenueCatService } from '../services/RevenueCatService';
import { CREDIT_PACKS, CreditPack } from '../config/subscriptionConfig';

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
  const { total, monthly, pack, addCredits, refreshBalance } = useCreditBalance();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const recommendedPack = route.params?.recommendedPack || 'medium';
  const source = route.params?.source || 'manual';

  const handlePurchase = async (creditPack: CreditPack) => {
    console.log('[CreditPurchase] Starting purchase:', {
      packId: creditPack.id,
      credits: creditPack.credits,
      price: creditPack.price,
      productId: creditPack.revenueCatProductId,
      source,
    });

    setPurchasing(creditPack.id);

    try {
      // Purchase via RevenueCat
      const result = await revenueCatService.purchaseProduct(
        creditPack.revenueCatProductId
      );

      if (!result.success) {
        // Check if user cancelled
        if (result.error?.includes('cancelled')) {
          console.log('[CreditPurchase] User cancelled purchase');
          return;
        }

        // Show error message
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[CreditPurchase] Purchase successful:', {
        packId: creditPack.id,
        credits: creditPack.credits,
      });

      // Optimistically add credits to local state
      addCredits(creditPack.credits);

      // Refresh balance from backend to confirm
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

      // Show error message
      Alert.alert(
        'Purchase Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
        {/* Current Balance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Current Balance
          </Text>

          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                Total Credits
              </Text>
              <Text style={[styles.balanceValue, { color: colors.onSurface }]}>
                {total}
              </Text>
            </View>

            {(monthly > 0 || pack > 0) && (
              <View style={styles.balanceBreakdown}>
                {monthly > 0 && (
                  <Text style={[styles.breakdownText, { color: colors.onSurfaceVariant }]}>
                    {monthly} monthly
                  </Text>
                )}
                {monthly > 0 && pack > 0 && (
                  <Text style={[styles.breakdownText, { color: colors.onSurfaceVariant }]}>
                    {' + '}
                  </Text>
                )}
                {pack > 0 && (
                  <Text style={[styles.breakdownText, { color: colors.onSurfaceVariant }]}>
                    {pack} pack
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Credit Packs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Credit Packs
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
            Purchase credits that never expire
          </Text>

          {CREDIT_PACKS.map((creditPack) => {
            const isRecommended = creditPack.id === recommendedPack;
            const isPurchasing = purchasing === creditPack.id;
            const pricePerCredit = (creditPack.price / creditPack.credits).toFixed(2);

            return (
              <View key={creditPack.id} style={styles.packContainer}>
                {isRecommended && (
                  <View
                    style={[
                      styles.recommendedBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.recommendedText, { color: colors.onPrimary }]}>
                      RECOMMENDED
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.packCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isRecommended ? colors.primary : colors.border,
                      borderWidth: isRecommended ? 2 : 1,
                    },
                  ]}
                  onPress={() => handlePurchase(creditPack)}
                  disabled={isPurchasing}
                  activeOpacity={0.7}
                >
                  <View style={styles.packContent}>
                    {/* Left side - Credits */}
                    <View style={styles.packLeft}>
                      <Text style={[styles.packCredits, { color: colors.onSurface }]}>
                        {creditPack.credits} Credits
                      </Text>
                      <Text
                        style={[styles.packPricePerCredit, { color: colors.onSurfaceVariant }]}
                      >
                        ${pricePerCredit} per credit
                      </Text>
                    </View>

                    {/* Right side - Price & Button */}
                    <View style={styles.packRight}>
                      <Text style={[styles.packPrice, { color: colors.onSurface }]}>
                        {creditPack.priceDisplay}
                      </Text>

                      {isPurchasing ? (
                        <View
                          style={[
                            styles.purchaseButton,
                            styles.purchaseButtonLoading,
                            { backgroundColor: colors.surfaceVariant },
                          ]}
                        >
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.purchaseButton,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[styles.purchaseButtonText, { color: colors.onPrimary }]}
                          >
                            Buy
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

        {/* Info Section */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.infoTitle, { color: colors.onSurface }]}>
            💡 How Credits Work
          </Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            • Pack credits never expire
          </Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            • Monthly credits are used first, then pack credits
          </Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            • Credits are shared across all features
          </Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            • Need more? Upgrade to Premium or Pro for monthly credits
          </Text>
        </View>

        {/* Credit Costs Reference */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            What Can You Do?
          </Text>

          <View style={[styles.costCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.onSurface }]}>
                Quick Chart Overview
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>5 credits</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.onSurface }]}>
                Full Natal Report
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>15 credits</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.onSurface }]}>
                Relationship Overview
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>5 credits</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.onSurface }]}>
                Full Relationship Report
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>15 credits</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.onSurface }]}>
                Ask Stellium Question
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>1 credit</Text>
            </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },

  // Balance Card
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    marginTop: 8,
  },
  breakdownText: {
    fontSize: 13,
  },

  // Pack Cards
  packContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  packCard: {
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  purchaseButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  purchaseButtonLoading: {
    paddingVertical: 6,
  },
  purchaseButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Info Box
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },

  // Cost Reference
  costCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 15,
    flex: 1,
  },
  costValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  bottomSpacing: {
    height: 40,
  },
});

export default CreditPurchaseScreen;
