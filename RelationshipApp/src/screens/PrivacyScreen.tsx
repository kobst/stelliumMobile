import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { deleteAccount } from '../api/profile';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { SettingsInfoCard } from '../components/SettingsInfoCard';
import { SectionLabel } from '../components/SectionLabel';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

const TERMS_URL = 'https://irisapp.com/terms';
const PRIVACY_POLICY_URL = 'https://irisapp.com/privacy';

export function PrivacyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<RootNavigation>();
  const resetSession = useRelationshipAppStore((state) => state.resetSession);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openLink = useCallback((url: string, fallbackLabel: string) => {
    return async () => {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert(fallbackLabel, `Unable to open ${url}.`);
      }
    };
  }, []);

  const dataRows = [
    {
      key: 'birth',
      icon: '📊',
      label: 'Birth details',
      subtitle: 'Used to calculate your natal chart. Never shared.',
      alignTop: true,
    },
    {
      key: 'relationships',
      icon: '♡',
      label: 'Relationship data',
      subtitle: 'Stored privately. Only you can see your connections.',
      alignTop: true,
    },
    {
      key: 'ask',
      icon: '✦',
      label: 'Ask Iris conversations',
      subtitle: 'Your conversation history is private and encrypted.',
      alignTop: true,
    },
    {
      key: 'purchases',
      icon: '◆',
      label: 'Purchase history',
      subtitle: 'Stored securely with your Iris account.',
      alignTop: true,
    },
  ];

  const legalRows = [
    {
      key: 'terms',
      label: 'Terms of Service',
      chevron: true,
      onPress: openLink(TERMS_URL, 'Terms of Service'),
    },
    {
      key: 'privacy',
      label: 'Privacy Policy',
      chevron: true,
      onPress: openLink(PRIVACY_POLICY_URL, 'Privacy Policy'),
    },
  ];

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      resetSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        'Account deletion failed',
        error instanceof Error ? error.message : 'Please try again shortly.'
      );
    }
  }, [navigation, resetSession]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Privacy" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Your Data</SectionLabel>
        <SettingsInfoCard rows={dataRows} />

        <SectionLabel style={styles.sectionSpacing}>Legal</SectionLabel>
        <SettingsInfoCard rows={legalRows} />

        <SectionLabel style={styles.sectionSpacing}>Danger Zone</SectionLabel>
        <View
          style={[
            styles.dangerCard,
            {
              backgroundColor: 'rgba(255, 180, 171, 0.08)',
              borderColor: 'rgba(255, 180, 171, 0.2)',
            },
          ]}
        >
          {!confirmDelete ? (
            <>
              <Text style={[styles.dangerTitle, { color: colors.error }]}>Delete Account</Text>
              <Text style={[styles.dangerBody, { color: colors.textSubtle }]}>
                Permanently removes your profile, all relationships, conversation history, and
                remaining credits. This cannot be undone.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setConfirmDelete(true)}
                style={[
                  styles.dangerButton,
                  {
                    borderColor: colors.error,
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                  Delete my account
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.dangerTitle, { color: colors.error }]}>Are you sure?</Text>
              <Text style={[styles.dangerBody, { color: colors.textSubtle }]}>
                All your data will be permanently deleted. Any remaining credits will be lost.
                Active subscriptions must be cancelled separately before deleting your account.
              </Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isDeleting}
                  onPress={() => setConfirmDelete(false)}
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: colors.surfaceHigh, opacity: isDeleting ? 0.5 : 1 },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isDeleting}
                  onPress={handleDelete}
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: colors.error, opacity: isDeleting ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: '#fff' }]}>
                    {isDeleting ? 'Deleting…' : 'Delete forever'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 10,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  dangerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dangerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
