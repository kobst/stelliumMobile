import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { SERIF_FONT } from '../../theme/typography';
import { Halo } from '../atmosphere/Halo';

/**
 * Onboarding design tokens, lifted faithfully from the reference `C` palette
 * (Celestial Etherealism). Kept local to onboarding so the lilac-tinted,
 * translucent text treatment does not affect the rest of the app's theme.
 */
export const ONB = {
  surface: '#13131b',
  surfaceLow: '#1b1b23',
  primary: '#cabeff',
  primaryDim: 'rgba(202,190,255,0.55)',
  primaryFaint: 'rgba(202,190,255,0.12)',
  gold: '#e9c349',
  cyan: '#00dce5',
  text: '#ece8ff',
  textMuted: 'rgba(236,232,255,0.62)',
  textFaint: 'rgba(236,232,255,0.38)',
  ghost: 'rgba(202,190,255,0.10)',
  ghostStrong: 'rgba(202,190,255,0.16)',
} as const;

// ───────── Eyebrow (uppercase tracked label) ─────────

interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Eyebrow({ children, color = ONB.gold }: EyebrowProps) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

// ───────── Headline (serif display + ambient halo + sub) ─────────

interface OnbHeadlineProps {
  title: string;
  sub?: string | null;
}

export function OnbHeadline({ title, sub }: OnbHeadlineProps) {
  return (
    <View style={styles.headlineWrap}>
      <Halo color={ONB.primary} size={300} opacity={0.16} top={-30} left="50%" />
      <Text style={styles.headlineTitle}>{title}</Text>
      {sub ? <Text style={styles.headlineSub}>{sub}</Text> : null}
    </View>
  );
}

// ───────── ValuePill (serif value above wheels) ─────────

export function ValuePill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.valuePill}>
      <Text style={styles.valuePillText}>{children}</Text>
    </View>
  );
}

// ───────── ChoiceChips (pill chips, selected glows lilac) ─────────

interface ChoiceOption {
  label: string;
  value: string;
}

interface ChoiceChipsProps {
  options: readonly ChoiceOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function ChoiceChips({ options, selected, onSelect }: ChoiceChipsProps) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const on = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
          >
            <Text style={[styles.chipText, { color: on ? ONB.primary : ONB.text }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ───────── PrivacyFooter (lock + reassurance line) ─────────

export function PrivacyFooter() {
  return (
    <View style={styles.privacyRow} pointerEvents="none">
      <Svg width={11} height={12} viewBox="0 0 12 13" fill="none">
        <Rect x={2} y={5.5} width={8} height={5.5} rx={1.4} stroke={ONB.textFaint} strokeWidth={1.1} />
        <Path d="M3.8 5.5 V4 a2.2 2.2 0 0 1 4.4 0 V5.5" stroke={ONB.textFaint} strokeWidth={1.1} />
      </Svg>
      <Text style={styles.privacyText}>Your privacy is secured and won't be shared</Text>
    </View>
  );
}

// ───────── OnbButton (filled lilac gradient / outline) ─────────

interface OnbButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
}

export function OnbButton({ label, onPress, variant = 'filled' }: OnbButtonProps) {
  const filled = variant === 'filled';
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, filled ? styles.buttonFilled : styles.buttonOutline]}
    >
      <Text style={[styles.buttonText, { color: filled ? '#1a142e' : ONB.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headlineWrap: {
    paddingHorizontal: 30,
    paddingTop: 22,
    alignItems: 'center',
  },
  headlineTitle: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.4,
    color: ONB.text,
    textAlign: 'center',
  },
  headlineSub: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 25,
    color: ONB.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  valuePill: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: ONB.primaryFaint,
    borderWidth: 1,
    borderColor: ONB.ghostStrong,
  },
  valuePillText: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: ONB.text,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  chip: {
    flex: 1,
    maxWidth: 130,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipOn: {
    backgroundColor: ONB.primaryFaint,
    borderColor: 'rgba(202,190,255,0.45)',
    shadowColor: ONB.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  chipOff: {
    backgroundColor: ONB.surfaceLow,
    borderColor: ONB.ghost,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  privacyText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: ONB.textFaint,
  },
  button: {
    width: '100%',
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonFilled: {
    backgroundColor: '#cbbcff',
    shadowColor: ONB.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: ONB.ghostStrong,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
