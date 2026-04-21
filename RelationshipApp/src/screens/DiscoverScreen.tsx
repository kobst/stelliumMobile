import React from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { celebritiesApi, Celebrity } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import {
  celebrityToSubject,
  getBigThree,
  getCelebritySunSign,
  getRelationshipArchetypeLabel,
} from '../utils/mainShell';
import { Avatar } from '../components/Avatar';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { useOwnedSubjects } from '../hooks/useOwnedSubjects';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { buildHistorySelectionState } from './historySelection';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';
import type { UserCompositeChart } from '../../../shared/api/relationships';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type PlacementFilter = 'all' | 'venus' | 'mars' | 'element';

type CelebPlanet = { name?: string; sign?: string | null };

type ElementLabel = 'Fire' | 'Earth' | 'Air' | 'Water';

const SIGNS: string[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const ELEMENTS: ElementLabel[] = ['Fire', 'Earth', 'Air', 'Water'];

const ELEMENT_BY_SIGN: Record<string, ElementLabel> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

// STUB: Collections are hardcoded celeb-id bundles until backend exposes a curation endpoint.
// See the spec request attached to this screen: we need a GET /discover/collections API.
const STUB_COLLECTIONS: Array<{
  id: string;
  title: string;
  description: string;
  pickPredicate: (celeb: Celebrity) => boolean;
  accent: 'lavender' | 'coral';
}> = [
  {
    id: 'col-water',
    title: 'Emotional depth',
    description: 'Heavy water sign charts — intensity, intuition, and emotional undercurrents.',
    pickPredicate: (celeb) => getCelebrityElement(celeb) === 'Water',
    accent: 'lavender',
  },
  {
    id: 'col-fire',
    title: 'Creative fire',
    description: 'Dominant fire placements — artists and performers who lead with instinct.',
    pickPredicate: (celeb) => getCelebrityElement(celeb) === 'Fire',
    accent: 'coral',
  },
];

function getCelebPlanets(celeb: Celebrity): CelebPlanet[] {
  const planets = (celeb.birthChart as { planets?: CelebPlanet[] } | undefined)?.planets;
  return Array.isArray(planets) ? planets : [];
}

function getCelebPlanetSign(celeb: Celebrity, planet: string): string | null {
  const match = getCelebPlanets(celeb).find((p) => p.name === planet);
  return typeof match?.sign === 'string' ? match.sign : null;
}

function getCelebrityElement(celeb: Celebrity): ElementLabel | null {
  const sun = getCelebritySunSign(celeb);
  if (!sun) return null;
  return ELEMENT_BY_SIGN[sun] ?? null;
}

function celebMatchesQuery(celeb: Celebrity, query: string): boolean {
  const q = query.toLowerCase();
  const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.toLowerCase();
  if (fullName.includes(q)) return true;
  const sun = getCelebritySunSign(celeb)?.toLowerCase();
  if (sun && sun.includes(q)) return true;
  const venus = getCelebPlanetSign(celeb, 'Venus')?.toLowerCase();
  if (venus && venus.includes(q)) return true;
  const mars = getCelebPlanetSign(celeb, 'Mars')?.toLowerCase();
  if (mars && mars.includes(q)) return true;
  const moon = getCelebPlanetSign(celeb, 'Moon')?.toLowerCase();
  if (moon && moon.includes(q)) return true;
  return false;
}

function subjectMatchesQuery(subject: OwnedGuestSubject, query: string): boolean {
  const q = query.toLowerCase();
  const fullName = `${subject.firstName ?? ''} ${subject.lastName ?? ''}`.toLowerCase();
  return fullName.includes(q);
}

function findRelationshipForSubject(
  subject: OwnedGuestSubject,
  history: readonly UserCompositeChart[],
  selfProfileId: string | null
): UserCompositeChart | null {
  const lowerFullName = [subject.firstName, subject.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();
  for (const row of history) {
    if (row.userA_id === subject._id || row.userB_id === subject._id) return row;
    const a = row.userA_name?.trim().toLowerCase() ?? '';
    const b = row.userB_name?.trim().toLowerCase() ?? '';
    const selfOwns =
      row.userA_id === selfProfileId || row.userB_id === selfProfileId;
    if (selfOwns && lowerFullName && (a === lowerFullName || b === lowerFullName)) {
      return row;
    }
  }
  return null;
}

export const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);

  const { ownedSubjects } = useOwnedSubjects();
  const { relationshipHistory } = useRelationshipHistory();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [placementFilter, setPlacementFilter] = React.useState<PlacementFilter>('all');
  const [allCelebs, setAllCelebs] = React.useState<Celebrity[]>([]);
  const [searchResults, setSearchResults] = React.useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { sun } = getBigThree(profile);
  const trimmedSearchQuery = searchQuery.trim();
  const isSearchMode = trimmedSearchQuery.length >= 2;
  const isPlacementMode = placementFilter !== 'all' && !isSearchMode;
  const showSearchHint = trimmedSearchQuery.length > 0 && trimmedSearchQuery.length < 2;

  const startCelebrityFlow = React.useCallback(
    (celebrity?: Celebrity) => {
      clearActiveRelationshipFlow();
      setActiveTargetType('celebrity');
      setActiveTargetSubject(celebrity ? celebrityToSubject(celebrity) : null);
      navigation.navigate('SelectCelebrity');
    },
    [clearActiveRelationshipFlow, navigation, setActiveTargetSubject, setActiveTargetType]
  );

  const openExistingRelationship = React.useCallback(
    (relationship: UserCompositeChart) => {
      const selectionState = buildHistorySelectionState(relationship);
      setActivePartnerRomanticAssets(null);
      setPreviewAnalysis(selectionState.previewAnalysis);
      setActiveRelationshipId(relationship._id);
      setFullAnalysis(selectionState.fullAnalysis);
      setWorkflowState({
        workflowStatus: null,
        workflowPhase: selectionState.workflowPhase,
        workflowError: null,
      });
      navigation.navigate('RelationshipPreview');
    },
    [
      navigation,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setFullAnalysis,
      setPreviewAnalysis,
      setWorkflowState,
    ]
  );

  const handleUserSubjectTap = React.useCallback(
    (subject: OwnedGuestSubject) => {
      const relationship = findRelationshipForSubject(subject, relationshipHistory, selfProfileId);
      if (relationship) {
        openExistingRelationship(relationship);
        return;
      }
      // STUB: Connecting an existing subject to the self profile should live on a dedicated
      // "connect" action; for now we fall back to the add-connection fork which already
      // hosts the "connect existing subject" path.
      clearActiveRelationshipFlow();
      navigation.navigate('AddConnection');
    },
    [
      clearActiveRelationshipFlow,
      navigation,
      openExistingRelationship,
      relationshipHistory,
      selfProfileId,
    ]
  );

  React.useEffect(() => {
    let cancelled = false;

    const loadDiscovery = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: 1,
          limit: 60,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        if (cancelled || !('data' in response)) {
          return;
        }

        setAllCelebs(response.data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Could not load discovery right now.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDiscovery().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!trimmedSearchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: 1,
          limit: 20,
          search: trimmedSearchQuery,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        if (!cancelled && 'data' in response) {
          setSearchResults(response.data);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [trimmedSearchQuery]);

  // STUB: "Charts Like Yours" currently shallow-filters by Sun sign on the already-loaded page.
  // The real data should be `profile.topCelebMatches` (currently rendered on Home) or a
  // dedicated ranked-similar-charts endpoint. Spec item #1.
  const chartsLikeYours = React.useMemo(() => {
    if (!sun) return [];
    return allCelebs.filter((c) => getCelebritySunSign(c) === sun).slice(0, 4);
  }, [allCelebs, sun]);

  // STUB: client-side "Recently Added" — we don't know if /getCelebs supports
  // sortBy=createdAt. Falling back to last N of the current page.
  const recentlyAdded = React.useMemo(() => allCelebs.slice(-6).reverse(), [allCelebs]);

  const unifiedSearchRows = React.useMemo(() => {
    if (!isSearchMode) return { subjectMatches: [] as OwnedGuestSubject[], celebMatches: [] as Celebrity[] };
    const subjectMatches = ownedSubjects.filter((s) => subjectMatchesQuery(s, trimmedSearchQuery));
    // Prefer server-returned celeb results; fall back to client-side match across loaded page
    // so placement keywords ("Scorpio", "Venus in…") still return hits even when the server
    // only searches by name. Spec item #5.
    const celebMatches =
      searchResults.length > 0
        ? searchResults
        : allCelebs.filter((c) => celebMatchesQuery(c, trimmedSearchQuery));
    return { subjectMatches, celebMatches };
  }, [allCelebs, isSearchMode, ownedSubjects, searchResults, trimmedSearchQuery]);

  const placementGroups = React.useMemo(() => {
    if (!isPlacementMode) return [] as Array<{ label: string; items: Celebrity[] }>;
    if (placementFilter === 'element') {
      return ELEMENTS.map((el) => ({
        label: `${el} signs`,
        items: allCelebs.filter((c) => getCelebrityElement(c) === el),
      })).filter((g) => g.items.length > 0);
    }
    const planetName = placementFilter === 'venus' ? 'Venus' : 'Mars';
    return SIGNS.map((sign) => ({
      label: `${planetName} in ${sign}`,
      items: allCelebs.filter((c) => getCelebPlanetSign(c, planetName) === sign),
    })).filter((g) => g.items.length > 0);
  }, [allCelebs, isPlacementMode, placementFilter]);

  // ── Row/card renderers ──────────────────────────────────────────────────────

  const renderCelebRow = (celeb: Celebrity, eyebrow?: string) => {
    const photoUri = celeb.profilePhotoUrl ?? celeb.photoUrl ?? null;
    const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.trim();
    const initial = celeb.firstName?.charAt(0) ?? '?';
    const sunSign = getCelebritySunSign(celeb) ?? '—';
    const venusSign = getCelebPlanetSign(celeb, 'Venus') ?? '—';
    return (
      <TouchableOpacity
        key={`row-${celeb._id}`}
        onPress={() => startCelebrityFlow(celeb)}
        activeOpacity={0.86}
        style={[styles.listRow, { borderBottomColor: colors.ghostBorder }]}
      >
        <Avatar size={44} gradient="gold" photoUri={photoUri} fallbackInitial={initial} />
        <View style={styles.listRowBody}>
          <View style={styles.listRowNameRow}>
            <Text style={[styles.listRowName, { color: colors.text }]} numberOfLines={1}>
              {fullName || 'Unknown'}
            </Text>
            {eyebrow ? (
              <View style={[styles.pill, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>{eyebrow}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.listRowMeta, { color: colors.textMuted }]}>
            {sunSign} Sun · {venusSign} Venus
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderUserRow = (subject: OwnedGuestSubject) => {
    const relationship = findRelationshipForSubject(subject, relationshipHistory, selfProfileId);
    const initial = subject.firstName?.charAt(0) ?? '?';
    const photoUri = subject.profilePhotoUrl ?? null;
    const fullName = [subject.firstName, subject.lastName].filter(Boolean).join(' ').trim();
    const archetype = relationship ? getRelationshipArchetypeLabel(relationship) : null;
    return (
      <TouchableOpacity
        key={`user-${subject._id}`}
        onPress={() => handleUserSubjectTap(subject)}
        activeOpacity={0.86}
        style={[styles.listRow, { borderBottomColor: colors.ghostBorder }]}
      >
        <View>
          <Avatar size={44} gradient="green" photoUri={photoUri} fallbackInitial={initial} />
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: relationship ? colors.success : colors.textSubtle,
                borderColor: colors.surfaceLow,
              },
            ]}
          />
        </View>
        <View style={styles.listRowBody}>
          <View style={styles.listRowNameRow}>
            <Text style={[styles.listRowName, { color: colors.text }]} numberOfLines={1}>
              {fullName || 'Your person'}
            </Text>
            <View style={[styles.pill, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.pillText, { color: colors.accent }]}>Your person</Text>
            </View>
          </View>
          <Text style={[styles.listRowMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {archetype ? archetype : 'Not connected yet'}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderMiniCelebCard = (celeb: Celebrity) => {
    const photoUri = celeb.profilePhotoUrl ?? celeb.photoUrl ?? null;
    const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.trim();
    const sunSign = getCelebritySunSign(celeb) ?? '—';
    return (
      <TouchableOpacity
        key={`mini-${celeb._id}`}
        onPress={() => startCelebrityFlow(celeb)}
        activeOpacity={0.86}
        style={styles.miniCard}
      >
        <View style={[styles.miniPhotoWrap, { backgroundColor: colors.surface }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.miniPhoto} resizeMode="cover" />
          ) : (
            <View style={[styles.miniPhotoFallback, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.miniFallbackInitial, { color: colors.textMuted }]}>
                {celeb.firstName?.charAt(0) ?? '?'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={1}>
          {fullName || 'Unknown'}
        </Text>
        <Text style={[styles.miniMeta, { color: colors.textMuted }]} numberOfLines={1}>
          {sunSign} Sun
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChartsLikeYoursCard = (celeb: Celebrity) => {
    const photoUri = celeb.profilePhotoUrl ?? celeb.photoUrl ?? null;
    const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.trim();
    const initial = celeb.firstName?.charAt(0) ?? '?';
    const sunSign = getCelebritySunSign(celeb);
    const venusSign = getCelebPlanetSign(celeb, 'Venus');
    const blurb = celeb.romanticProfileBlurb?.trim() || null;
    return (
      <TouchableOpacity
        key={`like-${celeb._id}`}
        onPress={() => startCelebrityFlow(celeb)}
        activeOpacity={0.86}
        style={[styles.likeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Avatar size={52} gradient="gold" photoUri={photoUri} fallbackInitial={initial} />
        <View style={styles.likeCardBody}>
          <Text style={[styles.likeCardName, { color: colors.text }]} numberOfLines={1}>
            {fullName || 'Unknown'}
          </Text>
          <View style={styles.likeCardPills}>
            {sunSign ? (
              <View style={[styles.placementPill, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.placementPillText, { color: colors.primary }]}>
                  {sunSign} Sun
                </Text>
              </View>
            ) : null}
            {venusSign ? (
              <View style={[styles.placementPill, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.placementPillText, { color: colors.primary }]}>
                  {venusSign} Venus
                </Text>
              </View>
            ) : null}
          </View>
          {blurb ? (
            <Text style={[styles.likeCardBlurb, { color: colors.textMuted }]} numberOfLines={2}>
              {blurb}
            </Text>
          ) : null}
          <Text style={[styles.inlineAction, { color: colors.accent }]}>See your connection</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCollection = (collection: (typeof STUB_COLLECTIONS)[number]) => {
    const items = allCelebs.filter(collection.pickPredicate).slice(0, 8);
    if (items.length === 0) return null;
    const accentColor = collection.accent === 'lavender' ? colors.primary : colors.accent;
    const accentBg = collection.accent === 'lavender' ? colors.surfaceHigh : colors.surfaceHigh;
    return (
      <View key={collection.id} style={[styles.collectionCard, { backgroundColor: accentBg, borderColor: colors.border }]}>
        <Text style={[styles.collectionEyebrow, { color: accentColor }]}>Collection</Text>
        <Text style={[styles.collectionTitle, { color: colors.text }]}>{collection.title}</Text>
        <Text style={[styles.collectionBody, { color: colors.textMuted }]}>{collection.description}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.miniRail}
        >
          {items.map(renderMiniCelebCard)}
        </ScrollView>
      </View>
    );
  };

  const renderPlacementChip = (value: PlacementFilter, label: string) => {
    const active = placementFilter === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() => {
          setPlacementFilter(active ? 'all' : value);
          setSearchQuery('');
        }}
        activeOpacity={0.85}
        style={[
          styles.chip,
          {
            backgroundColor: active ? colors.surfaceHigh : colors.surface,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? colors.primary : colors.textMuted }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Discover</Text>
          <Text style={[styles.title, { color: colors.text }]}>Explore charts.</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Browse by placement, explore collections, or search anyone in the database.
          </Text>
        </View>

        <View style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim()) setPlacementFilter('all');
            }}
            placeholder="Search by name, sign, or placement"
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
          />
          {isSearching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {renderPlacementChip('all', 'All')}
          {renderPlacementChip('venus', 'By Venus')}
          {renderPlacementChip('mars', 'By Mars')}
          {renderPlacementChip('element', 'By element')}
        </ScrollView>

        {showSearchHint ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Type at least 2 characters to search.
            </Text>
          </View>
        ) : null}

        {/* SEARCH RESULTS ───────────────────────────────── */}
        {isSearchMode ? (
          <View style={styles.section}>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              {isSearching
                ? 'Searching…'
                : `${unifiedSearchRows.subjectMatches.length + unifiedSearchRows.celebMatches.length} result${
                    unifiedSearchRows.subjectMatches.length + unifiedSearchRows.celebMatches.length === 1
                      ? ''
                      : 's'
                  } for "${trimmedSearchQuery}"`}
            </Text>
            {unifiedSearchRows.subjectMatches.map(renderUserRow)}
            {unifiedSearchRows.celebMatches.map((c) => renderCelebRow(c))}
            {!isSearching &&
            unifiedSearchRows.subjectMatches.length === 0 &&
            unifiedSearchRows.celebMatches.length === 0 ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  No results for "{trimmedSearchQuery}".
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* PLACEMENT BROWSE ──────────────────────────────── */}
        {isPlacementMode ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {placementFilter === 'venus'
                ? 'By Venus sign'
                : placementFilter === 'mars'
                ? 'By Mars sign'
                : 'By element'}
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              Browse charts grouped by {placementFilter === 'element' ? 'element' : placementFilter}.
            </Text>
            {placementGroups.map((group) => (
              <View key={group.label} style={styles.placementGroup}>
                <Text style={[styles.placementGroupLabel, { color: colors.text }]}>
                  {group.label} <Text style={{ color: colors.textMuted }}>({group.items.length})</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.miniRail}
                >
                  {group.items.map(renderMiniCelebCard)}
                </ScrollView>
              </View>
            ))}
            {placementGroups.length === 0 && !isLoading ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  No placement data available yet. Server-side placement filtering is pending.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* DEFAULT VIEW ───────────────────────────────────── */}
        {!isSearchMode && !isPlacementMode ? (
          <>
            {ownedSubjects.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your People</Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  People you've added to Iris.
                </Text>
                <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {ownedSubjects.map(renderUserRow)}
                </View>
              </View>
            ) : null}

            {chartsLikeYours.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Charts Like Yours</Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  Celebs who share your key placements.
                </Text>
                {chartsLikeYours.map(renderChartsLikeYoursCard)}
              </View>
            ) : null}

            {renderCollection(STUB_COLLECTIONS[0])}

            {recentlyAdded.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Added</Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  New charts in the database.
                </Text>
                <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {recentlyAdded.map((c) => renderCelebRow(c, 'New'))}
                </View>
              </View>
            ) : null}

            {renderCollection(STUB_COLLECTIONS[1])}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse All</Text>
              <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                All celebrities in the database.
              </Text>
              <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {allCelebs.map((c) => renderCelebRow(c))}
              </View>
            </View>
          </>
        ) : null}

        {isLoading ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading celebrity database…
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
      <FloatingAddButton
        onPress={() => {
          clearActiveRelationshipFlow();
          navigation.navigate('PartnerIdentity');
        }}
        accessibilityLabel="Add someone to Iris"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  headerBlock: {
    gap: 10,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  searchCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowBody: {
    flex: 1,
    gap: 4,
  },
  listRowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listRowName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  listRowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  chevron: {
    fontSize: 18,
  },
  likeCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  likeCardBody: {
    flex: 1,
    gap: 6,
  },
  likeCardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  likeCardPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  placementPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  placementPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  likeCardBlurb: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  inlineAction: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  collectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  collectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  collectionBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  miniRail: {
    gap: 12,
    paddingRight: 20,
    paddingTop: 6,
  },
  miniCard: {
    width: 120,
    gap: 6,
  },
  miniPhotoWrap: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  miniPhoto: {
    width: '100%',
    height: '100%',
  },
  miniPhotoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFallbackInitial: {
    fontSize: 28,
    fontWeight: '700',
  },
  miniName: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniMeta: {
    fontSize: 11,
  },
  placementGroup: {
    gap: 8,
    marginTop: 8,
  },
  placementGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
