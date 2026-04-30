import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import { RelationshipHoroscopeCard } from './RelationshipHoroscopeCard';
import { SectionLabel } from './SectionLabel';

interface ThisWeekTogetherSectionProps {
  relationships: UserCompositeChart[];
  selfProfileId: string | null;
  maxCards?: number;
  onPressCard?: (relationship: UserCompositeChart) => void;
}

function recencyTimestamp(relationship: UserCompositeChart): number {
  const value = relationship.updatedAt ?? relationship.createdAt;
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function ThisWeekTogetherSection({
  relationships,
  selfProfileId,
  maxCards = 5,
  onPressCard,
}: ThisWeekTogetherSectionProps) {
  const { colors } = useTheme();

  const ranked = useMemo(() => {
    return [...relationships]
      .sort((a, b) => recencyTimestamp(b) - recencyTimestamp(a))
      .slice(0, maxCards);
  }, [relationships, maxCards]);

  if (ranked.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerBlock}>
        <SectionLabel>This Week Together</SectionLabel>
        <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
          Horoscopes for your active connections
        </Text>
      </View>
      <View style={styles.cardStack}>
        {ranked.map((relationship) => (
          <RelationshipHoroscopeCard
            key={relationship._id}
            relationship={relationship}
            selfProfileId={selfProfileId}
            onPress={onPressCard ? () => onPressCard(relationship) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  headerBlock: {
    gap: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  cardStack: {
    gap: 10,
  },
});
