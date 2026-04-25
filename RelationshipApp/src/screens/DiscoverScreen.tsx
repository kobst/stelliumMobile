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
import {
  celebritiesApi,
  Celebrity,
  discoverApi,
  CollectionCeleb,
  DiscoverCollection,
  CelebRelationship,
  ChartsLikeYoursCeleb,
  ChartsLikeYoursResponse,
} from '../api';
import type { EnhancedRelationshipAnalysisResponse } from '../../../shared/api/relationships';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import {
  celebrityToSubject,
  getCelebritySunSign,
  getRelationshipArchetypeLabel,
} from '../utils/mainShell';
import { Avatar } from '../components/Avatar';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { useOwnedSubjects } from '../hooks/useOwnedSubjects';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';
import type { UserCompositeChart } from '../../../shared/api/relationships';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type CelebPlanet = { name?: string; sign?: string | null };

function fabricateClusterMetrics(score: number) {
  return {
    score: Number.isFinite(score) ? score : 0,
    rawScore: 0,
    supportPct: 0,
    challengePct: 0,
    heatPct: 0,
    activityPct: 0,
    sparkElements: 0,
    quadrant: 'Flat' as const,
    keystoneAspects: [],
  };
}

function buildPreviewFromCelebRelationship(
  rel: CelebRelationship
): EnhancedRelationshipAnalysisResponse {
  const cs = rel.clusterScores ?? {};
  return {
    success: true,
    compositeChartId: rel._id,
    userA: {
      id: rel.userA_id ?? '',
      name: rel.userA_name ?? rel.userA_firstName ?? '',
      // Extra optional field consumed by RelationshipPreviewScreen for celeb-pair avatars.
      profilePhotoUrl: rel.userA_profilePhotoUrl ?? null,
    } as EnhancedRelationshipAnalysisResponse['userA'],
    userB: {
      id: rel.userB_id ?? '',
      name: rel.userB_name ?? rel.userB_firstName ?? '',
      profilePhotoUrl: rel.userB_profilePhotoUrl ?? null,
    } as EnhancedRelationshipAnalysisResponse['userB'],
    clusters: {
      Harmony: fabricateClusterMetrics(cs.Harmony ?? 0),
      Passion: fabricateClusterMetrics(cs.Passion ?? 0),
      Connection: fabricateClusterMetrics(cs.Connection ?? 0),
      Stability: fabricateClusterMetrics(cs.Stability ?? 0),
      Growth: fabricateClusterMetrics(cs.Growth ?? 0),
    },
    overall: {
      score: rel.overallScore ?? 0,
      formula: '',
      dominantCluster: '',
      challengeCluster: '',
      profile: rel.archetypeKey ?? '',
      tier: '',
      strengthClusters: [],
      growthClusters: [],
      quadrantAnalytics: {
        distribution: {},
        entropy: 0,
        dominantQuadrant: '',
        uniformity: '',
      },
      keystoneAspects: [],
      summary: rel.archetypeLabel
        ? { label: rel.archetypeLabel, blurb: rel.archetypeBlurb ?? '' }
        : undefined,
    } as EnhancedRelationshipAnalysisResponse['overall'],
    scoredItems: [],
    initialOverview: rel.initialOverview ?? null,
    tensionFlowAnalysis:
      undefined as unknown as EnhancedRelationshipAnalysisResponse['tensionFlowAnalysis'],
    compositeChart:
      undefined as unknown as EnhancedRelationshipAnalysisResponse['compositeChart'],
    synastryAspects: [],
    synastryHousePlacements:
      {} as EnhancedRelationshipAnalysisResponse['synastryHousePlacements'],
    status: 'scores_calculated',
    metadata: {
      processingTime: '',
      clustersAnalyzed: 5,
      totalScoredItems: 0,
      workflowType: 'direct-cluster-scoring',
      version: '',
      isCelebrityRelationship: true,
      initialOverviewGenerated: Boolean(rel.initialOverview),
    },
  };
}

function getCelebPlanets(celeb: Celebrity): CelebPlanet[] {
  const planets = (celeb.birthChart as { planets?: CelebPlanet[] } | undefined)?.planets;
  return Array.isArray(planets) ? planets : [];
}

