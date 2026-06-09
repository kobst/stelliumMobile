import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { PulsingHeroIcon } from './PulsingHeroIcon';

interface SubmittingOverlayProps {
  title: string;
  subtitle: string;
}

export function SubmittingOverlay({ title, subtitle }: SubmittingOverlayProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={styles.container}>
        <PulsingHeroIcon
          backgroundColor={colors.surfaceHigh}
          glyphColor={colors.accent}
          haloColor={colors.accent}
        />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
