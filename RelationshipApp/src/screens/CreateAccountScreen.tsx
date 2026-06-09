import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { onboardingApi } from '../api';
import { GOOGLE_WEB_CLIENT_ID, IOS_GOOGLE_CLIENT_ID } from '../../../src/config/firebase';

let GoogleSignin: ReturnType<typeof require> | null = null;
try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
} catch {
  // Google Sign-In not available
}

let appleAuth: ReturnType<typeof require> | null = null;
if (Platform.OS === 'ios') {
  try {
    appleAuth = require('@invertase/react-native-apple-authentication').appleAuth;
  } catch {
    // Apple Auth not available
  }
}

type Props = StackScreenProps<RelationshipRootParamList, 'CreateAccount'>;

export const CreateAccountScreen: React.FC<Props> = ({ navigation }) => {
  const firebaseAuth = getAuth();
  const { colors } = useTheme();
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const setProfile = useRelationshipAppStore((state) => state.setProfile);
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const clearOnboardingFlow = useRelationshipAppStore((state) => state.clearOnboardingFlow);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (GoogleSignin?.configure) {
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          iosClientId: IOS_GOOGLE_CLIENT_ID,
        });
      }
    } catch {
      // Configuration failed silently
    }
  }, []);

  const resetPartialAuthState = async () => {
    try {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
    } catch {
      // Best-effort cleanup only.
    }

    setAuthState({
      authStatus: 'signedOut',
      firebaseUid: null,
      firebaseEmail: null,
    });
    setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
  };

  const getDisplayErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
      const message = (error as { message: string }).message.trim();
      if (message.length > 0) {
        return message;
      }
    }

    return fallback;
  };

  const finalizeAuth = async (firebaseUid: string, firebaseEmail: string | null) => {
    if (!profileReveal || !guestProfileDraft) {
      throw new Error('No profile data found. Please restart onboarding.');
    }

    setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });

    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication session was not ready. Please try again.');
    }

    await currentUser.getIdToken(true);

    try {
      const claimResponse = await onboardingApi.claimPreview({
        previewId: profileReveal.previewId,
        claimToken: profileReveal.claimToken,
      });

      setAuthState({
        authStatus: 'signedIn',
        firebaseUid,
        firebaseEmail,
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
        romanticProfileBlurb: claimResponse.romanticProfileBlurb,
        referencedCodes: claimResponse.referencedCodes ?? [],
        celebAspectBank: claimResponse.celebAspectBank ?? null,
        topAspects: claimResponse.topAspects ?? [],
        topCelebMatches: claimResponse.topCelebMatches ?? [],
      });

      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
      clearOnboardingFlow();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      await resetPartialAuthState();
      throw error;
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await finalizeAuth(userCredential.user.uid, userCredential.user.email);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let message = 'Sign-up failed. Please try again.';

      if (firebaseError.code === 'auth/email-already-in-use') {
        message = 'An account already exists with this email. Try signing in instead.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (firebaseError.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger password.';
      }

      Alert.alert('Sign-Up Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      Alert.alert('Error', 'Google Sign-In is not available.');
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
        const userCredential = await signInWithCredential(firebaseAuth, googleCredential);
        await finalizeAuth(userCredential.user.uid, userCredential.user.email);
      }
    } catch (error: unknown) {
      const googleError = error as { code?: string };
      if (googleError.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Error', getDisplayErrorMessage(error, 'Google Sign-In failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios' || !appleAuth) {
      Alert.alert('Error', 'Apple Sign-In is only available on iOS.');
      return;
    }

    setIsLoading(true);
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned.');
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
      const credResult = await signInWithCredential(firebaseAuth, appleCredential);

      try {
        const given = appleAuthRequestResponse.fullName?.givenName || '';
        const family = appleAuthRequestResponse.fullName?.familyName || '';
        const displayName = `${given} ${family}`.trim();
        if (displayName && credResult?.user) {
          await credResult.user.updateProfile({ displayName });
        }
      } catch {
        // Non-fatal if we fail to set display name
      }

      await finalizeAuth(credResult.user.uid, credResult.user.email);
    } catch (error: unknown) {
      const appleError = error as { code?: string };
      if (appleError.code !== 'ERR_CANCELED') {
        Alert.alert('Error', getDisplayErrorMessage(error, 'Apple Sign-In failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Create account</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Save your profile and unlock the full experience.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Your birth data and romantic profile will transfer to your new account.
          </Text>
        </View>

        <View style={styles.socialButtons}>
          {Platform.OS === 'ios' && appleAuth ? (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surfaceHighest }]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          ) : null}

          {GoogleSignin ? (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surfaceHigh }]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceHigh }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceHigh }]} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEmailSignUp}
            disabled={isLoading}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} disabled={isLoading}>
          <Text style={[styles.switchLink, { color: colors.textMuted }]}>
            Already have an account? Sign in.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 20,
  },
  headerBlock: {
    gap: 10,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  input: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  switchLink: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
