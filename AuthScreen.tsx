import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';
import { GOOGLE_WEB_CLIENT_ID } from './src/config/firebase';

// Dynamic import with fallback for Google Sign-In
let GoogleSignin: any = null;
let statusCodes: any = null;
try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
} catch (error) {
  console.error('Failed to load Google Sign-In module:', error);
}

// For Apple Sign-In, we'll use a community package
// Note: Requires configuration in Xcode and Apple Developer Console
let appleAuth: any = null;
if (Platform.OS === 'ios') {
  try {
    appleAuth = require('@invertase/react-native-apple-authentication').appleAuth;
  } catch (e) {
    console.log('Apple Auth not available - install @invertase/react-native-apple-authentication');
  }
}

type AuthMode = 'signin' | 'signup';

// Hardcoded colors for AuthScreen - darker to match onboarding wizard
const colors = {
  background: '#1C1B1F',      // Dark background like wizard
  onBackground: '#E6E1E5',    // Light text on dark
  surface: '#2B2930',         // Slightly lighter surface for inputs
  onSurface: '#E6E1E5',       // Light text
  onSurfaceVariant: '#CAC4D0', // Muted text for placeholders
  primary: '#D0BCFF',         // Lighter purple for dark mode
  onPrimary: '#381E72',       // Dark text on primary button
  border: '#49454F',          // Subtle border
};

const AuthScreen: React.FC = () => {

  // State for different auth modes
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);

  // Email/Password fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    try {
      if (GoogleSignin && GoogleSignin.configure) {
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
        });
      }
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
    }
  }, []);

  // Email/Password Authentication
  const signInWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error('Email Sign-In Error:', error);
      let errorMessage = 'Sign-in failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }

      Alert.alert('Sign-In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error('Email Sign-Up Error:', error);
      let errorMessage = 'Sign-up failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }

      Alert.alert('Sign-Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (!GoogleSignin) {
        throw new Error('Google Sign-In is not available');
      }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
        await auth().signInWithCredential(googleCredential);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Error', 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    setLoading(true);
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        setLoading(false);
        return;
      }

      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Failed to get Facebook access token');
      }

      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      await auth().signInWithCredential(facebookCredential);
    } catch (error: any) {
      console.error('Facebook Sign-In Error:', error);
      Alert.alert('Error', 'Facebook Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios' || !appleAuth) {
      Alert.alert('Error', 'Apple Sign-In is only available on iOS');
      return;
    }

    setLoading(true);
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure we have an identity token
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned');
      }

      // Create a Firebase credential from the response
      const {identityToken, nonce} = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign in with Firebase
      await auth().signInWithCredential(appleCredential);
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Error', 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAuthState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  const switchAuthMode = (mode: AuthMode) => {
    resetAuthState();
    setAuthMode(mode);
  };

  // Main authentication screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Welcome to Stellium</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onSurface} />
            ) : (
              <Text style={[styles.socialButtonText, { color: colors.onSurface }]}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && appleAuth && (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000000', borderColor: '#000000' }]}
              onPress={signInWithApple}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.socialButtonText, { color: 'white' }]}>Continue with Apple</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1877F2', borderColor: '#1877F2' }]}
            onPress={signInWithFacebook}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.socialButtonText, { color: 'white' }]}>Continue with Facebook</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>or use email</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
            placeholder="Email address"
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
            placeholder="Password"
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={authMode === 'signup' ? 'password-new' : 'password'}
          />

          {authMode === 'signup' && (
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
              placeholder="Confirm password"
              placeholderTextColor={colors.onSurfaceVariant}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={authMode === 'signin' ? signInWithEmail : signUpWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Sign In / Sign Up */}
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => switchAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {authMode === 'signin' ? "New here? Create account" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthScreen;
