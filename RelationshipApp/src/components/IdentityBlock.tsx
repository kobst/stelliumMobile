import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { getInitials } from '../utils/mainShell';
import { PlacementChip, type PlacementLabel } from './PlacementChip';

interface IdentityBlockProps {
  name: string;
  sun: string | null;
  moon: string | null;
  rising: string | null;
}

interface Item {
  sign: string;
  label: PlacementLabel;
}

export function IdentityBlock({ name, sun, moon, rising }: IdentityBlockProps) {
  const { colors } = useTheme();
  const initial = getInitials(name) || '·';

  const chips: Item[] = [
    sun ? { sign: sun, label: 'Sun' as const } : null,
    moon ? { sign: moon, label: 'Moon' as const } : null,
    rising ? { sign: rising, label: 'Rising' as const } : null,
  ].filter((chip): chip is Item => chip !== null);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.primaryContainer },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      {chips.length > 0 ? (
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <PlacementChip key={chip.label} sign={chip.sign} label={chip.label} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#cabeff',
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarText: {
    fontFamily: SERIF_FONT,
    fontSize: 34,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  name: {
    fontFamily: SERIF_FONT,
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});
