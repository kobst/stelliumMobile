import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const SCORE_DIMENSIONS: Array<{ label: string; value: string }> = [
  { label: 'Emotional', value: '87' },
  { label: 'Mental', value: '72' },
  { label: 'Physical', value: '91' },
  { label: 'Growth', value: '65' },
  { label: 'Destiny', value: '78' },
];

const PEOPLE_CHIPS = ['Partner', 'Crush', 'Ex', 'Friend'];

interface FeatureCardProps {
  icon: string;
  iconBackground: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function FeatureCard({
  icon,
  iconBackground,
  title,
  description,
  children,
}: FeatureCardProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceLow, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBadge, { backgroundColor: iconBackground }]}>
          <Text style={styles.iconGlyph}>{icon}</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{description}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ScoreStrip(): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.scoreStrip}>
      {SCORE_DIMENSIONS.map((dim) => (
        <View
          key={dim.label}
          style={[styles.scorePill, { backgroundColor: colors.surfaceHigh }]}
        >
          <Text style={[styles.scoreValue, { color: colors.primary }]}>{dim.value}</Text>
          <Text style={[styles.scoreLabel, { color: colors.textSubtle }]}>{dim.label}</Text>
        </View>
      ))}
    </View>
  );
}

function AskPreview(): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={[styles.askPreview, { backgroundColor: colors.surfaceHigh }]}>
      <Text style={[styles.askQuestion, { color: colors.textMuted }]}>
        &ldquo;Why do I keep attracting emotionally unavailable people?&rdquo;
      </Text>
      <Text style={[styles.askAnswer, { color: colors.primary }]} numberOfLines={3}>
        Your Venus in Libra craves partnership but Saturn conjunct your descendant creates a
        pattern where you&apos;re drawn to people who mirror that restriction and the key is
        noticing when
      </Text>
    </View>
  );
}

function PeopleChips(): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.peopleChips}>
      {PEOPLE_CHIPS.map((label) => (
        <View
          key={label}
          style={[styles.peopleChip, { borderColor: colors.ghostBorder }]}
        >
          <View style={styles.chipPlus}>
            <Text style={[styles.chipPlusGlyph, { color: colors.accent }]}>+</Text>
          </View>
          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function FeaturesPreview(): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>
          Unlock Your Full Reading
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.cards}>
        <FeatureCard
          icon="✧"
          iconBackground="rgba(202, 190, 255, 0.14)"
          title="5-Dimension Compatibility Scores"
          description="See exactly where the spark is — and where it isn't — across emotional, mental, physical, growth, and destiny."
        >
          <ScoreStrip />
        </FeatureCard>

        <FeatureCard
          icon="◈"
          iconBackground="rgba(233, 195, 73, 0.18)"
          title="Full Synastry & Composite Reports"
          description="Deep analysis of how your charts interact — and the chemistry of the relationship entity you create together."
        />

        <FeatureCard
          icon="✦"
          iconBackground="rgba(0, 220, 229, 0.14)"
          title="Ask Stellium Anything"
          description="Your AI astrologer. Ask any question about any relationship and get answers grounded in your actual chart."
        >
          <AskPreview />
        </FeatureCard>

        <FeatureCard
          icon="❋"
          iconBackground="rgba(255, 180, 171, 0.14)"
          title="Add Anyone In Your Life"
          description="Run full reports on real relationships — not just celebrities."
        >
          <PeopleChips />
        </FeatureCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 28,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cards: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 20,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
  },

  scoreStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  scorePill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: '700',
    opacity: 0.28,
  },
  scoreLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },

  askPreview: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  askQuestion: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  askAnswer: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.28,
  },

  peopleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  peopleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 100,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
  },
  chipPlus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 195, 73, 0.18)',
  },
  chipPlusGlyph: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
