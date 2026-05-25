import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { getBigThree } from '../utils/mainShell';
import { CreditPill } from '../components/CreditPill';
import { Stardust } from '../components/atmosphere/Stardust';
import { Halo } from '../components/atmosphere/Halo';
import { IdentityBlock } from '../components/IdentityBlock';
import { RomanticSummaryCard } from '../components/RomanticSummaryCard';
import { AskIrisCard } from '../components/AskIrisCard';
import { CreditsMembershipCard } from '../components/CreditsMembershipCard';
import { SettingsList, type SettingsRowConfig } from '../components/SettingsList';
import { PurchaseCreditsSheet } from '../components/PurchaseCreditsSheet';
import { SignOutSheet } from '../components/SignOutSheet';
import { DevSessionPanel } from '../components/DevSessionPanel';
import { getEntitlements } from '../api/credits';
import {
  purchaseIrisCreditPack,
  restoreIrisPurchases,
} from '../services/irisRevenueCatService';

const PROFILE_THREAD_KEY = 'profile' as const;

const ASK_COPY = {
  title: 'Questions about your chart',
  subtitle: 'Personal insights grounded in your placements',
  inputPlaceholder: 'Ask anything about your romantic profile…',
  suggestions: [
    'Why do I attract distant partners?',
    'What does my Venus in Libra want?',
    'Am I more passionate or romantic?',
  ],
} as const;

const APP_VERSION = 'Iris v0.1 (dev)';

export function ProfileSettingsScreen() {
  const navigation = useNavigation<StackNavigationProp<RelationshipRootParamList>>();
  const { colors } = useTheme();

  const profile = useRelationshipAppStore((state) => state.profile);
  const overview = useRelationshipAppStore((state) => state.selfProfileOverview);
  const credits = useRelationshipAppStore((state) => state.credits);
  const subscription = useRelationshipAppStore((state) => state.subscription);
  const askThreads = useRelationshipAppStore((state) => state.askThreads);
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const setSubscription = useRelationshipAppStore((state) => state.setSubscription);
  const resetSession = useRelationshipAppStore((state) => state.resetSession);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const profileId = profile?.id ?? null;

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    async function bootstrap() {
      try {
        const { credits: nextCredits, subscription: nextSubscription } =
          await getEntitlements(profileId!);
        if (!active) {
          return;
        }
        setCredits(nextCredits);
        setSubscription(nextSubscription);
      } catch (error) {
        if (__DEV__) {
          console.warn('Credits bootstrap failed', error);
        }
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, [profileId, setCredits, setSubscription]);

  const placements = useMemo(() => getBigThree(profile), [profile]);
  const displayName = profile?.displayName ?? 'Your profile';

  const summaryText =
    overview ??
    profile?.romanticOverview ??
    profile?.romanticProfileBlurb ??
    'Your romantic reading will appear here once your chart has finished processing.';

  const thread = useMemo(
    () => askThreads[PROFILE_THREAD_KEY] ?? [],
    [askThreads]
  );
  const lastUser = useMemo(
    () => [...thread].reverse().find((message) => message.role === 'user') ?? null,
    [thread]
  );
  const lastIris = useMemo(
    () => [...thread].reverse().find((message) => message.role === 'iris') ?? null,
    [thread]
  );

  const openAsk = useCallback(
    (prefill?: string) => {
      navigation.navigate('AskIris', {
        context: 'profile',
        threadKey: PROFILE_THREAD_KEY,
        prefill,
      });
    },
    [navigation]
  );

  const handleBuyCredits = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleSelectPackage = useCallback(
    async (pkg: { id: string }) => {
      setSheetVisible(false);
      if (!profileId) {
        Alert.alert('Sign in required', 'Sign in before purchasing credits.');
        return;
      }
      try {
        const next = await purchaseIrisCreditPack(profileId, pkg.id);
        setCredits(next.credits);
        setSubscription(next.subscription);
      } catch (error) {
        Alert.alert(
          'Purchase failed',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      }
    },
    [profileId, setCredits, setSubscription]
  );

  const handleRestore = useCallback(async () => {
    if (!profileId) {
      Alert.alert('Sign in required', 'Sign in before restoring purchases.');
      return;
    }
    if (isRestoring) {
      return;
    }
    setIsRestoring(true);
    try {
      const next = await restoreIrisPurchases(profileId);
      setCredits(next.credits);
      setSubscription(next.subscription);
      Alert.alert('Purchases restored', 'Your purchases have been restored to this device.');
    } catch (error) {
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Please try again shortly.'
      );
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, profileId, setCredits, setSubscription]);

  const settingsRows = useMemo<readonly SettingsRowConfig[]>(
    () => [
      {
        key: 'birth-details',
        icon: '👤',
        label: 'Edit birth details',
        onPress: () => navigation.navigate('EditBirthDetails'),
      },
      {
        key: 'credit-history',
        icon: '◆',
        label: 'Credit history',
        onPress: () => navigation.navigate('CreditHistory'),
      },
      {
        key: 'manage-subscription',
        icon: '✦',
        label: 'Manage subscription',
        onPress: () => navigation.navigate('ManageSubscription'),
      },
      {
        key: 'notifications',
        icon: '🔔',
        label: 'Notifications',
        onPress: () => navigation.navigate('Notifications'),
      },
      {
        key: 'privacy',
        icon: '🔒',
        label: 'Privacy',
        onPress: () => navigation.navigate('Privacy'),
      },
      {
        key: 'help',
        icon: '?',
        label: 'Help & support',
        onPress: () => navigation.navigate('HelpSupport'),
      },
      {
        key: 'restore',
        icon: '↻',
        label: isRestoring ? 'Restoring…' : 'Restore purchases',
        onPress: handleRestore,
      },
      {
        key: 'sign-out',
        icon: '→',
        label: 'Sign out',
        destructive: true,
        onPress: () => setSignOutVisible(true),
      },
    ],
    [handleRestore, isRestoring, navigation]
  );

  const handleConfirmSignOut = useCallback(() => {
    setSignOutVisible(false);
    resetSession();
  }, [resetSession]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stardust density={60} seed={8} color={colors.primary} />
      </View>
      <Halo color={colors.primary} size={460} opacity={0.12} top={60} left="50%" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Iris</Text>
          <CreditPill balance={credits?.balance ?? null} onPress={handleBuyCredits} />
        </View>

        <IdentityBlock
          name={displayName}
          sun={placements.sun}
          moon={placements.moon}
          rising={placements.rising}
        />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>Your Romantic Profile</Text>
        <RomanticSummaryCard
          summary={summaryText}
          onPressFullReading={() => navigation.navigate('RomanticProfileFull')}
        />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>Ask Iris About You</Text>
        <AskIrisCard
          copy={ASK_COPY}
          lastUserMessage={lastUser}
          lastIrisMessage={lastIris}
          onPressInput={openAsk}
          onPressContinue={() => openAsk()}
        />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>Credits & Membership</Text>
        <CreditsMembershipCard
          credits={credits}
          subscription={subscription}
          onBuyCredits={handleBuyCredits}
        />

        <SettingsList rows={settingsRows} />

        <Text style={[styles.version, { color: colors.textSubtle }]}>{APP_VERSION}</Text>

        <DevSessionPanel />
      </ScrollView>

      <PurchaseCreditsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelectPackage={handleSelectPackage}
      />

      <SignOutSheet
        visible={signOutVisible}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={handleConfirmSignOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 26,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: -4,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
