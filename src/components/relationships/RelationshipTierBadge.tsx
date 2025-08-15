import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface RelationshipTierBadgeProps {
  tier?: string;
  level: 'complete' | 'scores' | 'none';
}

const RelationshipTierBadge: React.FC<RelationshipTierBadgeProps> = ({ tier, level }) => {
  const { colors } = useTheme();

  if (level === 'none') {
    return null;
  }

  const getTierStyle = (tierName: string | undefined) => {
    if (!tierName) {
      return {
        backgroundColor: colors.surfaceVariant,
        color: colors.onSurfaceVariant,
      };
    }

    // Define tier-specific colors
    switch (tierName.toLowerCase()) {
      case 'transcendent':
        return {
          backgroundColor: '#8B5FBF',
          color: '#FFFFFF',
        };
      case 'profound':
        return {
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
        };
      case 'harmonious':
        return {
          backgroundColor: '#10B981',
          color: '#FFFFFF',
        };
      case 'challenging':
        return {
          backgroundColor: '#F59E0B',
          color: '#FFFFFF',
        };
      case 'dynamic':
        return {
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: colors.onPrimary,
        };
    }
  };

  const tierStyle = getTierStyle(tier);

  return (
    <View style={[styles.badge, { backgroundColor: tierStyle.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: tierStyle.color }]}>
        {tier || 'Analysis Available'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default RelationshipTierBadge;
