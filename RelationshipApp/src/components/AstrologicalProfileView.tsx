import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { IdentityBlock } from './IdentityBlock';
import { PlacementRow } from './PlacementRow';
import { AspectOverviewCard } from './AspectOverviewCard';
import { AskIrisCard, type AskIrisCardCopy } from './AskIrisCard';
import { BirthChartComingSoonCard } from './BirthChartComingSoonCard';
import type { AskMessage } from '../store';
import type { PlacementDetail } from '../utils/placements';
import {
  getAscendantDegree,
  getAspectsForPlacementKey,
  summarizeAspectCounts,
  type PlacementAspect,
} from '../utils/placementAspects';

export type AstrologicalProfileVariant = 'self' | 'subject' | 'celebrity';
export type AstrologicalProfileTab = 'reading' | 'chart';

interface ChartSource {
  birthChart?: unknown;
}

interface AstrologicalProfileViewProps {
  variant: AstrologicalProfileVariant;
  name: string;
  sun: string | null;
  moon: string | null;
  rising: string | null;
  // The subject/profile/celebrity record. Only `birthChart` is required by
  // this component, but we accept the whole record so callers don't have to
  // narrow it themselves.
  source: ChartSource | null | undefined;
  placements: PlacementDetail[];
  // The long romantic narrative (what the mock calls the Celestial Blueprint).
  overview: string;
  // What sits above the avatar — eyebrow text like "YOUR ROMANTIC PROFILE" /
  // "YOUR PERSON" / "CELEBRITY". Optional.
  eyebrow?: string;
  // Optional UI to render above the identity block (back button, edit/delete
  // affordances on subject/celeb screens, etc.).
  headerSlot?: React.ReactNode;
  // Replaces the default IdentityBlock (avatar + name + 3 chips). Subject and
  // celebrity screens use this to bring their existing hero (photo, date,
  // place, extra chips) without losing the rest of the view.
  identityOverride?: React.ReactNode;
  // Ask Iris configuration. Optional — when omitted the Ask Iris cards on
  // both tabs are skipped (e.g. subject/celebrity screens that don't yet have
  // a per-subject Ask thread wired up).
  askCopy?: AskIrisCardCopy;
  lastUserMessage?: AskMessage | null;
  lastIrisMessage?: AskMessage | null;
  onPressAsk?: (prefill?: string) => void;
  // Chart tab actions.
  onPressViewFullChart?: () => void;
  // Initial tab to show; defaults to "reading".
  initialTab?: AstrologicalProfileTab;
  contentContainerStyle?: ViewStyle;
}

const TAB_LABELS: Record<AstrologicalProfileTab, string> = {
  reading: 'Reading',
  chart: 'Chart',
};

