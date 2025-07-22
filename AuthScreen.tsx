import React, {useState, useEffect} from 'react';
import {Button, TextInput, StyleSheet, Alert, SafeAreaView} from 'react-native';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import { useTheme } from './src/theme';

const AuthScreen: React.FC = () => {
  const { colors } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '63614597334-8mamegt0j0lt54p20su2orrvpbt0qeio.apps.googleusercontent.com',
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
        await auth().signInWithCredential(googleCredential);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
    }
  };

  const signInWithFacebook = async () => {
    // TODO: integrate Facebook login and obtain the accessToken
    // const facebookCredential = auth.FacebookAuthProvider.credential(accessToken);
    // await auth().signInWithCredential(facebookCredential);
  };

  const signInWithPhone = async () => {
    if (phoneNumber) {
      try {
        const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
        setConfirm(confirmation);
      } catch (error: any) {
        console.error('Phone Auth Error:', error);
        Alert.alert('Error', 'Phone authentication failed. Please check the number and try again.');
      }
    }
  };

  const confirmCode = async () => {
    if (confirm && code) {
      try {
        await confirm.confirm(code);
      } catch (error: any) {
        console.error('Code Confirmation Error:', error);
        Alert.alert('Error', 'Invalid verification code. Please try again.');
      }
    }
  };

  if (confirm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
          placeholder="Verification code"
          placeholderTextColor={colors.onSurfaceVariant}
          value={code}
          onChangeText={setCode}
        />
        <Button title="Confirm Code" onPress={confirmCode} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Button title="Sign In with Google" onPress={signInWithGoogle} color={colors.primary} />
      <Button title="Sign In with Facebook" onPress={signInWithFacebook} color={colors.primary} />
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.onSurface }]}
        placeholder="Phone number"
        placeholderTextColor={colors.onSurfaceVariant}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <Button title="Send Code" onPress={signInWithPhone} color={colors.primary} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    width: '80%',
    borderWidth: 1,
    marginVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});

export default AuthScreen;
