import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Purchases, { PurchasesStoreProduct } from 'react-native-purchases';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { forceSignOut } from '../../utils/authHelpers';
import ProfileAvatar from './ProfileAvatar';
import { LoadingOverlay } from '../LoadingOverlay';
import {
  showImagePickerActionSheet,
  uploadProfilePhotoPresigned,
  ImageResult,
} from '../../utils/imageHelpers';
import { usersApi } from '../../api/users';
import { navigate } from '../../navigation/navigationService';
import { CREDIT_PACKS } from '../../config/subscriptionConfig';
import { CreditBalanceDisplay } from '../CreditBalanceDisplay';
import { useEffectiveSubscription } from '../../hooks/useEffectiveSubscription';

const ProfileModal: React.FC = () => {
  const { colors, theme, setTheme } = useTheme();
  const { userData, profileModalVisible, setProfileModalVisible, setUserData } = useStore();
  const userSubscription = useEffectiveSubscription();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [creditPackProducts, setCreditPackProducts] = useState<PurchasesStoreProduct[]>([]);
  const [loadingCreditPacks, setLoadingCreditPacks] = useState(false);

  const getSubscriptionBadge = () => {
    const tier = userSubscription?.tier || 'free';
    switch (tier) {
      case 'free':
        return { label: 'Free Plan', color: '#9CA3AF' };
      case 'premium':
        return { label: 'Premium Plan', color: '#8b5cf6' };
      case 'pro':
        return { label: 'Pro Plan', color: '#6366f1' };
      default:
        return { label: 'Free Plan', color: '#9CA3AF' };
    }
  };

  const subscriptionBadge = getSubscriptionBadge();

  const handleProfilePhotoPress = () => {
    if (!userData?.id) {
      Alert.alert('Error', 'User data not available');
      return;
    }

    showImagePickerActionSheet(
      (imageResult: ImageResult) => handleImageSelected(imageResult),
      {
        includeCamera: true,
        includeRemove: !!userData.profilePhotoUrl,
        onRemove: () => handleRemovePhoto(),
      }
    );
  };

  const handleImageSelected = async (imageResult: ImageResult) => {
    if (!userData?.id) return;

    setIsUploadingPhoto(true);

    try {
      console.log('ProfileModal - Starting upload for user:', userData.id);
      const result = await uploadProfilePhotoPresigned(
        userData.id,
        imageResult.uri,
        imageResult.type
      );

      console.log('ProfileModal - Upload result:', result);

      // Update user data in store with new photo URL
      const updatedUserData = {
        ...userData,
        profilePhotoUrl: result.profilePhotoUrl,
        profilePhotoKey: result.profilePhotoKey,
        profilePhotoUpdatedAt: new Date().toISOString(),
      };

      console.log('ProfileModal - Updating user data in store:', updatedUserData);
      setUserData(updatedUserData);

      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error: any) {
      console.error('Failed to upload profile photo:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!userData?.id) return;

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);

            try {
              await usersApi.deleteProfilePhoto(userData.id);

              // Update user data in store to remove photo
              const updatedUserData = {
                ...userData,
                profilePhotoUrl: undefined,
                profilePhotoKey: undefined,
                profilePhotoUpdatedAt: undefined,
              };

              setUserData(updatedUserData);

              Alert.alert('Success', 'Profile photo removed successfully');
            } catch (error: any) {
              console.error('Failed to remove profile photo:', error);
              Alert.alert('Remove Failed', error.message || 'Failed to remove profile photo');
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
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
              setProfileModalVisible(false);
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

  const handleCloseModal = () => {
    setProfileModalVisible(false);
  };

  const handleContactSupport = async () => {
    const email = 'admin@stellium.ai';
    const subject = 'Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email client. Please email admin@stellium.ai directly.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please email admin@stellium.ai directly.');
    }
  };

  const handleHelpCenter = async () => {
    const url = 'https://stellium.ai/help';

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open help center. Please visit stellium.ai/help in your browser.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open help center. Please visit stellium.ai/help in your browser.');
    }
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme:',
      [
        {
          text: 'System',
          onPress: () => setTheme('system'),
        },
        {
          text: 'Light',
          onPress: () => setTheme('light'),
        },
        {
          text: 'Dark',
          onPress: () => setTheme('dark'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getThemeDisplayName = () => {
    switch (theme) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  const loadCreditPackProducts = async () => {
    try {
      setLoadingCreditPacks(true);
      console.log('[ProfileModal] Loading credit pack products...');

      const products = await Purchases.getProducts(
        CREDIT_PACKS.map(pack => pack.revenueCatProductId)
      );

      console.log('[ProfileModal] Found credit pack products:', products.length);
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
      console.error('[ProfileModal] Failed to load credit packs:', error);
      Alert.alert('Error', 'Failed to load credit pack products. Check console.');
    } finally {
      setLoadingCreditPacks(false);
    }
  };

  const handlePurchaseCreditPack = async (product: PurchasesStoreProduct) => {
    try {
      console.log('[ProfileModal] Purchasing credit pack:', product.identifier);

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

                console.log('[ProfileModal] Purchase successful!');
                console.log('[ProfileModal] Customer info:', customerInfo);

                Alert.alert(
                  'Purchase Successful! 🎉',
                  `Test purchase of ${product.title} completed.\n\n` +
                  `In production, this would:\n` +
                  `1. Trigger RevenueCat webhook\n` +
                  `2. Backend would add credits\n` +
                  `3. User would see updated balance`
                );
              } catch (purchaseError: any) {
                console.error('[ProfileModal] Purchase failed:', purchaseError);

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
      console.error('[ProfileModal] Purchase error:', error);
    }
  };

  const MenuItem: React.FC<{
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }> = ({ title, subtitle, onPress, rightComponent, showChevron = true }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.onSurface }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.menuItemSubtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightComponent}
        {showChevron && onPress && (
          <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: colors.onSurfaceVariant }]}>
      {title}
    </Text>
  );

  return (
    <Modal
      visible={profileModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseModal}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Profile</Text>
          <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.onSurfaceVariant }]}>Close ✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
            <ProfileAvatar
              size={80}
              showOnlineIndicator={false}
              onPress={handleProfilePhotoPress}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.onSurface }]}>
                {userData?.name || 'User'}
              </Text>
              <View style={[styles.subscriptionBadge, { backgroundColor: subscriptionBadge.color }]}>
                <Text style={[styles.subscriptionText, { color: '#FFFFFF' }]}>
                  {subscriptionBadge.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Credit Balance */}
          <View style={styles.creditBalanceSection}>
            <CreditBalanceDisplay
              variant="card"
              onPress={() => {
                navigate('Subscription');
                // Close modal after navigation to allow screen to display
                setTimeout(() => setProfileModalVisible(false), 50);
              }}
            />
          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <SectionHeader title="ACCOUNT" />
            <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
              <MenuItem
                title="Account Settings"
                subtitle="Manage your account details"
                onPress={() => {
                  // TODO: Navigate to account settings
                  Alert.alert('Coming Soon', 'Account settings will be available in a future update.');
                }}
              />
              <MenuItem
                title="Subscription and Purchases"
                subtitle="Manage plans and perks"
                onPress={() => {
                  navigate('Subscription');
                  // Close modal after navigation to allow screen to display
                  setTimeout(() => setProfileModalVisible(false), 50);
                }}
              />
            </View>
          </View>

          {/* Settings & Preferences */}
          <View style={styles.section}>
            <SectionHeader title="SETTINGS & PREFERENCES" />
            <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
              <MenuItem
                title="Theme"
                subtitle={getThemeDisplayName()}
                onPress={handleThemeChange}
              />
              <MenuItem
                title="Notifications"
                subtitle="Manage your notifications"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
                }}
              />
              <MenuItem
                title="Privacy"
                subtitle="Control your privacy settings"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
                }}
              />
            </View>
          </View>

          {/* Help & Support */}
          <View style={styles.section}>
            <SectionHeader title="HELP & SUPPORT" />
            <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
              <MenuItem
                title="Help Center"
                subtitle="Get answers to common questions"
                onPress={handleHelpCenter}
              />
              <MenuItem
                title="Contact Support"
                subtitle="Get help from our team"
                onPress={handleContactSupport}
              />
              <MenuItem
                title="About Stellium"
                subtitle="Version 1.0.0"
                onPress={() => {
                  Alert.alert(
                    'About Stellium',
                    'Stellium is an AI-powered astrology guidance app that provides personalized insights based on your birth chart and astrological data.\n\nVersion 1.0.0',
                    [{ text: 'OK' }]
                  );
                }}
              />
            </View>
          </View>

          {/* Credit Pack Testing (Development only) */}
          {__DEV__ && (
            <View style={styles.section}>
              <SectionHeader title="🧪 CREDIT PACK TESTING" />

              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: '#10b981' }]}
                onPress={loadCreditPackProducts}
                disabled={loadingCreditPacks}
              >
                {loadingCreditPacks ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.testButtonText}>Load Credit Pack Products</Text>
                )}
              </TouchableOpacity>

              {creditPackProducts.length > 0 && (
                <View style={[styles.menuGroup, { backgroundColor: colors.surface, marginTop: 12 }]}>
                  <Text style={[styles.productsSectionTitle, { color: colors.onSurfaceVariant, padding: 12, paddingBottom: 0 }]}>
                    Available Products ({creditPackProducts.length}):
                  </Text>
                  {creditPackProducts.map((product, index) => {
                    const packInfo = CREDIT_PACKS.find(p => p.revenueCatProductId === product.identifier);
                    const isLast = index === creditPackProducts.length - 1;
                    return (
                      <View
                        key={product.identifier}
                        style={[
                          styles.productItem,
                          { borderBottomColor: colors.border },
                          isLast && { borderBottomWidth: 0 }
                        ]}
                      >
                        <View style={styles.productInfo}>
                          <Text style={[styles.productTitle, { color: colors.onSurface }]}>
                            {product.title}
                          </Text>
                          <Text style={[styles.productDescription, { color: colors.onSurfaceVariant }]}>
                            {packInfo?.credits || '?'} credits • {product.priceString}
                          </Text>
                          <Text style={[styles.productId, { color: colors.onSurfaceVariant }]}>
                            {product.identifier}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.buyButton, { backgroundColor: colors.primary }]}
                          onPress={() => handlePurchaseCreditPack(product)}
                        >
                          <Text style={[styles.buyButtonText, { color: '#ffffff' }]}>
                            Test Buy
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {!loadingCreditPacks && creditPackProducts.length === 0 && (
                <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant, marginTop: 12 }]}>
                  <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                    Tap "Load Credit Pack Products" to verify StoreKit configuration.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: colors.error }]}
              onPress={handleSignOut}
            >
              <Text style={[styles.signOutButtonText, { color: colors.onError }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <LoadingOverlay visible={isUploadingPhoto} message="Updating photo..." />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButton: {
    paddingVertical: 4,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60, // Balance the close button
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creditBalanceSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGroup: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  signOutButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
  testButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  productsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ProfileModal;
