import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import ThemeToggle from '../ThemeToggle';
import { forceSignOut } from '../../utils/authHelpers';
import ProfileAvatar from './ProfileAvatar';

const ProfileModal: React.FC = () => {
  const { colors } = useTheme();
  const { userData, profileModalVisible, setProfileModalVisible } = useStore();

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

  const MenuItem: React.FC<{ 
    icon: string; 
    title: string; 
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }> = ({ icon, title, subtitle, onPress, rightComponent, showChevron = true }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
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
          <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
            <ProfileAvatar size={80} showOnlineIndicator={false} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.onSurface }]}>
                {userData?.name || 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.onSurfaceVariant }]}>
                {userData?.email || 'No email'}
              </Text>
              <View style={[styles.subscriptionBadge, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.subscriptionText, { color: colors.onPrimaryContainer }]}>
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
                icon="👤"
                title="Account Settings"
                subtitle="Manage your account details"
                onPress={() => {
                  // TODO: Navigate to account settings
                  Alert.alert('Coming Soon', 'Account settings will be available in a future update.');
                }}
              />
              <MenuItem
                icon="💎"
                title="Subscription"
                subtitle="Free Plan"
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
                icon="🎨"
                title="Theme"
                subtitle="System"
                rightComponent={<ThemeToggle />}
                showChevron={false}
              />
              <MenuItem
                icon="🔔"
                title="Notifications"
                subtitle="Manage your notifications"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
                }}
              />
              <MenuItem
                icon="🔒"
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
                icon="❓"
                title="Help Center"
                subtitle="Get answers to common questions"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Help center will be available in a future update.');
                }}
              />
              <MenuItem
                icon="💬"
                title="Contact Support"
                subtitle="Get help from our team"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Contact support will be available in a future update.');
                }}
              />
              <MenuItem
                icon="ℹ️"
                title="About Stellium"
                subtitle="AI-powered astrology guidance"
                onPress={() => {
                  Alert.alert(
                    'About Stellium',
                    'Stellium is an AI-powered astrology guidance app that provides personalized insights based on your birth chart and astrological data.',
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
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
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
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
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