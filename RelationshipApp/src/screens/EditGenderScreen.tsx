import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useRelationshipAppStore, type ProfileGender } from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';

const OPTIONS: readonly { value: ProfileGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

export function EditGenderScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updateBirthDetailsDraft);

  const [selected, setSelected] = useState<ProfileGender>(draft?.gender ?? 'other');

  const handleDone = useCallback(() => {
    updateDraft({ gender: selected });
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, selected, updateDraft]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Identify as…" backLabel="My Details" />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>How do you identify?</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            This helps personalize tone and copy. It is not used to calculate your chart.
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const active = option.value === selected;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => setSelected(option.value)}
                style={[
                  styles.option,
                  {
                    backgroundColor: active
                      ? 'rgba(202, 190, 255, 0.14)'
                      : colors.surface,
                    borderColor: active ? 'rgba(202, 190, 255, 0.35)' : colors.ghostBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {active ? (
                  <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDone}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    paddingTop: 6,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
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
