import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import UserOnboardingWizard from '../screens/UserOnboardingWizard';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import CreditPurchaseScreen from '../screens/CreditPurchaseScreen';
import { useStore } from '../store';
import { ProfileModal } from '../components/profile';
import { navigationRef } from './navigationService';
import InsufficientCreditsModal from '../components/InsufficientCreditsModal';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { userData, insufficientCreditsModal, hideCreditModal } = useStore();

  console.log('\n=== NAVIGATION CHECK ===');
  console.log('userData exists:', !!userData);
  if (userData) {
    console.log('userData.id:', userData.id);
    console.log('userData.birthChart exists:', !!userData.birthChart);
    console.log('Full userData keys:', Object.keys(userData));
  }

  const profileComplete = Boolean(
    userData && userData.id && userData.birthChart,
  );

  console.log('profileComplete:', profileComplete);
  console.log('Will show:', profileComplete ? 'Main' : 'Onboarding');
  console.log('====================\n');

  // Handle "Add Credits" button in modal
  const handleAddCredits = () => {
    // Close modal first
    hideCreditModal();

    // Execute the routing callback
    if (insufficientCreditsModal.onAddCreditsCallback) {
      insufficientCreditsModal.onAddCreditsCallback();
    }
  };

  const handleCancelModal = () => {
    hideCreditModal();
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {profileComplete ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="CreditPurchase" component={CreditPurchaseScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={UserOnboardingWizard} />
        )}
      </Stack.Navigator>
      <ProfileModal />
      <InsufficientCreditsModal
        visible={insufficientCreditsModal.visible}
        currentCredits={insufficientCreditsModal.currentCredits}
        requiredCredits={insufficientCreditsModal.requiredCredits}
        onAddCredits={handleAddCredits}
        onCancel={handleCancelModal}
      />
    </NavigationContainer>
  );
};

export default RootNavigator;
