import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type AvatarGradient = 'lavender' | 'gold' | 'green';

export interface AvatarProps {
  size?: number;
  photoUri?: string | null;
  fallbackInitial?: string | null;
  fallbackEmoji?: string | null;
  gradient?: AvatarGradient;
  ringColor?: string;
  ringWidth?: number;
}

const GRADIENT_FILL: Record<AvatarGradient, string> = {
  lavender: '#9B7DD4',
  gold: '#C49530',
  green: '#5BA890',
};

export function Avatar({
  size = 38,
  photoUri = null,
  fallbackInitial = null,
  fallbackEmoji = null,
  gradient = 'lavender',
  ringColor,
  ringWidth = 2,
}: AvatarProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const resolvedRing = ringColor ?? colors.surface;
  const dimension = size;
  const innerDimension = dimension - ringWidth * 2;

  const baseStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    borderWidth: ringWidth,
    borderColor: resolvedRing,
    overflow: 'hidden' as const,
  };

  const showPhoto = Boolean(photoUri && !imageFailed);
  const showEmoji = !showPhoto && Boolean(fallbackEmoji);

  if (showPhoto) {
    return (
      <View style={baseStyle}>
        <Image
          source={{ uri: photoUri ?? undefined }}
          onError={() => setImageFailed(true)}
          style={{ width: innerDimension, height: innerDimension }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (showEmoji) {
    return (
      <View style={[baseStyle, styles.center, styles.emojiBackground]}>
        <Text
          style={[
            styles.emoji,
            { fontSize: dimension * 0.45, color: colors.accent },
          ]}
        >
          {fallbackEmoji}
        </Text>
      </View>
    );
  }

  const gradientFill = GRADIENT_FILL[gradient];
  const initial = (fallbackInitial ?? '?').toUpperCase();

  return (
    <View style={[baseStyle, styles.center, { backgroundColor: gradientFill }]}>
      <Text
        style={[
          styles.initial,
          { fontSize: dimension * 0.42, color: colors.onPrimary },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBackground: {
    backgroundColor: 'rgba(212, 168, 67, 0.18)',
  },
  initial: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emoji: {
    fontWeight: '600',
  },
});
