import React, { useCallback, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';

export function EditNameScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updateBirthDetailsDraft);

  const [firstName, setFirstName] = useState(draft?.firstName ?? '');
  const [lastName, setLastName] = useState(draft?.lastName ?? '');

  const canSave = firstName.trim().length > 0;

  const handleDone = useCallback(() => {
    if (!canSave) {
      return;
    }
    updateDraft({ firstName: firstName.trim(), lastName: lastName.trim() });
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [canSave, firstName, lastName, navigation, updateDraft]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Name" backLabel="My Details" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>What's your name?</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.ghostBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleDone}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.ghostBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDone}
            disabled={!canSave}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.4 },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    paddingTop: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
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