function getCelebPlanetSign(celeb: Celebrity, planet: string): string | null {
  const match = getCelebPlanets(celeb).find((p) => p.name === planet);
  return typeof match?.sign === 'string' ? match.sign : null;
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
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore(
    (state) => state.setActiveRelationshipId
  );
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );

  const { ownedSubjects } = useOwnedSubjects();
  const { relationshipHistory } = useRelationshipHistory();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [allCelebs, setAllCelebs] = React.useState<Celebrity[]>([]);
  const [searchResults, setSearchResults] = React.useState<Celebrity[]>([]);
  const [collections, setCollections] = React.useState<DiscoverCollection[]>([]);
  const [celebRelationships, setCelebRelationships] = React.useState<CelebRelationship[]>([]);
  const [chartsLikeYoursData, setChartsLikeYoursData] =
    React.useState<ChartsLikeYoursResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedSearchQuery = searchQuery.trim();
  const isSearchMode = trimmedSearchQuery.length >= 2;
  const showSearchHint = trimmedSearchQuery.length > 0 && trimmedSearchQuery.length < 2;

  const openCelebrityDetail = React.useCallback(
    (celebrity: Celebrity) => {
      clearActiveRelationshipFlow();
      setActiveTargetType('celebrity');
      setActiveTargetSubject(celebrityToSubject(celebrity));
      navigation.navigate('CelebrityDetail', { celebrity });
    },
    [clearActiveRelationshipFlow, navigation, setActiveTargetSubject, setActiveTargetType]
  );

  const openCollectionCeleb = React.useCallback(
    (celeb: CollectionCeleb) => {
      clearActiveRelationshipFlow();
      setActiveTargetType('celebrity');
      setActiveTargetSubject(null);
      navigation.navigate('CelebrityDetail', {
        celebrityId: celeb.id,
        preview: celeb,
      });
    },
    [clearActiveRelationshipFlow, navigation, setActiveTargetSubject, setActiveTargetType]
  );

  const handleUserSubjectTap = React.useCallback(
    (subject: OwnedGuestSubject) => {
      clearActiveRelationshipFlow();
      navigation.navigate('SubjectDetail', { subject });
    },
    [clearActiveRelationshipFlow, navigation]
  );

  const openCelebRelationshipAnalysis = React.useCallback(
    (rel: CelebRelationship) => {
      const preview = buildPreviewFromCelebRelationship(rel);
      clearActiveRelationshipFlow();
      setActiveTargetType('celebrity');
      setActiveTargetSubject(null);
      setActivePartnerRomanticAssets(null);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(rel._id);
      setFullAnalysis(null);
      setWorkflowState({
        workflowStatus: null,
        workflowPhase: 'idle',
        workflowError: null,
      });
      navigation.navigate('RelationshipPreview');
    },
    [
      clearActiveRelationshipFlow,
      navigation,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setActiveTargetSubject,
      setActiveTargetType,
      setFullAnalysis,
      setPreviewAnalysis,
      setWorkflowState,
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

    discoverApi
      .getCollections()
      .then((result) => {
        if (cancelled) return;
        setCollections(result);
      })
      .catch((collectionsError) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[DiscoverScreen] getCollections failed', {
            error:
              collectionsError instanceof Error
                ? collectionsError.message
                : String(collectionsError),
          });
        }
        if (!cancelled) {
          setCollections([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!selfProfileId) {
      setChartsLikeYoursData(null);
      return;
    }
    let cancelled = false;
    discoverApi
      .getChartsLikeYours(selfProfileId)
      .then((result) => {
        if (cancelled) return;
        setChartsLikeYoursData(result);
      })
      .catch((chartsError) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[DiscoverScreen] getChartsLikeYours failed', {
            selfProfileId,
            error: chartsError instanceof Error ? chartsError.message : String(chartsError),
          });
        }
        if (!cancelled) {
          setChartsLikeYoursData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selfProfileId]);

  React.useEffect(() => {
    let cancelled = false;

    discoverApi
      .getCelebRelationships(12)
      .then((result) => {
        if (cancelled) return;
        // Prefer rows with scoring data already joined in so cards render richly.
        const withScoring = result.filter(
          (row) =>
            typeof row.overallScore === 'number' ||
            !!row.archetypeLabel ||
            (row.clusterScores && Object.values(row.clusterScores).some((v) => typeof v === 'number'))
        );
        setCelebRelationships(withScoring.length > 0 ? withScoring : result);
      })
      .catch((celebRelError) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[DiscoverScreen] getCelebRelationships failed', {
            error:
              celebRelError instanceof Error ? celebRelError.message : String(celebRelError),
          });
        }
        if (!cancelled) {
          setCelebRelationships([]);
        }
      });

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

  const chartsLikeYours = chartsLikeYoursData?.celebs ?? [];
  const chartsLikeYoursSubtitle =
    chartsLikeYoursData?.matchedPlacement?.subtitle ??
    'Celebs who share your key placements.';

  // STUB: client-side "Recently Added" — we don't know if /getCelebs supports
  // sortBy=createdAt. Falling back to last N of the current page.
  const recentlyAdded = React.useMemo(() => allCelebs.slice(-6).reverse(), [allCelebs]);

  // Random sample of celebs to populate the "Popular" rail. Reshuffled when
  // `allCelebs` changes (i.e. after a fresh /getCelebs fetch) and stable for
  // re-renders in between, so taps don't cause the list to reorder.
  const popularCelebs = React.useMemo(() => {
    if (allCelebs.length === 0) return [] as Celebrity[];
    const pool = [...allCelebs];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, [allCelebs]);

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
        onPress={() => openCelebrityDetail(celeb)}
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
        onPress={() => openCelebrityDetail(celeb)}
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

  const renderChartsLikeYoursCard = (celeb: ChartsLikeYoursCeleb) => {
    const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.trim();
    const initial = celeb.firstName?.charAt(0) ?? '?';
    const blurb = celeb.romanticProfileBlurb?.trim() || null;
    const preview: CollectionCeleb = {
      id: celeb.id,
      firstName: celeb.firstName,
      lastName: celeb.lastName,
      profilePhotoUrl: celeb.profilePhotoUrl ?? null,
      romanticProfileBlurb: blurb,
    };
    return (
      <TouchableOpacity
        key={`like-${celeb.id}`}
        onPress={() => openCollectionCeleb(preview)}
        activeOpacity={0.86}
        style={[styles.likeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Avatar
          size={52}
          gradient="gold"
          photoUri={celeb.profilePhotoUrl ?? null}
          fallbackInitial={initial}
        />
        <View style={styles.likeCardBody}>
          <Text style={[styles.likeCardName, { color: colors.text }]} numberOfLines={1}>
            {fullName || 'Unknown'}
          </Text>
          {celeb.sharedPlacements.length > 0 ? (
            <View style={styles.likeCardPills}>
              {celeb.sharedPlacements.slice(0, 3).map((placement) => (
                <View
                  key={placement}
                  style={[styles.placementPill, { backgroundColor: colors.surfaceHigh }]}
                >
                  <Text style={[styles.placementPillText, { color: colors.primary }]}>
                    {placement}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
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

  const renderMiniCollectionCeleb = (celeb: CollectionCeleb) => {
    const fullName = `${celeb.firstName ?? ''} ${celeb.lastName ?? ''}`.trim();
    const sunSign = celeb.sunSign ?? '—';
    return (
      <TouchableOpacity
        key={`mini-collection-${celeb.id}`}
        onPress={() => openCollectionCeleb(celeb)}
        activeOpacity={0.86}
        style={styles.miniCard}
      >
        <View style={[styles.miniPhotoWrap, { backgroundColor: colors.surface }]}>
          {celeb.profilePhotoUrl ? (
            <Image
              source={{ uri: celeb.profilePhotoUrl }}
              style={styles.miniPhoto}
              resizeMode="cover"
            />
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

  const celebByIdMap = React.useMemo(() => {
    const map = new Map<string, Celebrity>();
    for (const celeb of allCelebs) {
      if (celeb._id) map.set(celeb._id, celeb);
    }
    return map;
  }, [allCelebs]);

  // /getCelebRelationships now returns userA_profilePhotoUrl / userB_profilePhotoUrl
  // directly on each row (joined from the celebrity subject). Treat those as the
  // primary source and only fall back to the /getCelebs map for rows where the
  // server didn't populate a URL.
  const resolveCelebPhoto = React.useCallback(
    (userId: string | undefined, fallback: string | null | undefined): string | null => {
      if (fallback) return fallback;
      if (!userId) return null;
      const celeb = celebByIdMap.get(userId);
      return celeb?.profilePhotoUrl ?? celeb?.photoUrl ?? null;
    },
    [celebByIdMap]
  );

  const renderCelebRelationshipCard = (rel: CelebRelationship) => {
    const nameA = rel.userA_firstName ?? rel.userA_name ?? '';
    const nameB = rel.userB_firstName ?? rel.userB_name ?? '';
    const pairLabel = [nameA, nameB].filter(Boolean).join(' & ');
    const initialA = nameA.charAt(0) || '?';
    const initialB = nameB.charAt(0) || '?';
    const photoA = resolveCelebPhoto(rel.userA_id, rel.userA_profilePhotoUrl);
    const photoB = resolveCelebPhoto(rel.userB_id, rel.userB_profilePhotoUrl);
    const archetype = rel.archetypeLabel ?? null;
    const blurb = rel.archetypeBlurb ?? rel.initialOverview ?? null;
    const cs = rel.clusterScores ?? {};
    const scoreChips: Array<{ key: string; label: string; value: number | null | undefined }> = [
      { key: 'HAR', label: 'HAR', value: cs.Harmony },
      { key: 'PAS', label: 'PAS', value: cs.Passion },
      { key: 'CON', label: 'CON', value: cs.Connection },
      { key: 'STA', label: 'STA', value: cs.Stability },
      { key: 'GRO', label: 'GRO', value: cs.Growth },
    ];

    return (
      <TouchableOpacity
        key={`celebrel-${rel._id}`}
        activeOpacity={0.86}
        onPress={() => openCelebRelationshipAnalysis(rel)}
        style={[
          styles.connectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.connectionHeaderRow}>
          <View style={styles.connectionAvatars}>
            <View style={styles.connectionAvatarBack}>
              <Avatar
                size={48}
                gradient="lavender"
                photoUri={photoA}
                fallbackInitial={initialA}
              />
            </View>
            <View style={styles.connectionAvatarFront}>
              <Avatar
                size={48}
                gradient="gold"
                photoUri={photoB}
                fallbackInitial={initialB}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.connectionPair, { color: colors.text }]} numberOfLines={1}>
          {pairLabel || 'Celebrity pair'}
        </Text>

        {archetype ? (
          <Text style={[styles.connectionArchetype, { color: colors.accent }]} numberOfLines={1}>
            {archetype}
          </Text>
        ) : null}

        {blurb ? (
          <Text style={[styles.connectionBlurb, { color: colors.textMuted }]} numberOfLines={3}>
            {blurb}
          </Text>
        ) : null}

        <View style={styles.connectionScoreRow}>
          {scoreChips.map((chip) => {
            const rounded = typeof chip.value === 'number' ? Math.round(chip.value) : null;
            return (
              <View
                key={chip.key}
                style={[styles.connectionScoreCell, { backgroundColor: colors.surfaceHigh }]}
              >
                <Text style={[styles.connectionScoreValue, { color: colors.primary }]}>
                  {rounded ?? '—'}
                </Text>
                <Text style={[styles.connectionScoreLabel, { color: colors.textMuted }]}>
                  {chip.label}
                </Text>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCollection = (collection: DiscoverCollection) => {
    if (!collection.celebs || collection.celebs.length === 0) return null;
    const accentColor = collection.accent === 'coral' ? colors.accent : colors.primary;
    return (
      <View
        key={collection.id}
        style={[styles.collectionCard, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}
      >
        <Text style={[styles.collectionEyebrow, { color: accentColor }]}>Collection</Text>
        <Text style={[styles.collectionTitle, { color: colors.text }]}>{collection.title}</Text>
        <Text style={[styles.collectionBody, { color: colors.textMuted }]}>{collection.description}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.miniRail}
        >
          {collection.celebs.map(renderMiniCollectionCeleb)}
        </ScrollView>
      </View>
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
            onChangeText={setSearchQuery}
            placeholder="Search by name, sign, or placement"
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
          />
          {isSearching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

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

        {/* DEFAULT VIEW ───────────────────────────────────── */}
        {!isSearchMode ? (
          <>
            {chartsLikeYours.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {chartsLikeYoursData?.matchedPlacement?.label ?? 'Charts Like Yours'}
                </Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  {chartsLikeYoursSubtitle}
                </Text>
                {chartsLikeYours.map(renderChartsLikeYoursCard)}
              </View>
            ) : null}

            {collections[0] ? renderCollection(collections[0]) : null}

            {celebRelationships.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Famous Connections
                </Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  Real celebrity relationships analyzed.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.connectionRail}
                >
                  {celebRelationships.map(renderCelebRelationshipCard)}
                </ScrollView>
              </View>
            ) : null}

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

            {collections[1] ? renderCollection(collections[1]) : null}

            {popularCelebs.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular</Text>
                <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                  A handful of charts worth a peek.
                </Text>
                <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {popularCelebs.map((c) => renderCelebRow(c))}
                </View>
              </View>
            ) : null}
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
    flexShrink: 1,
  },
  miniMeta: {
    fontSize: 11,
  },
  connectionRail: {
    gap: 12,
    paddingRight: 20,
    paddingTop: 6,
  },
  connectionCard: {
    width: 280,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  connectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  connectionAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionAvatarBack: {
    zIndex: 1,
  },
  connectionAvatarFront: {
    marginLeft: -14,
  },
  connectionPair: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  connectionArchetype: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  connectionBlurb: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  connectionScoreRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  connectionScoreCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 2,
  },
  connectionScoreValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  connectionScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
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
