import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTheme } from '../../theme';
import ThemeToggle from '../../components/ThemeToggle';
import { useStore } from '../../store';
import { debugAuthState, forceSignOut, checkForCachedAuthData } from '../../utils/authHelpers';
import { superwallService } from '../../services/SuperwallService';
import { revenueCatService } from '../../services/RevenueCatService';
import { SubscriptionTier } from '../../types';
import { CustomerInfo } from 'react-native-purchases';

const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { userData } = useStore();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Load subscription info on mount
  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setLoadingSubscription(true);
      // Try to get from RevenueCat (works without backend)
      const tier = await revenueCatService.getActiveTier();
      const info = await revenueCatService.getCustomerInfo();
      setSubscriptionTier(tier);
      setCustomerInfo(info);
      console.log('[Settings] Loaded subscription from RevenueCat:', { tier, hasInfo: !!info });
    } catch (error) {
      console.error('[Settings] Failed to load subscription info:', error);
      // Fallback to free tier if RevenueCat fails
      setSubscriptionTier('free');
      setCustomerInfo(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      console.log('[Settings] Opening upgrade paywall...');
      await superwallService.showUpgradePaywall('settings_upgrade');
      // Refresh subscription info after paywall closes
      await loadSubscriptionInfo();
    } catch (error) {
      console.error('[Settings] Failed to show upgrade paywall:', error);
      Alert.alert('Error', 'Failed to open upgrade options. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      console.log('[Settings] Restoring purchases...');
      Alert.alert(
        'Restore Purchases',
        'Restoring your previous purchases...',
        [],
        { cancelable: false }
      );

      const result = await revenueCatService.restorePurchases();

      if (result.success) {
        await loadSubscriptionInfo();

        const hasActiveSubscription = result.customerInfo?.entitlements.active
          && Object.keys(result.customerInfo.entitlements.active).length > 0;

        if (hasActiveSubscription) {
          Alert.alert('Success', 'Your purchases have been restored!');
        } else {
          Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to restore purchases. Please try again.');
      }
    } catch (error) {
      console.error('[Settings] Failed to restore purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Open iOS subscription management in App Store
      const url = 'https://apps.apple.com/account/subscriptions';
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open subscription management.');
      }
    } catch (error) {
      console.error('[Settings] Failed to open subscription management:', error);
      Alert.alert('Error', 'Failed to open subscription management.');
    }
  };

  const getSubscriptionDisplayInfo = () => {
    if (subscriptionTier === 'free') {
      return {
        title: 'Free Plan',
        subtitle: 'Limited access to features',
        color: colors.onSurfaceVariant,
      };
    }

    const entitlements = customerInfo?.entitlements.active;
    if (!entitlements || Object.keys(entitlements).length === 0) {
      return {
        title: 'Free Plan',
        subtitle: 'Limited access to features',
        color: colors.onSurfaceVariant,
      };
    }

    const entitlementId = Object.keys(entitlements)[0];
    const entitlement = entitlements[entitlementId];
    const expirationDate = entitlement.expirationDate;

    const tierName = subscriptionTier === 'premium' ? 'Premium' : 'Pro';
    let subtitle = 'Active subscription';

    if (expirationDate) {
      const expDate = new Date(expirationDate);
      subtitle = `Renews ${expDate.toLocaleDateString()}`;
    }

    return {
      title: `${tierName} Plan`,
      subtitle,
      color: '#8b5cf6', // Purple color for premium/pro
    };
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await forceSignOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDebugAuth = async () => {
    await debugAuthState();
  };

  const handleCheckCachedData = async () => {
    await checkForCachedAuthData();
  };

  const handleTestPaywall = async () => {
    try {
      console.log('[Settings] Testing paywall...');
      await superwallService.showUpgradePaywall('settings_test');
    } catch (error) {
      console.error('[Settings] Failed to show paywall:', error);
      Alert.alert('Error', 'Failed to show paywall. Check console for details.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Settings
          </Text>
        </View>

        {/* User Info Section */}
        {userData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Account
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {userData.name}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.onSurfaceVariant }]}>
                {userData.email}
              </Text>
            </View>
          </View>
        )}

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Subscription
          </Text>

          {loadingSubscription ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: getSubscriptionDisplayInfo().color }]}>
                  {getSubscriptionDisplayInfo().title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.onSurfaceVariant }]}>
                  {getSubscriptionDisplayInfo().subtitle}
                </Text>
              </View>

              {subscriptionTier === 'free' ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8b5cf6', marginTop: 8 }]}
                  onPress={handleUpgrade}
                >
                  <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                    Upgrade to Premium
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 8 }]}
                  onPress={handleManageSubscription}
                >
                  <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
                    Manage Subscription
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary, marginTop: 8 }]}
                onPress={handleRestorePurchases}
              >
                <Text style={[styles.actionButtonText, { color: colors.onSecondary }]}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Appearance
          </Text>
          <ThemeToggle />
        </View>

        {/* Account Actions */}
        {userData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Account Actions
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug Section (Development only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Debug Tools
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
              onPress={handleTestPaywall}
            >
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                🎯 Test Paywall / Purchase
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={handleDebugAuth}
            >
              <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
                Debug Auth State
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary, marginTop: 8 }]}
              onPress={handleCheckCachedData}
            >
              <Text style={[styles.actionButtonText, { color: colors.onSecondary }]}>
                Check Cached Data
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            About
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Stellium
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.onSurfaceVariant }]}>
              AI-powered astrology guidance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  actionButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
