import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface SectionSubtitleProps {
  icon: string;
  title: string;
  desc: string;
}

export const SectionSubtitle: React.FC<SectionSubtitleProps> = ({ icon, title, desc }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceCard }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.accentPrimary }]}>{title}</Text>
          <Text style={[styles.desc, { color: colors.onSurfaceMed }]}>{desc}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.strokeSubtle }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600', // semibold
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
});