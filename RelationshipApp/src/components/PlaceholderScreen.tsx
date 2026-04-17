import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

interface PlaceholderScreenProps {
  eyebrow?: string;
  title: string;
  body: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  backLabel?: string;
  showBack?: boolean;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  eyebrow,
  title,
  body,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  backLabel = 'Back',
  showBack,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBack ?? canGoBack;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        {shouldShowBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            accessibilityRole="button"
            accessibilityLabel="Back to previous screen"
          >
            <Text style={[styles.backText, { color: colors.textMuted }]}>← {backLabel}</Text>
          </TouchableOpacity>
        ) : null}
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
        {children}
      </View>

      <View style={styles.actions}>
        {primaryLabel ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onPrimaryPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {secondaryLabel ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSecondaryPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    gap: 16,
    paddingTop: 12,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
    paddingBottom: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
