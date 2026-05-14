import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { getBigThree } from '../utils/mainShell';

const SIGN_GLYPHS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

interface SignsRowProps {
  profile: RelationshipAppProfile | null | undefined;
}

export function SignsRow({ profile }: SignsRowProps) {
  const { colors } = useTheme();
  const { sun, moon, rising } = getBigThree(profile);

  const items = [
    { glyph: '☉', name: sun, label: 'Sun' },
    { glyph: '☾', name: moon, label: 'Moon' },
    { glyph: '↑', name: rising, label: 'Rising' },
  ].filter((item) => Boolean(item.name));

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? (
            <Text style={[styles.dot, { color: colors.textSubtle }]}>·</Text>
          ) : null}
          <View style={styles.item}>
            <Text style={[styles.glyph, { color: colors.accent }]}>
              {item.name && SIGN_GLYPHS[item.name] ? SIGN_GLYPHS[item.name] : item.glyph}
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>
              {item.name} {item.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glyph: {
    fontSize: 14,
    fontWeight: '500',
  },
  text: {
    fontSize: 13,
  },
  dot: {
    fontSize: 11,
    marginHorizontal: 6,
  },
});
