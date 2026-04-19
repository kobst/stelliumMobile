import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { Avatar } from './Avatar';

export type RelationshipKind = 'celeb' | 'person';

interface RelationshipCardProps {
  kind: RelationshipKind;
  name: string;
  archetype: string | null;
  otherInitial?: string | null;
  otherPhotoUri?: string | null;
  onPress: () => void;
}

export function RelationshipCard({
  kind,
  name,
  archetype,
  otherInitial,
  otherPhotoUri,
  onPress,
}: RelationshipCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <Avatar
        size={44}
        gradient={kind === 'celeb' ? 'gold' : 'green'}
        fallbackInitial={otherInitial}
        photoUri={otherPhotoUri}
      />

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {archetype ? (
          <Text style={[styles.archetype, { color: colors.accent }]} numberOfLines={2}>
            {archetype}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  archetype: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
