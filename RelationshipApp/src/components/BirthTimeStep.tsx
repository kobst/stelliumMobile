import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { BirthTimePicker } from './BirthTimePicker';
import { SettingsNavBar } from './SettingsNavBar';

interface BirthTimeStepProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (next: string) => void;
  birthTimeUnknown: boolean;
  onToggleUnknown: () => void;
  onContinue: () => void;
  continueLabel?: string;
  backLabel?: string;
}

function formatDisplay(time: string): string {
  const [rawHours, rawMinutes] = time.split(':').map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) {
    return time;
  }
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  return `${hours12}:${String(rawMinutes).padStart(2, '0')} ${ampm}`;
}

export function BirthTimeStep({
  title,
  subtitle,
  value,
  onChange,
  birthTimeUnknown,
  onToggleUnknown,
  onContinue,
  continueLabel = 'Continue',
  backLabel = 'Back',
}: BirthTimeStepProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Birth Time" backLabel={backLabel} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={onToggleUnknown} activeOpacity={0.7}>
          <Text
            style={[
              styles.unknownToggleText,
              { color: birthTimeUnknown ? colors.primary : colors.textSubtle },
            ]}
          >
            {birthTimeUnknown ? 'Unknown' : "I don't know"}
          </Text>
        </TouchableOpacity>
      </View>
      {!birthTimeUnknown ? (
        <>
          <View style={[styles.valueChip, { backgroundColor: colors.surfaceHigh }]}>
            <Text style={[styles.valueChipText, { color: colors.text }]}>
              {formatDisplay(value)}
            </Text>
          </View>
          <View style={styles.pickerWrap}>
            <BirthTimePicker value={value} onChange={onChange} />
          </View>
        </>
      ) : (
        <View style={styles.pickerWrap}>
          <View
            style={[
              styles.helperCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              We&apos;ll calculate without house placements.
            </Text>
          </View>
        </View>
      )}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onContinue}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            {continueLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  toggleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  unknownToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  valueChip: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 12,
  },
  valueChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  helperCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
