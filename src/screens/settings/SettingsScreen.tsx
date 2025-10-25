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
import Purchases, { PurchasesStoreProduct } from 'react-native-purchases';
import { useTheme } from '../../theme';
import ThemeToggle from '../../components/ThemeToggle';
import { useStore } from '../../store';
import { debugAuthState, forceSignOut, checkForCachedAuthData } from '../../utils/authHelpers';
import { superwallService } from '../../services/SuperwallService';
import { revenueCatService } from '../../services/RevenueCatService';
import { SubscriptionTier } from '../../types';
import { CustomerInfo } from 'react-native-purchases';
import { CREDIT_PACKS } from '../../config/subscriptionConfig';

const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { userData } = useStore();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [creditPackProducts, setCreditPackProducts] = useState<PurchasesStoreProduct[]>([]);
  const [loadingCreditPacks, setLoadingCreditPacks] = useState(false);

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

  const loadCreditPackProducts = async () => {
    try {
      setLoadingCreditPacks(true);
      console.log('[Settings] Loading credit pack products...');

      // Get all available products
      const products = await Purchases.getProducts(
        CREDIT_PACKS.map(pack => pack.revenueCatProductId)
      );

      console.log('[Settings] Found credit pack products:', products.length);
      products.forEach(product => {
        console.log(`  - ${product.identifier}: ${product.priceString}`);
      });

      setCreditPackProducts(products);

      if (products.length === 0) {
        Alert.alert(
          'No Products Found',
          'Could not load credit pack products. Make sure StoreKit Configuration is active.'
        );
      }
    } catch (error) {
      console.error('[Settings] Failed to load credit packs:', error);
      Alert.alert('Error', 'Failed to load credit pack products. Check console.');
    } finally {
      setLoadingCreditPacks(false);
    }
  };

  const handlePurchaseCreditPack = async (product: PurchasesStoreProduct) => {
    try {
      console.log('[Settings] Purchasing credit pack:', product.identifier);

      Alert.alert(
        'Test Purchase',
        `Attempting to purchase ${product.title} for ${product.priceString}. This is a test - no real money will be charged.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                const { customerInfo } = await Purchases.purchaseStoreProduct(product);

                console.log('[Settings] Purchase successful!');
                console.log('[Settings] Customer info:', customerInfo);

                Alert.alert(
                  'Purchase Successful! 🎉',
                  `Test purchase of ${product.title} completed.\n\n` +
                  `In production, this would:\n` +
                  `1. Trigger RevenueCat webhook\n` +
                  `2. Backend would add credits\n` +
                  `3. User would see updated balance`
                );
              } catch (purchaseError: any) {
                console.error('[Settings] Purchase failed:', purchaseError);

                if (purchaseError.userCancelled) {
                  Alert.alert('Cancelled', 'Purchase was cancelled.');
                } else {
                  Alert.alert(
                    'Purchase Failed',
                    purchaseError.message || 'Unknown error occurred'
                  );
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Settings] Purchase error:', error);
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

        {/* Credit Pack Testing (Development only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              🧪 Credit Pack Testing
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10b981', marginBottom: 12 }]}
              onPress={loadCreditPackProducts}
              disabled={loadingCreditPacks}
            >
              {loadingCreditPacks ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                  Load Credit Pack Products
                </Text>
              )}
            </TouchableOpacity>

            {creditPackProducts.length > 0 && (
              <View>
                <Text style={[styles.subsectionTitle, { color: colors.onSurfaceVariant }]}>
                  Available Products ({creditPackProducts.length}):
                </Text>
                {creditPackProducts.map((product) => {
                  const packInfo = CREDIT_PACKS.find(p => p.revenueCatProductId === product.identifier);
                  return (
                    <View
                      key={product.identifier}
                      style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.productInfo}>
                        <Text style={[styles.productTitle, { color: colors.onSurface }]}>
                          {product.title}
                        </Text>
                        <Text style={[styles.productDescription, { color: colors.onSurfaceVariant }]}>
                          {packInfo?.credits || '?'} credits • {product.priceString}
                        </Text>
                        <Text style={[styles.productId, { color: colors.onSurfaceVariant }]}>
                          ID: {product.identifier}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: colors.primary }]}
                        onPress={() => handlePurchaseCreditPack(product)}
                      >
                        <Text style={[styles.buyButtonText, { color: colors.onPrimary }]}>
                          Test Buy
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {!loadingCreditPacks && creditPackProducts.length === 0 && (
              <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                  Tap "Load Credit Pack Products" to verify StoreKit configuration.
                </Text>
              </View>
            )}
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  productId: {
    fontSize: 11,
    fontFamily: 'Courier',
  },
  buyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SettingsScreen;
