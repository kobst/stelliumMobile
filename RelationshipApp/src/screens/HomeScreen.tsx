import React from 'react';
import { PlaceholderScreen } from '../components/PlaceholderScreen';

export const HomeScreen: React.FC = () => {
  return (
    <PlaceholderScreen
      eyebrow="Home"
      title="Relationship-first product home."
      body="This screen will hold the three MVP anchors: analyze a relationship, try a celebrity match, and view your relationship style, plus recent analyses."
    />
  );
};
