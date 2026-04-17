import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
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
            borderColor: colors.primary,
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
                  backgroundColor: colors.surfaceHigh,
                  borderColor: colors.ghostBorder,
                },
              ]}
            >
              <Text style={[styles.chipIcon, { color: colors.textMuted }]}>{chip.icon}</Text>
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
    gap: 12,
    paddingVertical: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
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
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipIcon: {
    fontSize: 11,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
