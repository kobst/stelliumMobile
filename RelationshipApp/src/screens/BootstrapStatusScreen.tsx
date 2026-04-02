import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface BootstrapStatusScreenProps {
  title: string;
  body: string;
  showSpinner?: boolean;
}

export const BootstrapStatusScreen: React.FC<BootstrapStatusScreenProps> = ({
  title,
  body,
  showSpinner = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {showSpinner ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
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
});
