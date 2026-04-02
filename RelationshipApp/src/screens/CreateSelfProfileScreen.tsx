import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { RELATIONSHIP_APP_DOMAIN } from '../../../shared/domain/relationshipUser';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const setCompletedSelfProfile = useRelationshipAppStore((state) => state.setCompletedSelfProfile);
  const setSelfProfileId = useRelationshipAppStore((state) => state.setSelfProfileId);
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const firebaseEmail = useRelationshipAppStore((state) => state.firebaseEmail);

  const body =
    authStatus === 'signedIn'
      ? `This screen will collect the one self profile used across repeated analyses for ${firebaseEmail ?? 'your authenticated account'}. It now targets the dedicated ${RELATIONSHIP_APP_DOMAIN} user domain instead of the original shared account-self user path.`
      : `This screen will collect the one self profile used across repeated analyses. It now targets the dedicated ${RELATIONSHIP_APP_DOMAIN} user domain instead of the original shared account-self user path. Firebase sign-in still needs to be completed before this can submit real profile data.`;

  return (
    <PlaceholderScreen
      eyebrow="You"
      title="Create your persistent relationship profile."
      body={body}
      primaryLabel="Continue To Target"
      secondaryLabel="Back"
      onPrimaryPress={() => {
        setSelfProfileId('relationship-app-self-profile');
        setCompletedSelfProfile(true);
        navigation.navigate('ChooseTargetType');
      }}
      onSecondaryPress={() => navigation.goBack()}
    />
  );
};
