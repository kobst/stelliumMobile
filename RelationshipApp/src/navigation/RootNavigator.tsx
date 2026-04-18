import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateSelfProfileScreen } from '../screens/CreateSelfProfileScreen';
import { ProfileRevealScreen } from '../screens/ProfileRevealScreen';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SelfProfileSuccessScreen } from '../screens/SelfProfileSuccessScreen';
import { SelectCelebrityScreen } from '../screens/SelectCelebrityScreen';
import { RelationshipPreviewScreen } from '../screens/RelationshipPreviewScreen';
import { AskScreen } from '../screens/AskScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { FullRelationshipAnalysisScreen } from '../screens/FullRelationshipAnalysisScreen';
import { RomanticProfileFullScreen } from '../screens/RomanticProfileFullScreen';
import { AddConnectionScreen } from '../screens/AddConnectionScreen';
import { PartnerIdentityScreen } from '../screens/PartnerIdentityScreen';
import { PartnerBirthDateScreen } from '../screens/PartnerBirthDateScreen';
import { PartnerBirthTimeScreen } from '../screens/PartnerBirthTimeScreen';
import { PartnerBirthCityScreen } from '../screens/PartnerBirthCityScreen';
import { PartnerConfirmScreen } from '../screens/PartnerConfirmScreen';
import { CreditHistoryScreen } from '../screens/CreditHistoryScreen';
import { ManageSubscriptionScreen } from '../screens/ManageSubscriptionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { EditBirthDetailsScreen } from '../screens/EditBirthDetailsScreen';
import { EditBirthDateScreen } from '../screens/EditBirthDateScreen';
import { EditBirthTimeScreen } from '../screens/EditBirthTimeScreen';
import { EditBirthCityScreen } from '../screens/EditBirthCityScreen';
import { EditNameScreen } from '../screens/EditNameScreen';
import { EditGenderScreen } from '../screens/EditGenderScreen';
import { MainTabs } from './MainTabs';
import { BootstrapStatusScreen } from '../screens/BootstrapStatusScreen';
import { useRelationshipAppStore } from '../store';

export type RelationshipRootParamList = {
  Welcome: undefined;
  CreateSelfProfile: undefined;
  ProfileReveal: undefined;
  CreateAccount: undefined;
  SignIn: undefined;
  SelfProfileSuccess: undefined;
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
  PartnerIdentity: undefined;
  PartnerBirthDate: undefined;
  PartnerBirthTime: undefined;
  PartnerBirthCity: undefined;
  PartnerConfirm: undefined;
  EditBirthDetails: undefined;
  EditBirthDate: undefined;
  EditBirthTime: undefined;
  EditBirthCity: undefined;
  EditName: undefined;
  EditGender: undefined;
  Notifications: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  CreditHistory: undefined;
  ManageSubscription: undefined;
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
        <Stack.Screen name="SelectCelebrity" component={SelectCelebrityScreen} />
        <Stack.Screen name="RelationshipPreview" component={RelationshipPreviewScreen} />
        <Stack.Screen name="AskIris" component={AskScreen} />
        <Stack.Screen name="Unlock" component={UnlockScreen} />
        <Stack.Screen name="FullRelationshipAnalysis" component={FullRelationshipAnalysisScreen} />
        <Stack.Screen name="RomanticProfileFull" component={RomanticProfileFullScreen} />
        <Stack.Screen name="AddConnection" component={AddConnectionScreen} />
        <Stack.Screen name="PartnerIdentity" component={PartnerIdentityScreen} />
        <Stack.Screen name="PartnerBirthDate" component={PartnerBirthDateScreen} />
        <Stack.Screen name="PartnerBirthTime" component={PartnerBirthTimeScreen} />
        <Stack.Screen name="PartnerBirthCity" component={PartnerBirthCityScreen} />
        <Stack.Screen name="PartnerConfirm" component={PartnerConfirmScreen} />
        <Stack.Screen name="EditBirthDetails" component={EditBirthDetailsScreen} />
        <Stack.Screen name="EditBirthDate" component={EditBirthDateScreen} />
        <Stack.Screen name="EditBirthTime" component={EditBirthTimeScreen} />
        <Stack.Screen name="EditBirthCity" component={EditBirthCityScreen} />
        <Stack.Screen name="EditName" component={EditNameScreen} />
        <Stack.Screen name="EditGender" component={EditGenderScreen} />
        <Stack.Screen name="CreditHistory" component={CreditHistoryScreen} />
        <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
