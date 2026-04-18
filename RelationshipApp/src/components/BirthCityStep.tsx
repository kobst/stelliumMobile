import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { PlaceAutocompleteInput } from './PlaceAutocompleteInput';
import { SettingsNavBar } from './SettingsNavBar';
import { ProgressDashes } from './ProgressDashes';
import { WizardArrowButton } from './WizardArrowButton';
import { relationshipAppEnv } from '../config/env';
import type { PlaceDetails } from '../api';

interface BirthCityStepProps {
  title: string;
  subtitle?: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelectSuggestion: (selection: PlaceDetails) => void | Promise<void>;
  latitude: number | null;
  longitude: number | null;
  totalOffsetHours: number | null;
  onLatitudeChange: (value: number | null) => void;
  onLongitudeChange: (value: number | null) => void;
  onOffsetChange: (value: number | null) => void;
  onContinue: () => void;
  continueLabel?: string;
  continueVariant?: 'arrow' | 'pill';
  backLabel?: string;
  progress?: { current: number; total: number };
}

export function BirthCityStep({
  title,
  subtitle,
  value,
  onChangeText,
  onSelectSuggestion,
  latitude,
  longitude,
  totalOffsetHours,
  onLatitudeChange,
  onLongitudeChange,
  onOffsetChange,
  onContinue,
  continueLabel = 'Continue',
  continueVariant = 'pill',
  backLabel = 'Back',
  progress,
}: BirthCityStepProps) {
  const { colors } = useTheme();
  const canUseSuggestions = Boolean(relationshipAppEnv.googleApiKey);
  const isWizard = continueVariant === 'arrow';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Birth City" backLabel={backLabel} />
      {progress ? (
        <View style={styles.progressWrap}>
          <ProgressDashes current={progress.current} total={progress.total} />
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
          <PlaceAutocompleteInput
            value={value}
            onChangeText={onChangeText}
            onSelectSuggestion={onSelectSuggestion}
            canUseSuggestions={canUseSuggestions}
            placeholder="City, Country"
          />
          {!canUseSuggestions ? (
            <ManualLatLonRow
              latitude={latitude}
              longitude={longitude}
              offset={totalOffsetHours}
              onLatitude={onLatitudeChange}
              onLongitude={onLongitudeChange}
              onOffset={onOffsetChange}
            />
          ) : null}
        </ScrollView>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ManualLatLonRowProps {
  latitude: number | null;
  longitude: number | null;
  offset: number | null;
  onLatitude: (value: number | null) => void;
  onLongitude: (value: number | null) => void;
  onOffset: (value: number | null) => void;
}

function ManualLatLonRow({
  latitude,
  longitude,
  offset,
  onLatitude,
  onLongitude,
  onOffset,
}: ManualLatLonRowProps) {
  const { colors } = useTheme();
  const handleChange = (setter: (value: number | null) => void) => (raw: string) => {
    if (!raw) {
      setter(null);
      return;
    }
    const parsed = Number(raw);
    setter(Number.isFinite(parsed) ? parsed : null);
  };

  const cells: readonly {
    label: string;
    value: string;
    setter: (raw: string) => void;
  }[] = [
    {
      label: 'Latitude',
      value: latitude !== null ? String(latitude) : '',
      setter: handleChange(onLatitude),
    },
    {
      label: 'Longitude',
      value: longitude !== null ? String(longitude) : '',
      setter: handleChange(onLongitude),
    },
    {
      label: 'UTC offset',
      value: offset !== null ? String(offset) : '',
      setter: handleChange(onOffset),
    },
  ];

  return (
    <View style={styles.manualRow}>
      {cells.map((cell) => (
        <View key={cell.label} style={styles.manualCell}>
          <Text style={[styles.manualLabel, { color: colors.textSubtle }]}>{cell.label}</Text>
          <TextInput
            value={cell.value}
            onChangeText={cell.setter}
            keyboardType="numbers-and-punctuation"
            placeholder="—"
            placeholderTextColor={colors.textSubtle}
            style={[
              styles.manualInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.ghostBorder,
                color: colors.text,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    alignItems: 'center',
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
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualCell: {
    flex: 1,
    gap: 4,
  },
  manualLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  manualInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
});
