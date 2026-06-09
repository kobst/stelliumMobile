import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

interface RelationshipEmptyStateProps {
  onAddFirstConnection: () => void;
}

export function RelationshipEmptyState({
  onAddFirstConnection,
}: RelationshipEmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Text style={[styles.iconGlyph, { color: colors.primary }]}>♡</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>No connections yet</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Add someone from your life or pick a celebrity to see how your charts interact.
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onAddFirstConnection}
        style={[styles.cta, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
          + Add your first connection
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 36,
    gap: 16,
  },
  iconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(202, 190, 255, 0.12)',
  },
  iconGlyph: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  cta: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
