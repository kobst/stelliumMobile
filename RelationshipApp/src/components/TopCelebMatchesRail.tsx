import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import type { TopCelebMatch } from '../../../shared/api/onboarding';

interface Props {
  title?: string;
  subtitle?: string;
  matches: TopCelebMatch[];
}

const CLUSTERS: Array<keyof NonNullable<TopCelebMatch['clusterScores']>> = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
  'overall',
];

function initials(name: string | null): string {
  if (!name) {
    return '?';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const TopCelebMatchesRail: React.FC<Props> = ({
  title = 'Your Chart in the Wild',
  subtitle,
  matches,
}) => {
  const { colors } = useTheme();

  if (matches.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {title || subtitle ? (
        <View style={styles.header}>
          {title ? (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {matches.map((match) => (
          <View
            key={match.key}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {match.profilePhotoUrl ? (
              <Image source={{ uri: match.profilePhotoUrl }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photoFallback, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.photoFallbackText, { color: colors.textMuted }]}>
                  {initials(match.celebName)}
                </Text>
              </View>
            )}

            <View style={styles.cardBody}>
              <Text style={[styles.aspectLabel, { color: colors.accent }]} numberOfLines={1}>
                {match.selectedAspect.label}
              </Text>
              <Text style={[styles.celebName, { color: colors.text }]} numberOfLines={1}>
                {match.celebName ?? 'Unknown'}
              </Text>
              {match.archetype?.label ? (
                <Text style={[styles.archetype, { color: colors.primary }]} numberOfLines={1}>
                  {match.archetype.label}
                </Text>
              ) : null}
              <Text style={[styles.annotation, { color: colors.textMuted }]} numberOfLines={3}>
                {match.annotation?.sentence ??
                  match.selectedAspect.annotation?.sentence ??
                  match.selectedAspect.shortMeaning ??
                  'Shared chart themes worth exploring.'}
              </Text>

              <View
                style={[
                  styles.scoreStrip,
                  { backgroundColor: colors.surfaceHigh, borderColor: colors.ghostBorder },
                ]}
              >
                {CLUSTERS.slice(0, 5).map((cluster, index) => (
                  <View
                    key={cluster}
                    style={[
                      styles.scoreCell,
                      index < 4 && {
                        borderRightWidth: StyleSheet.hairlineWidth,
                        borderRightColor: colors.ghostBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.scoreValue, { color: colors.text }]}>
                      {typeof match.clusterScores?.[cluster] === 'number'
                        ? Math.round(match.clusterScores[cluster] as number)
                        : '--'}
                    </Text>
                    <Text style={[styles.scoreLabel, { color: colors.textSubtle }]} numberOfLines={1}>
                      {cluster}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    gap: 14,
    paddingRight: 20,
  },
  card: {
    width: 256,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 180,
  },
  photoFallback: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    fontSize: 32,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  aspectLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  celebName: {
    fontSize: 20,
    fontWeight: '700',
  },
  archetype: {
    fontSize: 14,
    fontWeight: '600',
  },
  annotation: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 54,
  },
  scoreStrip: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  scoreCell: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
