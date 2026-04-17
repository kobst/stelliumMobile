import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateSelfProfileScreen } from '../screens/CreateSelfProfileScreen';
import { ProfileRevealScreen } from '../screens/ProfileRevealScreen';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SelfProfileSuccessScreen } from '../screens/SelfProfileSuccessScreen';
import { ChooseTargetTypeScreen } from '../screens/ChooseTargetTypeScreen';
import { CreatePartnerScreen } from '../screens/CreatePartnerScreen';
import { SelectCelebrityScreen } from '../screens/SelectCelebrityScreen';
import { RelationshipPreviewScreen } from '../screens/RelationshipPreviewScreen';
import { AskScreen } from '../screens/AskScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { FullRelationshipAnalysisScreen } from '../screens/FullRelationshipAnalysisScreen';
import { RomanticProfileFullScreen } from '../screens/RomanticProfileFullScreen';
import { AddConnectionScreen } from '../screens/AddConnectionScreen';
import { MainTabs } from './MainTabs';
import { BootstrapStatusScreen } from '../screens/BootstrapStatusScreen';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { useRelationshipAppStore } from '../store';

export type RelationshipRootParamList = {
  Welcome: undefined;
  CreateSelfProfile: undefined;
  ProfileReveal: undefined;
  CreateAccount: undefined;
  SignIn: undefined;
  SelfProfileSuccess: undefined;
  ChooseTargetType: undefined;
  CreatePartner: undefined;
  SelectCelebrity: undefined;
  RelationshipPreview: undefined;
  AskIris:
    | {
        context: 'home' | 'profile' | 'relationship';
        relationshipLabel?: string;
        prefill?: string;
      }
    | undefined;
  Unlock: undefined;
  FullRelationshipAnalysis: undefined;
  RomanticProfileFull: undefined;
  AddConnection: undefined;
  EditBirthDetails: undefined;
  Notifications: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RelationshipRootParamList>();

export const RootNavigator: React.FC = () => {
  const bootstrapStatus = useRelationshipAppStore((state) => state.bootstrapStatus);
  const bootstrapError = useRelationshipAppStore((state) => state.bootstrapError);
  const hasCompletedSelfProfile = useRelationshipAppStore(
    (state) => state.hasCompletedSelfProfile
  );
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);

  if (bootstrapStatus === 'loading') {
    return (
      <BootstrapStatusScreen
        title="Setting things up."
        body="Loading your profile if one already exists."
        showSpinner
      />
    );
  }

  if (bootstrapStatus === 'error') {
    return (
      <BootstrapStatusScreen
        title="We couldn't load your account."
        body={bootstrapError ?? 'The relationship app could not finish bootstrapping.'}
      />
    );
  }

  let initialRouteName: keyof RelationshipRootParamList = 'Welcome';
  if (hasCompletedSelfProfile) {
    initialRouteName = 'Main';
  } else if (profileReveal && guestProfileDraft) {
    initialRouteName = 'ProfileReveal';
  } else if (guestProfileDraft) {
    initialRouteName = 'CreateSelfProfile';
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRouteName}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateSelfProfile" component={CreateSelfProfileScreen} />
        <Stack.Screen name="ProfileReveal" component={ProfileRevealScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SelfProfileSuccess" component={SelfProfileSuccessScreen} />
        <Stack.Screen name="ChooseTargetType" component={ChooseTargetTypeScreen} />
        <Stack.Screen name="CreatePartner" component={CreatePartnerScreen} />
        <Stack.Screen name="SelectCelebrity" component={SelectCelebrityScreen} />
        <Stack.Screen name="RelationshipPreview" component={RelationshipPreviewScreen} />
        <Stack.Screen name="AskIris" component={AskScreen} />
        <Stack.Screen name="Unlock" component={UnlockScreen} />
        <Stack.Screen name="FullRelationshipAnalysis" component={FullRelationshipAnalysisScreen} />
        <Stack.Screen name="RomanticProfileFull" component={RomanticProfileFullScreen} />
        <Stack.Screen name="AddConnection" component={AddConnectionScreen} />
        <Stack.Screen
          name="EditBirthDetails"
          component={EditBirthDetailsPlaceholder}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsPlaceholder}
        />
        <Stack.Screen name="Privacy" component={PrivacyPlaceholder} />
        <Stack.Screen name="HelpSupport" component={HelpSupportPlaceholder} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const EditBirthDetailsPlaceholder: React.FC = () => (
  <PlaceholderScreen
    eyebrow="Profile"
    title="Edit birth details"
    body="Editing birth data will live here. For now, we regenerate your chart when you sign up."
    backLabel="Profile"
  />
);

const NotificationsPlaceholder: React.FC = () => (
  <PlaceholderScreen
    eyebrow="Settings"
    title="Notifications"
    body="Push notification preferences will land here once the notification system is wired."
    backLabel="Profile"
  />
);

const PrivacyPlaceholder: React.FC = () => (
  <PlaceholderScreen
    eyebrow="Settings"
    title="Privacy"
    body="Data export, deletion, and consent controls will live here."
    backLabel="Profile"
  />
);

const HelpSupportPlaceholder: React.FC = () => (
  <PlaceholderScreen
    eyebrow="Settings"
    title="Help & support"
    body="Support channels, FAQs, and contact flows will live here."
    backLabel="Profile"
  />
);
