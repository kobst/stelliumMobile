import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { BirthDatePicker } from './BirthDatePicker';
import { SettingsNavBar } from './SettingsNavBar';
import { ProgressDashes } from './ProgressDashes';
import { WizardArrowButton } from './WizardArrowButton';

interface BirthDateStepProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (next: string) => void;
  onContinue: () => void;
  continueLabel?: string;
  continueVariant?: 'arrow' | 'pill';
  backLabel?: string;
  progress?: { current: number; total: number };
}

function formatDisplay(iso: string): string {
  const dateOnly = iso.split('T')[0] ?? iso;
  const [year, month, day] = dateOnly.split('-');
  if (!year || !month || !day) {
    return iso;
  }
  return `${month}/${day}/${year}`;
}

export function BirthDateStep({
  title,
  subtitle,
  value,
  onChange,
  onContinue,
  continueLabel = 'Continue',
  continueVariant = 'pill',
  backLabel = 'Back',
  progress,
}: BirthDateStepProps) {
  const { colors } = useTheme();
  const isWizard = continueVariant === 'arrow';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Birth Date" backLabel={backLabel} />
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
      <View style={[styles.valueChip, { backgroundColor: colors.surfaceHigh }]}>
        <Text style={[styles.valueChipText, { color: colors.text }]}>
          {formatDisplay(value)}
        </Text>
      </View>
      <View style={styles.pickerWrap}>
        <BirthDatePicker value={value} onChange={onChange} />
      </View>
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
