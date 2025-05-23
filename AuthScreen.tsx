import React, {useState} from 'react';
import {Button, TextInput, View, StyleSheet} from 'react-native';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

const AuthScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [code, setCode] = useState('');

  const signInWithGoogle = async () => {
    // TODO: integrate Google sign-in and obtain the idToken
    // const { idToken } = await GoogleSignin.signIn();
    // const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    // await auth().signInWithCredential(googleCredential);
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
      } catch (e) {
        console.error(e);
      }
    }
  };

  const confirmCode = async () => {
    if (confirm && code) {
      try {
        await confirm.confirm(code);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (confirm) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Verification code"
          value={code}
          onChangeText={setCode}
        />
        <Button title="Confirm Code" onPress={confirmCode} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Sign In with Google" onPress={signInWithGoogle} />
      <Button title="Sign In with Facebook" onPress={signInWithFacebook} />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <Button title="Send Code" onPress={signInWithPhone} />
    </View>
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
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 8,
    paddingHorizontal: 8,
  },
});

export default AuthScreen;
