/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './AuthScreen';
import RootNavigator from './src/navigation';
import LoadingScreen from './src/components/LoadingScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingCarousel from './src/screens/OnboardingCarousel';
import {useStore} from './src/store';
import {usersApi} from './src/api';
import {userTransformers} from './src/transformers/user';
import {SubjectDocument} from './src/types';
import { ThemeProvider } from './src/theme';

const ONBOARDING_COMPLETE_KEY = '@stellium_onboarding_complete';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const { setUserData, initializeFromStorage } = useStore();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (!completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  useEffect(() => {
    console.log('App.tsx: Initializing app...');

    // Initialize store from storage (non-auth data only)
    initializeFromStorage();

    // Enable Firebase auth
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      console.log('App.tsx: Firebase auth state changed:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
      });

      setUser(currentUser);

      // Update store with user authentication state
      if (currentUser) {
        setIsLoadingUserData(true);
        try {
          // Try to fetch existing user data from backend using Firebase UID
          console.log('Fetching user data for authenticated user:', currentUser.uid);
          const response = await usersApi.getUserByFirebaseUid(currentUser.uid);

          if (response && response.success !== false) {
            // User exists in backend, transform and use existing data
            // The getUserByFirebaseUid API returns { success: true, user: {...} }
            const userDocument = response.user || response;
            const userData = userTransformers.subjectDocumentToUser(userDocument as SubjectDocument);
            console.log('Found existing user data:', userData);
            setUserData(userData);
          } else {
            // User doesn't exist in backend, create placeholder data for onboarding
            console.log('User not found in backend - will show onboarding');
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
          }
        } catch (error: any) {
          console.error('Error fetching user data from backend:', error);

          // Check if it's a "user not found" error (expected for new users)
          if (error.message?.includes('User not found') || error.status === 404) {
            console.log('User not found in backend - new user will go through onboarding');
          } else {
            console.error('Unexpected API error:', error);
          }

          // Create placeholder data for onboarding (both cases)
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
        } finally {
          setIsLoadingUserData(false);
        }
      } else {
        console.log('App.tsx: User signed out, clearing store data');
        setUserData(null);
        setIsLoadingUserData(false);
      }
    });

    return unsubscribe;
  }, [initializeFromStorage, setUserData]);

  console.log('App.tsx: Rendering decision - user exists:', !!user, 'loading:', isLoadingUserData);

  // Show splash screen first
  if (showSplash) {
    console.log('App.tsx: Showing SplashScreen');
    return (
      <ThemeProvider>
        <SplashScreen onComplete={handleSplashComplete} />
      </ThemeProvider>
    );
  }

  // Show onboarding if not completed and still checking
  if (isCheckingOnboarding) {
    console.log('App.tsx: Checking onboarding status...');
    return (
      <ThemeProvider>
        <LoadingScreen message="Loading..." />
      </ThemeProvider>
    );
  }

  // Show onboarding carousel if first time user
  if (showOnboarding && !user) {
    console.log('App.tsx: Showing OnboardingCarousel');
    return (
      <ThemeProvider>
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      </ThemeProvider>
    );
  }

  if (!user) {
    console.log('App.tsx: Showing AuthScreen (user not authenticated)');
    return (
      <ThemeProvider>
        <AuthScreen />
      </ThemeProvider>
    );
  }

  if (isLoadingUserData) {
    console.log('App.tsx: Showing LoadingScreen (fetching user data)');
    return (
      <ThemeProvider>
        <LoadingScreen message="Loading your profile..." />
      </ThemeProvider>
    );
  }

  console.log('App.tsx: Showing RootNavigator (user authenticated)');
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
};

export default App;
