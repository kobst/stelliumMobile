import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ProfileAvatar } from '../profile';

interface AnalysisHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  meta?: string;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({ title, subtitle, meta }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.onSurfaceHigh }]}>{title}</Text>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <Text style={[styles.subtitle, { color: colors.onSurfaceHigh }]}>{subtitle}</Text>
            ) : (
              subtitle
            )
          )}
          {meta && (
            <Text style={[styles.meta, { color: colors.onSurfaceMed }]}>{meta}</Text>
          )}
        </View>
        <View style={styles.avatarContainer}>
          <ProfileAvatar size={40} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    marginRight: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600', // semibold
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
  },
});
