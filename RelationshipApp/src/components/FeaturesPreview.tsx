import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const SCORE_DIMENSIONS: Array<{ label: string; value: string }> = [
  { label: 'Harmony', value: '87' },
  { label: 'Passion', value: '72' },
  { label: 'Connection', value: '91' },
  { label: 'Stability', value: '65' },
  { label: 'Growth', value: '65' },
];

const PEOPLE_CHIPS = ['Partner', 'Crush', 'Ex', 'Friend'];

const ASK_PREVIEWS = [
  {
    question: '“Why do I keep attracting emotionally unavailable people?”',
    answer:
      "Your Venus in Libra craves partnership but Saturn conjunct your descendant creates a pattern where you're drawn to people who mirror that restriction and the key is noticing when",
  },
  {
    question:
      "“We have a lot of fun together but sometimes I feel we don't have as many intimate or authentic moments as I would like in a partner....”",
    answer:
      'There may be real chemistry and ease here, but the chart can still show where depth gets deferred, especially if playfulness is stronger than emotional exposure or sustained vulnerability.',
  },
  {
    question:
      '“What can you tell me about my Moon being opposite his Mercury, does this mean we will have communication problems?”',
    answer:
      'That aspect can create a real mismatch between feeling and language, but it does not automatically mean failure. Iris would help separate emotional timing issues from actual incompatibility.',
  },
] as const;

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      contentContainerStyle={styles.askCarousel}
    >
      {ASK_PREVIEWS.map((preview, index) => (
        <View
          key={preview.question}
          style={[
            styles.askPreview,
            { backgroundColor: colors.surfaceHigh },
            index === ASK_PREVIEWS.length - 1 && styles.askPreviewLast,
          ]}
        >
          <Text style={[styles.askQuestion, { color: colors.textMuted }]}>
            {preview.question}
          </Text>
          <Text style={[styles.askAnswer, { color: colors.primary }]} numberOfLines={4}>
            {preview.answer}
          </Text>
        </View>
      ))}
    </ScrollView>
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
          There&apos;s more to your story
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.cards}>
        <FeatureCard
          icon="✧"
          iconBackground="rgba(202, 190, 255, 0.14)"
          title="5-Dimension Compatibility Scores"
          description="See exactly where the spark is — and where it isn't — across Harmony, Passion, Connection, Stability, and Growth."
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
          title="Ask Iris"
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

  askCarousel: {
    paddingRight: 4,
  },
  askPreview: {
    width: 232,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginRight: 10,
  },
  askPreviewLast: {
    marginRight: 0,
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
    width: '48%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 12,
    paddingLeft: 10,
    paddingRight: 12,
  },
  chipPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 195, 73, 0.18)',
  },
  chipPlusGlyph: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
