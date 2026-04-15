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
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { ApiError, relationshipUsersApi } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
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

type Props = StackScreenProps<RelationshipRootParamList, 'SignIn'>;

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const firebaseAuth = getAuth();
  const { colors } = useTheme();
  const setProfile = useRelationshipAppStore((state) => state.setProfile);
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const clearOnboardingFlow = useRelationshipAppStore((state) => state.clearOnboardingFlow);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const resetAuthState = async () => {
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
    setProfile(null);
    setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
  };

  const getDisplayErrorMessage = (error: unknown, fallback: string) => {
    if (
      error &&
      typeof error === 'object' &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message.length > 0) {
        return message;
      }
    }

    return fallback;
  };

  const completeSignIn = async (firebaseUid: string, firebaseEmail: string | null) => {
    setBootstrapState({ bootstrapStatus: 'loading', bootstrapError: null });

    try {
      const profile = await relationshipUsersApi.getProfileByFirebaseUid(firebaseUid);
      setAuthState({
        authStatus: 'signedIn',
        firebaseUid,
        firebaseEmail,
      });
      setProfile(profile);
      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
      clearOnboardingFlow();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      await resetAuthState();

      if (error instanceof ApiError && error.status === 404) {
        throw new Error(
          'No relationship profile was found for this account. Start onboarding to create one.'
        );
      }

      throw error;
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await completeSignIn(userCredential.user.uid, userCredential.user.email);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let message = getDisplayErrorMessage(error, 'Sign-in failed. Please try again.');

      if (firebaseError.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (firebaseError.code === 'auth/user-not-found') {
        message = 'No account was found for this email.';
      } else if (firebaseError.code === 'auth/wrong-password') {
        message = 'Incorrect email or password.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }

      Alert.alert('Sign-In Error', message);
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
        await completeSignIn(userCredential.user.uid, userCredential.user.email);
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
      await completeSignIn(credResult.user.uid, credResult.user.email);
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
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Sign in</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Return to your relationship profile.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Existing accounts can sign in directly and skip onboarding.
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
            autoCapitalize="none"
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEmailSignIn}
            disabled={isLoading}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 15,
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
