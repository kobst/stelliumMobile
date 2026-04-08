import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
}) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
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
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {secondaryLabel ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onSecondaryPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>
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
    paddingTop: 32,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
