import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { onboardingApi } from '../api';
import { relationshipAppEnv } from '../config/env';
import { createLocalRelationshipProfile } from '../mocks/demoData';

type Props = StackScreenProps<RelationshipRootParamList, 'SaveProfile'>;

export const SaveProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode) || relationshipAppEnv.enableLocalUxMode;
  const setProfile = useRelationshipAppStore((state) => state.setProfile);
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const clearOnboardingFlow = useRelationshipAppStore((state) => state.clearOnboardingFlow);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinueAsGuest = async () => {
    if (!guestProfileDraft || !profileReveal) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLocalUxMode) {
        const localProfile = createLocalRelationshipProfile({
          firstName: guestProfileDraft.firstName,
          lastName: guestProfileDraft.lastName,
          dateOfBirth: guestProfileDraft.dateOfBirth,
          placeOfBirth: guestProfileDraft.placeOfBirth,
          time: guestProfileDraft.birthTimeUnknown ? undefined : guestProfileDraft.timeOfBirth,
          birthTimeUnknown: guestProfileDraft.birthTimeUnknown,
        });

        setAuthState({
          authStatus: 'signedIn',
          firebaseUid: 'local-demo-user',
          firebaseEmail: null,
        });
        setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
        setProfile(localProfile);
        clearOnboardingFlow();
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        return;
      }

      // Sign in anonymously, then claim the preview
      const userCredential = await auth().signInAnonymously();
      const firebaseUid = userCredential.user.uid;

      setAuthState({
        authStatus: 'signedIn',
        firebaseUid,
        firebaseEmail: null,
      });
      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });

      const claimResponse = await onboardingApi.claimPreview({
        previewId: profileReveal.previewId,
        claimToken: profileReveal.claimToken,
      });

      setProfile({
        id: claimResponse.userId,
        appDomain: 'relationship-app',
        firebaseUid,
        firstName: claimResponse.user.firstName,
        lastName: claimResponse.user.lastName,
        displayName: `${claimResponse.user.firstName} ${claimResponse.user.lastName}`.trim(),
        dateOfBirth: guestProfileDraft.dateOfBirth,
        placeOfBirth: guestProfileDraft.placeOfBirth,
        time: guestProfileDraft.birthTimeUnknown ? undefined : guestProfileDraft.timeOfBirth,
        birthTimeUnknown: guestProfileDraft.birthTimeUnknown,
        totalOffsetHours: guestProfileDraft.totalOffsetHours ?? 0,
        subject: claimResponse.user as any,
        backendAppDomain: claimResponse.user.appDomain,
        isDomainExplicit: true,
        romanticOverview: claimResponse.overview,
      });

      clearOnboardingFlow();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not continue as guest.';
      Alert.alert('Something went wrong', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Save your profile</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Create an account to keep your profile and unlock full analysis.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Your birth data and romantic profile will transfer to your new account.
          You can also continue as a guest, but your data may not be saved.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateAccount')}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleContinueAsGuest}
          disabled={isSubmitting}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            {isSubmitting ? 'Setting up...' : 'Continue as Guest'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    gap: 16,
    paddingTop: 32,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
    paddingBottom: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
