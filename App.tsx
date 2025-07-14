/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AuthScreen from './AuthScreen';
import RootNavigator from './src/navigation';
import {useStore} from './src/store';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const { setUserData, initializeFromStorage } = useStore();

  useEffect(() => {
    // Initialize store from storage
    initializeFromStorage();

    const unsubscribe = auth().onAuthStateChanged(currentUser => {
      setUser(currentUser);

      // Update store with user authentication state
      if (currentUser) {
        const userData = {
          id: currentUser.uid,
          name: currentUser.displayName || 'User',
          email: currentUser.email || '',
          // Placeholder birth data - will be collected during onboarding
          birthYear: 1990,
          birthMonth: 1,
          birthDay: 1,
          birthHour: 12,
          birthMinute: 0,
          birthLocation: '',
          timezone: '',
        };
        setUserData(userData);
      } else {
        setUserData(null);
      }
    });

    return unsubscribe;
  }, [initializeFromStorage, setUserData]);

  if (!user) {
    return <AuthScreen />;
  }

  return <RootNavigator />;
};

export default App;
