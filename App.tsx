/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AuthScreen from './AuthScreen';
import RootNavigator from './src/navigation';
import {useStore} from './src/store';
import {usersApi} from './src/api';
import {userTransformers} from './src/transformers/user';
import {SubjectDocument} from './src/types';
import { ThemeProvider } from './src/theme';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const { setUserData, initializeFromStorage } = useStore();

  useEffect(() => {
    // Initialize store from storage
    initializeFromStorage();

    // DEVELOPMENT: Bypass Firebase auth and use hardcoded userId
    const initializeWithHardcodedUser = async () => {
      // This should be the _id field from a SubjectDocument in your database
      const HARDCODED_USER_ID = '687dabfa483ae7f0e460b34d';

      console.log('\n=== DEVELOPMENT MODE: Using hardcoded userId ===');
      console.log('Hardcoded User ID:', HARDCODED_USER_ID);
      console.log('================================================\n');

      try {
        // Fetch user from backend using hardcoded userId
        console.log('Fetching user data from backend...');
        const response = await usersApi.getUser(HARDCODED_USER_ID);
        console.log('Backend response:', response);

        // Transform backend SubjectDocument to frontend User format
        const userData = userTransformers.subjectDocumentToUser(response as SubjectDocument);
        console.log('Transformed user data:', userData);

        // Create a simulated Firebase user object
        const simulatedFirebaseUser = {
          uid: userData.id,
          displayName: userData.name,
          email: userData.email,
        } as FirebaseAuthTypes.User;

        // Set both Firebase user state and store data
        setUser(simulatedFirebaseUser);
        setUserData(userData);

        console.log('Successfully initialized with hardcoded user data');
      } catch (error) {
        console.error('Failed to fetch hardcoded user data:', error);
        // Set user to null so AuthScreen is shown
        setUser(null);
        setUserData(null);
      }
    };

    // Comment out Firebase auth for development
    // const unsubscribe = auth().onAuthStateChanged(currentUser => {
    //   setUser(currentUser);
    //
    //   // Update store with user authentication state
    //   if (currentUser) {
    //     const userData = {
    //       id: currentUser.uid,
    //       name: currentUser.displayName || 'User',
    //       email: currentUser.email || '',
    //       // Placeholder birth data - will be collected during onboarding
    //       birthYear: 1990,
    //       birthMonth: 1,
    //       birthDay: 1,
    //       birthHour: 12,
    //       birthMinute: 0,
    //       birthLocation: '',
    //       timezone: '',
    //     };
    //     setUserData(userData);
    //   } else {
    //     setUserData(null);
    //   }
    // });

    // Use hardcoded user initialization instead
    initializeWithHardcodedUser();

    // return unsubscribe;
  }, [initializeFromStorage, setUserData]);

  if (!user) {
    return (
      <ThemeProvider>
        <AuthScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
};

export default App;
