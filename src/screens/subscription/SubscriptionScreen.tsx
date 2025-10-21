import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { subscriptionsApi } from '../../api/subscriptions';
import { revenueCatService } from '../../services/RevenueCatService';
import { superwallService } from '../../services/SuperwallService';
import SubscriptionStatusCard from '../../components/subscription/SubscriptionStatusCard';
import UsageProgressBar from '../../components/subscription/UsageProgressBar';
import CancellationModal from '../../components/subscription/CancellationModal';
import { getPlanConfig } from '../../config/subscriptionConfig';

interface SubscriptionScreenProps {
  navigation: any;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    userData,
    userSubscription,
    usageMetrics,
    entitlements,
    updateSubscriptionData,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const fetchSubscriptionData = useCallback(async (showLoader: boolean = true) => {
    if (!userData?.id) return;

    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await subscriptionsApi.getSubscriptionStatus(userData.id);
      updateSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription data. Please try again.',
      );
    } finally {
      if (showLoader) setIsLoading(false);
      else setIsRefreshing(false);
    }
  }, [userData?.id, updateSubscriptionData]);

  useEffect(() => {
    fetchSubscriptionData(true);
  }, [fetchSubscriptionData]);

  const handleRestorePurchases = async () => {
    try {
      Alert.alert('Restoring Purchases', 'Please wait...');
      await revenueCatService.restorePurchases();

      // Refresh subscription data after restore
      await fetchSubscriptionData(false);

      Alert.alert(
        'Success',
        'Your purchases have been restored successfully.',
      );
    } catch (error: any) {
      console.error('Failed to restore purchases:', error);
      Alert.alert(
        'Restore Failed',
        error.message || 'Failed to restore purchases. Please try again.',
      );
    }
  };

  const handleExplorePlans = async () => {
    try {
      await superwallService.showUpgradePaywall('subscription_screen');
      // Refresh data after potential purchase
      await fetchSubscriptionData(false);
    } catch (error) {
      console.error('Failed to show paywall:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userData?.id || !userSubscription) return;

    if (userSubscription.tier === 'free') {
      Alert.alert('No Active Subscription', 'You are currently on the free plan.');
      return;
    }

    setShowCancellationModal(true);
  };

  const confirmCancellation = async () => {
    if (!userData?.id) return;

    try {
      const result = await subscriptionsApi.cancelSubscription(userData.id);

      // Update store with cancelled subscription
      updateSubscriptionData({
        subscription: result.subscription,
        usage: usageMetrics!,
        entitlements: entitlements!,
      });

      setShowCancellationModal(false);

      Alert.alert(
        'Subscription Cancelled',
        `Your subscription has been cancelled. You'll retain access until ${new Date(
          result.expiresAt
        ).toLocaleDateString()}.`,
      );
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      Alert.alert(
        'Cancellation Failed',
        error.message || 'Failed to cancel subscription. Please try again.',
      );
    }
  };

  const formatResetDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPlanPrice = (tier: 'free' | 'premium' | 'pro'): number => {
    const plan = getPlanConfig(tier);
    return plan?.price ?? 0;
  };

  if (isLoading || !userSubscription || !usageMetrics || !entitlements) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              ‹ Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Subscription
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading subscription...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = userSubscription.tier !== 'free' && userSubscription.status === 'active';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Subscription
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSubscriptionData(false)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Subscription Status */}
        <SubscriptionStatusCard
          tier={userSubscription.tier}
          status={userSubscription.status}
          renewsAt={userSubscription.renewsAt}
          expiresAt={userSubscription.expiresAt}
          cancelledAt={userSubscription.cancelledAt}
          priceMonthly={getPlanPrice(userSubscription.tier)}
        />

        {/* Usage Metrics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Usage This Period
          </Text>

          <UsageProgressBar
            label="Quick Charts"
            used={usageMetrics.quickChartsUsed}
            limit={entitlements.quickChartsLimit}
            icon="📊"
          />

          <UsageProgressBar
            label="Quick Matches"
            used={usageMetrics.quickMatchesUsed}
            limit={entitlements.quickMatchesLimit}
            icon="💝"
          />

          <UsageProgressBar
            label="Reports"
            used={usageMetrics.reportsUsed}
            limit={entitlements.reportsLimit}
            icon="📄"
          />

          <UsageProgressBar
            label="Chat Questions"
            used={usageMetrics.chatQuestionsUsed}
            limit={entitlements.chatQuestionsLimit}
            icon="💬"
          />

          <View style={[styles.resetInfo, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.resetText, { color: colors.onSurfaceVariant }]}>
              Usage resets on {formatResetDate(usageMetrics.nextResetDate)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleExplorePlans}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {userSubscription.tier === 'free' ? 'Upgrade Plan' : 'Explore Other Plans'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handleRestorePurchases}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.onSurface }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              style={[styles.dangerButton, { borderColor: colors.error }]}
              onPress={handleCancelSubscription}
            >
              <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                Cancel Subscription
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fine Print */}
        <View style={[styles.fineprint, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.fineprintText, { color: colors.onSurfaceVariant }]}>
            Subscriptions are managed through your App Store account. Charges occur at the end of
            each billing period unless cancelled at least 24 hours before renewal.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Cancellation Modal */}
      {userSubscription.tier !== 'free' && (
        <CancellationModal
          visible={showCancellationModal}
          tier={userSubscription.tier as 'premium' | 'pro'}
          expiresAt={userSubscription.renewsAt}
          onCancel={() => setShowCancellationModal(false)}
          onConfirm={confirmCancellation}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  resetInfo: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  dangerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  fineprint: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  fineprintText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SubscriptionScreen;
