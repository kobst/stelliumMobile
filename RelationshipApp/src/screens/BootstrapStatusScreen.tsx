import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

interface BootstrapStatusScreenProps {
  title: string;
  body: string;
  showSpinner?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export const BootstrapStatusScreen: React.FC<BootstrapStatusScreenProps> = ({
  title,
  body,
  showSpinner = false,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {showSpinner ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 18,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
