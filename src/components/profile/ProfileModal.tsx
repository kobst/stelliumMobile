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
} from 'react-native';
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

const ProfileModal: React.FC = () => {
  const { colors, theme, setTheme } = useTheme();
  const { userData, profileModalVisible, setProfileModalVisible, setUserData } = useStore();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
              <View style={[styles.subscriptionBadge, { backgroundColor: '#9CA3AF' }]}>
                <Text style={[styles.subscriptionText, { color: '#FFFFFF' }]}>
                  Free Plan
                </Text>
              </View>
            </View>
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
                  // TODO: Navigate to subscription management
                  Alert.alert('Coming Soon', 'Subscription management will be available in a future update.');
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
});

export default ProfileModal;
