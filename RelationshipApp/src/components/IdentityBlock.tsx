import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { getInitials } from '../utils/mainShell';

interface IdentityBlockProps {
  name: string;
  sun: string | null;
  moon: string | null;
  rising: string | null;
}

export function IdentityBlock({ name, sun, moon, rising }: IdentityBlockProps) {
  const { colors } = useTheme();
  const initial = getInitials(name) || '·';

  const chips = [
    sun ? { icon: '☉', label: `${sun} Sun` } : null,
    moon ? { icon: '☽', label: `${moon} Moon` } : null,
    rising ? { icon: '↑', label: `${rising} Rising` } : null,
  ].filter((chip): chip is { icon: string; label: string } => chip !== null);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.primaryContainer,
          },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      {chips.length > 0 ? (
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <View
              key={chip.label}
              style={[
                styles.chip,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  borderColor: colors.ghostBorder,
                },
              ]}
            >
              <Text style={[styles.chipIcon, { color: colors.accent }]}>{chip.icon}</Text>
              <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{chip.label}</Text>
            </View>
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
