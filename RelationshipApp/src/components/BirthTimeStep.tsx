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
import { ProgressDashes } from './ProgressDashes';
import { WizardArrowButton } from './WizardArrowButton';

interface BirthTimeStepProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (next: string) => void;
  birthTimeUnknown: boolean;
  onToggleUnknown: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueVariant?: 'arrow' | 'pill';
  backLabel?: string;
  progress?: { current: number; total: number };
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
  continueVariant = 'pill',
  backLabel = 'Back',
  progress,
}: BirthTimeStepProps) {
  const { colors } = useTheme();
  const isWizard = continueVariant === 'arrow';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Birth Time" backLabel={backLabel} />
      {progress ? (
        <View style={styles.progressWrap}>
          <ProgressDashes current={progress.current} total={progress.total} />
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={onToggleUnknown}
          activeOpacity={0.7}
          style={styles.checkboxRow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                backgroundColor: birthTimeUnknown ? colors.primary : 'transparent',
                borderColor: birthTimeUnknown ? colors.primary : colors.ghostBorder,
              },
            ]}
          >
            {birthTimeUnknown ? (
              <Text style={[styles.checkboxMark, { color: colors.onPrimary }]}>✓</Text>
            ) : null}
          </View>
          <Text
            style={[
              styles.checkboxLabel,
              { color: birthTimeUnknown ? colors.text : colors.textMuted },
            ]}
          >
            {birthTimeUnknown ? 'Birth time unknown' : "I don't know the birth time"}
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
      <View style={[styles.footer, isWizard ? styles.footerWizard : null]}>
        {isWizard ? (
          <WizardArrowButton onPress={onContinue} />
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onContinue}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {continueLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
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
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueChip: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 14,
  },
  valueChipText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pickerWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
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
  footerWizard: {
    alignItems: 'flex-end',
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
