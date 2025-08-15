import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store';

/**
 * Debug function to check current auth state across all systems
 */
export const debugAuthState = async () => {
  const currentUser = auth().currentUser;
  const storeState = useStore.getState();

  let asyncStorageData;
  try {
    const [userData, userId] = await Promise.all([
      AsyncStorage.getItem('userData'),
      AsyncStorage.getItem('userId'),
    ]);
    asyncStorageData = {
      userData: userData ? JSON.parse(userData) : null,
      userId,
    };
  } catch (error) {
    asyncStorageData = { error: error.message };
  }

  const authState = {
    firebase: {
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName,
    },
    store: {
      isAuthenticated: storeState.isAuthenticated,
      userData: storeState.userData,
      userId: storeState.userId,
    },
    asyncStorage: asyncStorageData,
  };

  console.log('=== AUTH STATE DEBUG ===');
  console.log(JSON.stringify(authState, null, 2));
  console.log('========================');

  return authState;
};

/**
 * Force sign out and clear all data - useful for testing
 */
export const forceSignOut = async () => {
  console.log('Starting force sign out...');

  try {
    const { signOut } = useStore.getState();
    await signOut();
    console.log('Force sign out completed');
  } catch (error) {
    console.error('Force sign out failed:', error);
    throw error;
  }
};

/**
 * Check if there's cached auth data that might be causing bypass
 */
export const checkForCachedAuthData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authRelatedKeys = keys.filter(key =>
      key.includes('user') ||
      key.includes('auth') ||
      key.includes('firebase') ||
      key.includes('User') ||
      key.includes('Auth')
    );

    const authData = {};
    for (const key of authRelatedKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        authData[key] = value ? JSON.parse(value) : value;
      } catch (parseError) {
        authData[key] = value; // Keep as string if can't parse
      }
    }

    console.log('=== CACHED AUTH DATA ===');
    console.log('Auth-related keys:', authRelatedKeys);
    console.log('Auth data:', authData);
    console.log('========================');

    return { keys: authRelatedKeys, data: authData };
  } catch (error) {
    console.error('Failed to check cached auth data:', error);
    return null;
  }
};
