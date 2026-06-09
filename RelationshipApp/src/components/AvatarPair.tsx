import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Avatar, type AvatarGradient } from './Avatar';

interface AvatarPairProps {
  leftPhotoUri?: string | null;
  leftInitial?: string | null;
  leftGradient?: AvatarGradient;
  rightPhotoUri?: string | null;
  rightInitial?: string | null;
  rightGradient?: AvatarGradient;
  size?: number;
  ringColor?: string;
}

export function AvatarPair({
  leftPhotoUri = null,
  leftInitial = null,
  leftGradient = 'gold',
  rightPhotoUri = null,
  rightInitial = null,
  rightGradient = 'gold',
  size = 36,
  ringColor,
}: AvatarPairProps) {
  const { colors } = useTheme();
  const ring = ringColor ?? colors.surface;
  const overlap = Math.round(size * 0.45);
  const pairWidth = size * 2 - overlap;
  const pairHeight = size + 4;

  return (
    <View style={[styles.wrap, { width: pairWidth, height: pairHeight }]}>
      <View style={[styles.left, { top: 0 }]}>
        <Avatar
          size={size}
          gradient={leftGradient}
          fallbackInitial={leftInitial}
          photoUri={leftPhotoUri}
          ringColor={ring}
          ringWidth={2.5}
        />
      </View>
      <View style={[styles.right, { top: 4, left: size - overlap }]}>
        <Avatar
          size={size}
          gradient={rightGradient}
          fallbackInitial={rightInitial}
          photoUri={rightPhotoUri}
          ringColor={ring}
          ringWidth={2.5}
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
