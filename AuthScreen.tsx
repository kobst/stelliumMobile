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
  Dimensions,
} from 'react-native';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';
import { useTheme } from './src/theme';
import { GOOGLE_WEB_CLIENT_ID, FACEBOOK_APP_ID } from './src/config/firebase';

type AuthMode = 'signin' | 'signup' | 'phone';

const { width } = Dimensions.get('window');

const AuthScreen: React.FC = () => {
  const { colors } = useTheme();

  // State for different auth modes
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);

  // Email/Password fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone auth fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
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

  const signInWithPhone = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
    } catch (error: any) {
      console.error('Phone Auth Error:', error);
      let errorMessage = 'Phone authentication failed. Please check the number and try again.';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!confirm) {
      Alert.alert('Error', 'No confirmation object available. Please try sending the code again.');
      return;
    }

    setLoading(true);
    try {
      await confirm.confirm(code);
    } catch (error: any) {
      console.error('Code Confirmation Error:', error);
      let errorMessage = 'Invalid verification code. Please try again.';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'The verification code is invalid.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'The verification code has expired. Please request a new one.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetAuthState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setCode('');
    setConfirm(null);
    setLoading(false);
  };

  const switchAuthMode = (mode: AuthMode) => {
    resetAuthState();
    setAuthMode(mode);
  };

  // Phone verification screen
  if (confirm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.onBackground }]}>Verify Phone Number</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Enter the verification code sent to {phoneNumber}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
              placeholder="Verification code"
              placeholderTextColor={colors.onSurfaceVariant}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={confirmCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => {
                setConfirm(null);
                setCode('');
              }}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main authentication screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Welcome to Stellium</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {authMode === 'signin' ? 'Sign in to your account' :
             authMode === 'signup' ? 'Create your account' : 'Sign in with phone number'}
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
          <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Auth Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              authMode === 'signin' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => switchAuthMode('signin')}
          >
            <Text style={[
              styles.modeButtonText,
              { color: authMode === 'signin' ? colors.onPrimary : colors.onSurface },
            ]}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              authMode === 'signup' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => switchAuthMode('signup')}
          >
            <Text style={[
              styles.modeButtonText,
              { color: authMode === 'signup' ? colors.onPrimary : colors.onSurface },
            ]}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              authMode === 'phone' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => switchAuthMode('phone')}
          >
            <Text style={[
              styles.modeButtonText,
              { color: authMode === 'phone' ? colors.onPrimary : colors.onSurface },
            ]}>Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {authMode === 'phone' ? (
            // Phone Number Input
            <>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
                placeholder="Phone number (+1234567890)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={signInWithPhone}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // Email/Password Inputs
            <>
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
            </>
          )}
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
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 1,
    borderRadius: 6,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
