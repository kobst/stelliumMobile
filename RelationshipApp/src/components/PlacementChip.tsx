import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { ZodiacIcon, type ZodiacSign } from '../../../utils/astrologyIcons';

export type PlacementLabel = 'Sun' | 'Moon' | 'Rising';

interface PlacementChipProps {
  sign: string;
  label: PlacementLabel;
  iconColor?: string;
  textColor?: string;
  size?: number;
  compact?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const ZODIAC_NAMES: ReadonlySet<string> = new Set([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);

function normalizeSign(sign: string): ZodiacSign | null {
  const lower = sign.trim().toLowerCase();
  return ZODIAC_NAMES.has(lower) ? (lower as ZodiacSign) : null;
}

export function PlacementChip({
  sign,
  label,
  iconColor,
  textColor,
  size,
  compact = false,
  containerStyle,
}: PlacementChipProps) {
  const { colors } = useTheme();
  const normalized = normalizeSign(sign);
  const fill = iconColor ?? colors.accent;
  const labelColor = textColor ?? colors.textMuted;
  const iconSize = size ?? (compact ? 12 : 14);

  return (
    <View
      style={[
        compact ? styles.chipCompact : styles.chip,
        { borderColor: colors.ghostBorder, backgroundColor: 'rgba(255, 255, 255, 0.025)' },
        containerStyle,
      ]}
    >
      {normalized ? (
        <View style={styles.iconSlot}>
          <ZodiacIcon sign={normalized} size={iconSize} color={fill} />
        </View>
      ) : null}
      <Text
        style={[compact ? styles.textCompact : styles.text, { color: labelColor }]}
        numberOfLines={1}
      >
        {sign} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  textCompact: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
