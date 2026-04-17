import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, type AvatarGradient } from './Avatar';

interface AvatarPairProps {
  userInitial: string;
  userPhotoUri?: string | null;
  otherInitial?: string | null;
  otherPhotoUri?: string | null;
  otherEmoji?: string | null;
  otherGradient?: AvatarGradient;
  size?: number;
}

export function AvatarPair({
  userInitial,
  userPhotoUri = null,
  otherInitial = null,
  otherPhotoUri = null,
  otherEmoji = null,
  otherGradient = 'gold',
  size = 38,
}: AvatarPairProps) {
  const overlap = size * 0.35;
  const pairWidth = size * 2 - overlap;
  const pairHeight = size + 6;

  return (
    <View style={[styles.wrap, { width: pairWidth, height: pairHeight }]}>
      <View style={[styles.left, { top: 0 }]}>
        <Avatar
          size={size}
          gradient="lavender"
          fallbackInitial={userInitial}
          photoUri={userPhotoUri}
        />
      </View>
      <View style={[styles.right, { top: 6, left: size - overlap }]}>
        <Avatar
          size={size}
          gradient={otherGradient}
          fallbackInitial={otherInitial}
          fallbackEmoji={otherEmoji}
          photoUri={otherPhotoUri}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexShrink: 0,
  },
  left: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
  },
  right: {
    position: 'absolute',
    zIndex: 1,
  },
});
