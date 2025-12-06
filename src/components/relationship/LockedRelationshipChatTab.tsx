import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface LockedRelationshipChatTabProps {
  userAName?: string;
  userBName?: string;
}

const LockedRelationshipChatTab: React.FC<LockedRelationshipChatTabProps> = ({ userAName, userBName }) => {
  const { colors } = useTheme();

  const relationshipLabel = userAName && userBName
    ? `${userAName} & ${userBName}'s`
    : 'this';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Lock Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Ask Stellium
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Complete Full Analysis Required
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          Complete the Full Relationship Analysis for {relationshipLabel} relationship to unlock Ask Stellium and ask personalized questions about the relationship dynamics.
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Ask custom questions about the relationship
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              AI-powered compatibility insights
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Deep dive into synastry aspects
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
});

export default LockedRelationshipChatTab;
