import { useState } from 'react';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { usersApi } from '../api/users';
import { useStore } from '../store';
import { navigate } from '../navigation/navigationService';

export const useAccountDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { userData, clearAllData } = useStore();

  /**
   * Main deletion flow orchestrator
   * Called from DeleteConfirmationModal after user types "DELETE"
   */
  const deleteAccount = async () => {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to delete your account');
        return;
      }

      if (!userData?.id) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      setIsDeleting(true);

      // Attempt deletion - will throw error if needs re-auth
      await performDeletion(currentUser);
    } catch (error: any) {
      console.error('Delete account error:', error);
      setIsDeleting(false);

      if (error.code === 'auth/requires-recent-login') {
        // User needs to re-authenticate
        promptReauthentication();
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to delete account. Please try again.'
        );
      }
    }
  };

  /**
   * Prompt user to re-authenticate based on their provider
   */
  const promptReauthentication = () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'No user found');
      return;
    }

    // Get the provider ID (google.com, apple.com, facebook.com, password)
    const providerId = currentUser.providerData[0]?.providerId;

    if (providerId === 'google.com') {
      reauthenticateWithGoogle();
    } else if (providerId === 'apple.com') {
      reauthenticateWithApple();
    } else if (providerId === 'facebook.com') {
      reauthenticateWithFacebook();
    } else if (providerId === 'password') {
      reauthenticateWithPassword();
    } else {
      Alert.alert(
        'Re-authentication Required',
        'For security, please sign out and sign back in before deleting your account.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Re-authenticate with Google
   */
  const reauthenticateWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);

      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.reauthenticateWithCredential(googleCredential);
        // Retry deletion after successful re-auth
        await deleteAccount();
      }
    } catch (error: any) {
      console.error('Google re-auth error:', error);
      Alert.alert('Error', 'Failed to re-authenticate with Google');
    }
  };

  /**
   * Re-authenticate with Apple (iOS only)
   */
  const reauthenticateWithApple = async () => {
    try {
      const appleAuth = require('@invertase/react-native-apple-authentication');
      const appleAuthRequestResponse = await appleAuth.default.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.reauthenticateWithCredential(appleCredential);
        // Retry deletion after successful re-auth
        await deleteAccount();
      }
    } catch (error: any) {
      console.error('Apple re-auth error:', error);
      Alert.alert('Error', 'Failed to re-authenticate with Apple');
    }
  };

  /**
   * Re-authenticate with Facebook
   */
  const reauthenticateWithFacebook = async () => {
    try {
      const FBSDK = require('react-native-fbsdk-next');
      const result = await FBSDK.LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        return;
      }

      const data = await FBSDK.AccessToken.getCurrentAccessToken();
      if (!data) {
        throw new Error('Failed to get Facebook access token');
      }

      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.reauthenticateWithCredential(facebookCredential);
        // Retry deletion after successful re-auth
        await deleteAccount();
      }
    } catch (error: any) {
      console.error('Facebook re-auth error:', error);
      Alert.alert('Error', 'Failed to re-authenticate with Facebook');
    }
  };

  /**
   * Re-authenticate with email/password
   */
  const reauthenticateWithPassword = () => {
    const currentUser = auth().currentUser;

    if (!currentUser?.email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    Alert.prompt(
      'Verify Your Identity',
      `Enter your password for ${currentUser.email}:`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Error', 'Password is required');
              return;
            }

            try {
              const credential = auth.EmailAuthProvider.credential(
                currentUser.email!,
                password
              );

              await currentUser.reauthenticateWithCredential(credential);
              // Retry deletion after successful re-auth
              await deleteAccount();
            } catch (error: any) {
              console.error('Password re-auth error:', error);

              if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Incorrect password. Please try again.');
              } else {
                Alert.alert('Error', 'Failed to verify password');
              }
            }
          },
        },
      ],
      'secure-text'
    );
  };

  /**
   * Perform the actual deletion
   */
  const performDeletion = async (currentUser: any) => {
    try {
      const userId = userData!.id;

      console.log('🗑️ Starting account deletion...');
      console.log('User ID:', userId);
      console.log('Firebase UID:', currentUser.uid);

      // Step 1: Delete all backend data
      console.log('📡 Calling backend API to delete data...');
      const result = await usersApi.deleteAccount(userId);

      console.log('✅ Backend data deleted');
      console.log('Deletion results:', result);

      // Step 2: Delete Firebase Auth account
      console.log('🔥 Deleting Firebase Auth account...');
      try {
        await currentUser.delete();
        console.log('✅ Firebase Auth account deleted');
      } catch (error: any) {
        console.error('⚠️ Firebase Auth deletion failed:', error);
        // Continue with cleanup anyway
      }

      // Step 3: Clear local data
      console.log('🧹 Clearing local data...');
      await clearLocalData();

      // Step 4: Navigate to success screen
      setIsDeleting(false);
      console.log('✅ Account deletion complete, navigating to AccountDeletedScreen');
      navigate('AccountDeleted');
    } catch (error: any) {
      console.error('❌ Deletion failed:', error);
      throw error;
    }
  };

  /**
   * Clear all local data
   */
  const clearLocalData = async () => {
    try {
      // Clear Zustand store and AsyncStorage
      await clearAllData();

      console.log('✅ Local data cleared');
    } catch (error) {
      console.error('⚠️ Error clearing local data:', error);
      // Continue anyway
    }
  };

  return {
    deleteAccount,
    isDeleting,
  };
};
