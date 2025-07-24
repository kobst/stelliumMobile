import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AnalysisHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({ title, subtitle, meta }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.onSurfaceHigh }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.onSurfaceHigh }]}>{subtitle}</Text>
      )}
      {meta && (
        <Text style={[styles.meta, { color: colors.onSurfaceMed }]}>{meta}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600', // semibold
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
  },
});
