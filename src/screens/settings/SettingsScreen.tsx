import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import ThemeToggle from '../../components/ThemeToggle';
import { useStore } from '../../store';
import { debugAuthState, forceSignOut, checkForCachedAuthData } from '../../utils/authHelpers';
import { superwallService } from '../../services/SuperwallService';

const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { userData } = useStore();

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
