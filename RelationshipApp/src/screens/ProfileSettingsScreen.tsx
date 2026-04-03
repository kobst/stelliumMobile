import React from 'react';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { DevSessionPanel } from '../components/DevSessionPanel';

export const ProfileSettingsScreen: React.FC = () => {
  return (
    <PlaceholderScreen
      eyebrow="Profile"
      title="Edit your persistent self profile."
      body="This screen will manage the one primary self profile per account, plus settings, account actions, and later usage or entitlement views."
    >
      <DevSessionPanel />
    </PlaceholderScreen>
  );
};