export function AstrologicalProfileView({
  variant,
  name,
  sun,
  moon,
  rising,
  source,
  placements,
  overview,
  eyebrow,
  headerSlot,
  identityOverride,
  askCopy,
  lastUserMessage = null,
  lastIrisMessage = null,
  onPressAsk,
  onPressViewFullChart,
  initialTab = 'reading',
  contentContainerStyle,
}: AstrologicalProfileViewProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<AstrologicalProfileTab>(initialTab);

  const placementsWithAspects = useMemo(
    () =>
      placements.map((placement) => ({
        placement,
        aspects: getAspectsForPlacementKey(source ?? null, placement.key),
      })),
    [placements, source]
  );

  const aspectCounts = useMemo(() => summarizeAspectCounts(source ?? null), [source]);
  const totalAspects = aspectCounts.support + aspectCounts.tension + aspectCounts.fusion;
  const ascendantDegree = useMemo(() => getAscendantDegree(source ?? null), [source]);

  const sectionLabel = (label: string) => (
    <Text style={[styles.sectionLabel, { color: colors.accent }]}>{label}</Text>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {headerSlot ? <View style={styles.headerSlot}>{headerSlot}</View> : null}

      {identityOverride ?? (
        <IdentityBlock name={name} sun={sun} moon={moon} rising={rising} />
      )}

      <View
        style={[
          styles.tabBar,
          { backgroundColor: 'rgba(255, 255, 255, 0.025)' },
        ]}
      >
        {(['reading', 'chart'] as AstrologicalProfileTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                isActive && {
                  backgroundColor: 'rgba(202, 190, 255, 0.13)',
                  borderColor: 'rgba(202, 190, 255, 0.30)',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.text : colors.textSubtle },
                ]}
              >
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'reading' ? (
        <View style={styles.tabContent}>
          {eyebrow ? sectionLabel(eyebrow) : null}
          <Text style={[styles.title, { color: colors.text }]}>Celestial Blueprint</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {variant === 'self'
              ? 'Your Romantic and Intimate Nature'
              : `${name}'s Romantic and Intimate Nature`}
          </Text>

          <View
            style={[
              styles.overviewCard,
              { backgroundColor: colors.surfaceLow },
            ]}
          >
            <Text style={[styles.overviewText, { color: colors.text }]}>{overview}</Text>
          </View>

          {askCopy && onPressAsk ? (
            <AskIrisCard
              copy={askCopy}
              lastUserMessage={lastUserMessage}
              lastIrisMessage={lastIrisMessage}
              onPressInput={onPressAsk}
              onPressContinue={() => onPressAsk()}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.tabContent}>
          {onPressViewFullChart ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPressViewFullChart}
              style={[
                styles.fullChartCard,
                { backgroundColor: colors.surfaceLow },
              ]}
            >
              <View
                style={[
                  styles.fullChartIcon,
                  { backgroundColor: 'rgba(202, 190, 255, 0.10)' },
                ]}
              >
                <Text style={[styles.fullChartGlyph, { color: colors.primary }]}>◯</Text>
              </View>
              <View style={styles.fullChartText}>
                <Text style={[styles.fullChartTitle, { color: colors.text }]}>
                  View birth chart
                </Text>
                <Text style={[styles.fullChartSubtitle, { color: colors.textMuted }]}>
                  Full wheel with all planets, houses, and aspect lines
                </Text>
              </View>
              <Text style={[styles.fullChartChev, { color: colors.textSubtle }]}>›</Text>
            </TouchableOpacity>
          ) : (
            <BirthChartComingSoonCard />
          )}

          {sectionLabel(
            variant === 'self' ? 'Romantic Placements' : `${name}'s Romantic Placements`
          )}
          <Text style={[styles.placementsSub, { color: colors.textMuted }]}>
            {variant === 'self'
              ? 'The planets that shape how you love, desire, and connect. Tap any placement to read more and see its aspects.'
              : `The planets that shape how ${name} loves, desires, and connects. Tap any placement to read more and see its aspects.`}
          </Text>

          <View style={styles.placementsList}>
            {placementsWithAspects.map(({ placement, aspects }) => (
              <PlacementRow
                key={placement.key}
                placement={placement}
                aspects={aspects as PlacementAspect[]}
                ascendantDegree={ascendantDegree}
              />
            ))}
          </View>

          {totalAspects > 0 ? (
            <View style={styles.aspectOverviewBlock}>
              {sectionLabel('Aspect Overview')}
              <AspectOverviewCard counts={aspectCounts} />
            </View>
          ) : null}

          {askCopy && onPressAsk ? (
            <AskIrisCard
              copy={askCopy}
              lastUserMessage={lastUserMessage}
              lastIrisMessage={lastIrisMessage}
              onPressInput={onPressAsk}
              onPressContinue={() => onPressAsk()}
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 16,
  },
  headerSlot: {
    marginBottom: -4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    gap: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  overviewCard: {
    borderRadius: 22,
    padding: 22,
  },
  overviewText: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  fullChartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  fullChartIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullChartGlyph: {
    fontSize: 22,
  },
  fullChartText: {
    flex: 1,
    gap: 3,
  },
  fullChartTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  fullChartSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  fullChartChev: {
    fontSize: 18,
  },
  placementsSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    marginTop: -8,
  },
  placementsList: {
    gap: 10,
  },
  aspectOverviewBlock: {
    gap: 10,
    marginTop: 4,
  },
});
