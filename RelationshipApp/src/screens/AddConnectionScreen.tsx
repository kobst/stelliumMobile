import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { Avatar } from '../components/Avatar';
import { Stardust } from '../components/atmosphere/Stardust';
import { Halo } from '../components/atmosphere/Halo';
import { celebritiesApi, relationshipsApi, type Celebrity } from '../api';
import {
  celebrityToSubject,
  getBigThree,
  getCelebritySunSign,
  getInitials,
} from '../utils/mainShell';
import { useRelationshipAppStore } from '../store';
import { startRelationshipPreview } from './previewFlow';
import { useOwnedSubjects } from '../hooks/useOwnedSubjects';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { getUnconnectedSubjects } from '../utils/unconnectedSubjects';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';
import {
  RELATIONSHIP_THEMES,
  extractCelebFacts,
  extractUserChartFacts,
  pickWeeklyThemes,
  weekOfFromDate,
  type CelebFacts,
  type ResolvedTheme,
  type UserChartFacts,
} from '../utils/celebThemes';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type Step = 'choose' | 'celeb' | 'celeb-confirm';

interface CelebListItem {
  id: string;
  name: string;
  sun: string | null;
  photoUri: string | null;
  blurb: string | null;
  raw: Celebrity;
}

function toListItem(celeb: Celebrity): CelebListItem {
  const firstName = celeb.firstName?.trim() ?? '';
  const lastName = celeb.lastName?.trim() ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
  return {
    id: celeb._id,
    name,
    sun: getCelebritySunSign(celeb),
    photoUri: celeb.profilePhotoUrl ?? celeb.photoUrl ?? null,
    blurb: celeb.romanticProfileBlurb?.trim() || null,
    raw: celeb,
  };
}

interface UnconnectedListItem {
  id: string;
  name: string;
  initial: string;
  sun: string | null;
  photoUri: string | null;
  subject: OwnedGuestSubject;
}

function toUnconnectedListItem(subject: OwnedGuestSubject): UnconnectedListItem {
  const firstName = subject.firstName?.trim() ?? '';
  const lastName = subject.lastName?.trim() ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unnamed';
  const { sun } = getBigThree(subject);
  return {
    id: subject._id,
    name,
    initial: getInitials(name) || name.charAt(0).toUpperCase() || '·',
    sun,
    photoUri: subject.profilePhotoUrl ?? null,
    subject,
  };
}

const SEARCH_LIMIT = 24;
const SEARCH_DEBOUNCE_MS = 220;
const THEMES_PER_WEEK = 3;
const CELEBS_PER_THEME = 5;

const TIER_ROWS: readonly { glyph: string; text: string; paid: boolean }[] = [
  { glyph: '✓', text: 'Relationship archetype & aspect match', paid: false },
  { glyph: '✓', text: 'Short romantic blurb (free)', paid: false },
  { glyph: '◆', text: '5-dimension scores & overview (1 credit)', paid: true },
  { glyph: '◆', text: 'Full synastry & composite analysis (3 credits)', paid: true },
];

export function AddConnectionScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();

  const profile = useRelationshipAppStore((state) => state.profile);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );

  useRelationshipHistory();
  const { ownedSubjects } = useOwnedSubjects();
  const selfProfileId = profile?.id ?? null;

  const unconnectedSubjects = useMemo(
    () =>
      getUnconnectedSubjects(ownedSubjects, relationshipHistory, selfProfileId).map(
        toUnconnectedListItem
      ),
    [ownedSubjects, relationshipHistory, selfProfileId]
  );

  const [step, setStep] = useState<Step>('choose');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCeleb, setSelectedCeleb] = useState<CelebListItem | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectingSubjectId, setConnectingSubjectId] = useState<string | null>(null);

  const [allCelebs, setAllCelebs] = useState<CelebListItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const hasLoadedCatalogRef = React.useRef(false);

  const [searchResults, setSearchResults] = useState<CelebListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trimmedSearch = searchValue.trim();
  const isSearchMode = trimmedSearch.length >= 2;
  const isSearchHint = trimmedSearch.length > 0 && trimmedSearch.length < 2;

  // Lazy-load the full celebrity catalog only when the user enters the celeb
  // step. Theme matching needs the entire dataset; one shot, cached for the
  // life of the screen.
  useEffect(() => {
    if (step !== 'celeb' || hasLoadedCatalogRef.current) return;
    let cancelled = false;
    hasLoadedCatalogRef.current = true;
    setIsLoadingCatalog(true);
    setCatalogError(null);
    (async () => {
      try {
        const response = await celebritiesApi.getCelebrities();
        if (cancelled) return;
        const list = Array.isArray(response) ? response : response.data;
        setAllCelebs(list.map(toListItem));
      } catch (error) {
        if (cancelled) return;
        hasLoadedCatalogRef.current = false;
        setCatalogError(
          error instanceof Error ? error.message : 'Could not load celebrities right now.'
        );
      } finally {
        if (!cancelled) setIsLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const userChart: UserChartFacts = useMemo(
    () => extractUserChartFacts(profile?.subject?.birthChart as never),
    [profile?.subject?.birthChart]
  );

  const celebFactsById = useMemo(() => {
    const map = new Map<string, CelebFacts>();
    for (const item of allCelebs) {
      map.set(item.id, extractCelebFacts(item.raw));
    }
    return map;
  }, [allCelebs]);

  const themedSections: ResolvedTheme[] = useMemo(() => {
    if (!profile?.id || allCelebs.length === 0) return [];
    return pickWeeklyThemes(
      RELATIONSHIP_THEMES,
      Array.from(celebFactsById.values()),
      userChart,
      profile.id,
      weekOfFromDate(),
      THEMES_PER_WEEK
    );
  }, [allCelebs.length, celebFactsById, profile?.id, userChart]);

  const celebItemById = useMemo(() => {
    const map = new Map<string, CelebListItem>();
    for (const item of allCelebs) map.set(item.id, item);
    return map;
  }, [allCelebs]);

  useEffect(() => {
    if (!isSearchMode) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const handle = setTimeout(async () => {
      try {
        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: 1,
          limit: SEARCH_LIMIT,
          search: trimmedSearch,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        if (cancelled) {
          return;
        }
        const list = 'data' in response ? response.data : response;
        setSearchResults(list.map(toListItem));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSearchResults([]);
        if (__DEV__) {
          console.warn('[AddConnectionScreen] celeb search failed', error);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [isSearchMode, trimmedSearch]);

  // Search-mode results pass through directly. Browse-mode (no query) is
  // rendered via the themed sections below; this list only feeds the search
  // path.

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBackToChoose = useCallback(() => {
    setStep('choose');
  }, []);

  const handleSelectCeleb = useCallback((celeb: CelebListItem) => {
    setSelectedCeleb(celeb);
    setStep('celeb-confirm');
  }, []);

  const handleOpenPersonFlow = useCallback(() => {
    navigation.navigate('PartnerIdentity');
  }, [navigation]);

  const handleConnectExistingSubject = useCallback(
    async (item: UnconnectedListItem) => {
      if (!profile || connectingSubjectId) {
        return;
      }
      if (!profile.id) {
        Alert.alert('Profile missing', 'Create your profile before connecting.');
        return;
      }

      setConnectingSubjectId(item.id);
      try {
        clearActiveRelationshipFlow();
        setActiveTargetType('person');
        setActiveTargetSubject(item.subject);
        // Let the preview screen hydrate romantic assets via
        // POST /getGuestSubjectRomantic on mount — don't seed here.
        setActivePartnerRomanticAssets(null);

        const { preview, updatedHistory } = await startRelationshipPreview(
          {
            selfProfile: profile,
            targetSubject: item.subject,
            targetType: 'person',
            isLocalUxMode,
            relationshipHistory,
          },
          {
            enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
          }
        );

        setPreviewAnalysis(preview);
        setActiveRelationshipId(preview.compositeChartId);
        setRelationshipHistory({ relationshipHistory: updatedHistory });

        navigation.reset({
          index: 1,
          routes: [
            { name: 'Main', params: { screen: 'RelationshipsTab' } },
            { name: 'RelationshipPreview' },
          ],
        });
      } catch (error) {
        Alert.alert(
          'Could not create connection',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      } finally {
        setConnectingSubjectId(null);
      }
    },
    [
      clearActiveRelationshipFlow,
      connectingSubjectId,
      isLocalUxMode,
      navigation,
      profile,
      relationshipHistory,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setActiveTargetSubject,
      setActiveTargetType,
      setPreviewAnalysis,
      setRelationshipHistory,
    ]
  );

  const handleCreateCelebConnection = useCallback(async () => {
    if (!selectedCeleb || !profile || isCreatingConnection) {
      return;
    }
    if (!profile.id) {
      Alert.alert('Profile missing', 'Create your profile before starting a celebrity read.');
      return;
    }

    setIsCreatingConnection(true);
    try {
      const rawCeleb = selectedCeleb.raw;
      const targetSubject = celebrityToSubject(rawCeleb);

      clearActiveRelationshipFlow();
      setActiveTargetType('celebrity');
      setActiveTargetSubject(targetSubject);
      setActivePartnerRomanticAssets({
        birthChart: (rawCeleb.birthChart as Record<string, unknown> | null | undefined) ?? null,
        overview: rawCeleb.romanticOverview ?? null,
        romanticProfileBlurb: rawCeleb.romanticProfileBlurb ?? null,
        referencedCodes: rawCeleb.romanticReferencedCodes ?? [],
        overviewMode: null,
        status: null,
      });

      const { preview, updatedHistory } = await startRelationshipPreview(
        {
          selfProfile: profile,
          targetSubject,
          targetType: 'celebrity',
          isLocalUxMode,
          relationshipHistory,
        },
        {
          enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
        }
      );

      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      setRelationshipHistory({ relationshipHistory: updatedHistory });

      navigation.reset({
        index: 1,
        routes: [
          { name: 'Main', params: { screen: 'RelationshipsTab' } },
          { name: 'RelationshipPreview' },
        ],
      });
    } catch (error) {
      Alert.alert(
        'Could not create connection',
        error instanceof Error ? error.message : 'Please try again shortly.'
      );
    } finally {
      setIsCreatingConnection(false);
    }
  }, [
    clearActiveRelationshipFlow,
    isCreatingConnection,
    isLocalUxMode,
    navigation,
    profile,
    relationshipHistory,
    selectedCeleb,
    setActivePartnerRomanticAssets,
    setActiveRelationshipId,
    setActiveTargetSubject,
    setActiveTargetType,
    setPreviewAnalysis,
    setRelationshipHistory,
  ]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stardust density={50} seed={6} color={colors.primary} />
      </View>
      <Halo color={colors.primary} size={420} opacity={0.14} top={60} left="50%" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={step === 'choose' ? handleClose : handleBackToChoose}
          activeOpacity={0.7}
          style={styles.headerAction}
          accessibilityRole="button"
        >
          <Text style={[styles.headerActionText, { color: colors.textMuted }]}>
            {step === 'choose' ? '✕' : '← Back'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Connection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'choose' ? (
            <ChooseStep
              onPickCeleb={() => setStep('celeb')}
              onPickPerson={handleOpenPersonFlow}
              unconnected={unconnectedSubjects}
              connectingSubjectId={connectingSubjectId}
              onConnectExisting={(item) => {
                handleConnectExistingSubject(item).catch(() => undefined);
              }}
            />
          ) : null}
          {step === 'celeb' ? (
            <CelebStep
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              isSearchMode={isSearchMode}
              isSearchHint={isSearchHint}
              searchResults={searchResults}
              isSearching={isSearching}
              themedSections={themedSections}
              celebItemById={celebItemById}
              userChart={userChart}
              isLoadingCatalog={isLoadingCatalog}
              catalogError={catalogError}
              onSelect={handleSelectCeleb}
              onBrowseAll={() =>
                navigation.navigate('Main', { screen: 'DiscoverTab' } as never)
              }
            />
          ) : null}
          {step === 'celeb-confirm' && selectedCeleb ? (
            <CelebConfirmStep
              celeb={selectedCeleb}
              isCreating={isCreatingConnection}
              onCreate={() => {
                handleCreateCelebConnection().catch(() => undefined);
              }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ChooseStepProps {
  onPickCeleb: () => void;
  onPickPerson: () => void;
  unconnected: readonly UnconnectedListItem[];
  connectingSubjectId: string | null;
  onConnectExisting: (item: UnconnectedListItem) => void;
}

function ChooseStep({
  onPickCeleb,
  onPickPerson,
  unconnected,
  connectingSubjectId,
  onConnectExisting,
}: ChooseStepProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepBody}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Who do you want to explore?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
        See how your chart connects with a celebrity or someone in your life.
      </Text>

      <ChooseCard
        iconGlyph="⭐"
        iconColor={colors.accent}
        iconBg="rgba(233, 195, 73, 0.15)"
        title="Celebrity"
        body="Explore your chart against hundreds of famous figures."
        onPress={onPickCeleb}
      />
      <ChooseCard
        iconGlyph="👤"
        iconColor={colors.text}
        iconBg="rgba(130, 200, 180, 0.14)"
        title="Someone new"
        body="Partner, crush, ex, friend — anyone you know birth details for."
        onPress={onPickPerson}
      />

      {unconnected.length > 0 ? (
        <View style={styles.unconnectedBlock}>
          <View style={[styles.dividerRow]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.ghostBorder }]} />
          </View>
          <Text style={[styles.unconnectedEyebrow, { color: colors.textSubtle }]}>
            Or connect with someone you've added
          </Text>
          {unconnected.map((item) => (
            <UnconnectedRow
              key={item.id}
              item={item}
              busy={connectingSubjectId === item.id}
              disabled={Boolean(connectingSubjectId) && connectingSubjectId !== item.id}
              onPress={() => onConnectExisting(item)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface UnconnectedRowProps {
  item: UnconnectedListItem;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}

function UnconnectedRow({ item, busy, disabled, onPress }: UnconnectedRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled || busy}
      onPress={onPress}
      style={[
        styles.unconnectedRow,
        {
          backgroundColor: colors.surfaceLow,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Avatar
        size={40}
        gradient="green"
        photoUri={item.photoUri}
        fallbackInitial={item.initial}
      />
      <View style={styles.unconnectedCopy}>
        <Text style={[styles.unconnectedName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.unconnectedMeta, { color: colors.textSubtle }]} numberOfLines={1}>
          {item.sun ? `${item.sun} Sun · ` : ''}Added, no relationship yet
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.unconnectedAction, { color: colors.primary }]}>Connect</Text>
      )}
    </TouchableOpacity>
  );
}

interface ChooseCardProps {
  iconGlyph: string;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  onPress: () => void;
}

function ChooseCard({ iconGlyph, iconColor, iconBg, title, body, onPress }: ChooseCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.chooseCard,
        { backgroundColor: colors.surfaceLow },
      ]}
    >
      <View
        style={[
          styles.chooseIcon,
          {
            backgroundColor: iconBg,
            ...Platform.select({
              ios: {
                shadowColor: iconColor,
                shadowOpacity: 0.45,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
              },
              android: {},
            }),
          },
        ]}
      >
        <Text style={[styles.chooseIconText, { color: iconColor }]}>{iconGlyph}</Text>
      </View>
      <View style={styles.chooseCopy}>
        <Text style={[styles.chooseTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.chooseBody, { color: colors.textMuted }]}>{body}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface CelebStepProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSearchMode: boolean;
  isSearchHint: boolean;
  searchResults: readonly CelebListItem[];
  isSearching: boolean;
  themedSections: readonly ResolvedTheme[];
  celebItemById: Map<string, CelebListItem>;
  userChart: UserChartFacts;
  isLoadingCatalog: boolean;
  catalogError: string | null;
  onSelect: (celeb: CelebListItem) => void;
  onBrowseAll: () => void;
}

function CelebStep({
  searchValue,
  onSearchChange,
  isSearchMode,
  isSearchHint,
  searchResults,
  isSearching,
  themedSections,
  celebItemById,
  userChart,
  isLoadingCatalog,
  catalogError,
  onSelect,
  onBrowseAll,
}: CelebStepProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepBody}>
      <View
        style={[
          styles.searchField,
          { backgroundColor: colors.surfaceLow },
        ]}
      >
        <Text style={[styles.searchIcon, { color: colors.textSubtle }]}>⌕</Text>
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder="Search celebrities…"
          placeholderTextColor={colors.textSubtle}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isSearchMode && isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>

      {isSearchHint ? (
        <Text style={[styles.emptyResults, { color: colors.textSubtle }]}>
          Type at least 2 characters to search.
        </Text>
      ) : null}

      {isSearchMode ? (
        <>
          {searchResults.map((celeb) => (
            <CelebRow key={celeb.id} celeb={celeb} onPress={() => onSelect(celeb)} />
          ))}
          {!isSearching && searchResults.length === 0 ? (
            <Text style={[styles.emptyResults, { color: colors.textMuted }]}>
              No celebrities match "{searchValue}".
            </Text>
          ) : null}
        </>
      ) : (
        <BrowseMode
          themedSections={themedSections}
          celebItemById={celebItemById}
          userChart={userChart}
          isLoading={isLoadingCatalog}
          error={catalogError}
          onSelect={onSelect}
          onBrowseAll={onBrowseAll}
        />
      )}
    </View>
  );
}

interface BrowseModeProps {
  themedSections: readonly ResolvedTheme[];
  celebItemById: Map<string, CelebListItem>;
  userChart: UserChartFacts;
  isLoading: boolean;
  error: string | null;
  onSelect: (celeb: CelebListItem) => void;
  onBrowseAll: () => void;
}

function BrowseMode({
  themedSections,
  celebItemById,
  userChart,
  isLoading,
  error,
  onSelect,
  onBrowseAll,
}: BrowseModeProps) {
  const { colors } = useTheme();

  if (error) {
    return <Text style={[styles.emptyResults, { color: colors.error }]}>{error}</Text>;
  }

  if (isLoading && themedSections.length === 0) {
    return (
      <View style={styles.themesLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (themedSections.length === 0) {
    return (
      <>
        <Text style={[styles.emptyResults, { color: colors.textMuted }]}>
          We couldn't surface themed picks for your chart yet. Try search above
          or browse the full directory.
        </Text>
        <BrowseAllButton onPress={onBrowseAll} />
      </>
    );
  }

  return (
    <>
      {themedSections.map((section) => {
        const visible = section.matches.slice(0, CELEBS_PER_THEME);
        return (
          <View key={section.theme.id} style={styles.themeSection}>
            <Text style={[styles.themeTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.themeSubtitle, { color: colors.textSubtle }]}>
              {section.theme.subtitle}
            </Text>
            {visible.map((celebFacts) => {
              const item = celebItemById.get(celebFacts.id);
              if (!item) return null;
              const badge =
                section.theme.badge?.(userChart, celebFacts) ?? null;
              return (
                <CelebRow
                  key={`${section.theme.id}:${celebFacts.id}`}
                  celeb={item}
                  badge={badge}
                  onPress={() => onSelect(item)}
                />
              );
            })}
          </View>
        );
      })}

      <BrowseAllButton onPress={onBrowseAll} />
    </>
  );
}

function BrowseAllButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.browseAllButton,
        { backgroundColor: colors.surfaceLow },
      ]}
    >
      <View style={styles.browseAllCopy}>
        <Text style={[styles.browseAllTitle, { color: colors.text }]}>
          Browse all charts
        </Text>
        <Text style={[styles.browseAllBody, { color: colors.textSubtle }]}>
          Explore by sign, placement, or collection
        </Text>
      </View>
      <Text style={[styles.chev, { color: colors.textSubtle }]}>›</Text>
    </TouchableOpacity>
  );
}

interface CelebRowProps {
  celeb: CelebListItem;
  onPress: () => void;
  badge?: string | null;
}

function CelebRow({ celeb, onPress, badge }: CelebRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.celebRow, { borderBottomColor: colors.ghostBorder }]}
    >
      <Avatar
        size={48}
        gradient="gold"
        photoUri={celeb.photoUri}
        fallbackInitial={celeb.name.charAt(0)}
      />
      <View style={styles.celebCopy}>
        <Text style={[styles.celebName, { color: colors.text }]}>{celeb.name}</Text>
        {badge ? (
          <View
            style={[
              styles.celebBadge,
              {
                backgroundColor: 'rgba(127, 119, 221, 0.14)',
                borderColor: 'rgba(127, 119, 221, 0.28)',
              },
            ]}
          >
            <Text style={[styles.celebBadgeText, { color: colors.primary }]}>
              {badge.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={[styles.celebMeta, { color: colors.textMuted }]}>
            {celeb.sun ? `${celeb.sun} Sun` : 'Unknown sign'}
          </Text>
        )}
        {celeb.blurb ? (
          <Text
            style={[styles.celebBlurb, { color: colors.textSubtle }]}
            numberOfLines={2}
          >
            {celeb.blurb}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.chev, { color: colors.textSubtle }]}>›</Text>
    </TouchableOpacity>
  );
}

interface CelebConfirmStepProps {
  celeb: CelebListItem;
  isCreating: boolean;
  onCreate: () => void;
}

function CelebConfirmStep({ celeb, isCreating, onCreate }: CelebConfirmStepProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepBody}>
      <View style={styles.confirmAvatarWrap}>
        <Avatar
          size={88}
          gradient="gold"
          photoUri={celeb.photoUri}
          fallbackInitial={celeb.name.charAt(0)}
          ringColor="rgba(233, 195, 73, 0.25)"
          ringWidth={3}
        />
      </View>
      <Text style={[styles.confirmName, { color: colors.text }]}>{celeb.name}</Text>
      <Text style={[styles.confirmMeta, { color: colors.textMuted }]}>
        {celeb.sun ? `${celeb.sun} Sun` : 'Unknown sign'}
      </Text>
      {celeb.blurb ? (
        <Text style={[styles.confirmBlurb, { color: colors.text }]}>
          {celeb.blurb}
        </Text>
      ) : null}

      <View
        style={[
          styles.tierCard,
          { backgroundColor: colors.surfaceLow },
        ]}
      >
        <Text style={[styles.tierCardHeader, { color: colors.textSubtle }]}>
          What you'll get
        </Text>
        {TIER_ROWS.map((row) => (
          <View key={row.text} style={styles.tierRow}>
            <Text
              style={[
                styles.tierGlyph,
                { color: row.paid ? colors.accent : colors.success },
              ]}
            >
              {row.glyph}
            </Text>
            <Text
              style={[
                styles.tierText,
                { color: row.paid ? colors.textMuted : colors.text },
              ]}
            >
              {row.text}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={isCreating ? 1 : 0.85}
        onPress={onCreate}
        disabled={isCreating}
        style={[
          styles.primaryButton,
          { backgroundColor: isCreating ? colors.primaryMuted : colors.primary },
        ]}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            Create Connection
          </Text>
        )}
      </TouchableOpacity>
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        Short blurb and archetype are free.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerAction: {
    minWidth: 60,
    paddingVertical: 6,
  },
  headerActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 60,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  stepBody: {
    gap: 14,
  },
  stepTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 32,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  stepSubtitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 23,
  },
  chooseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  chooseIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseIconText: {
    fontSize: 22,
  },
  chooseCopy: {
    flex: 1,
    gap: 4,
  },
  chooseTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  chooseBody: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  unconnectedBlock: {
    marginTop: 4,
    gap: 10,
  },
  dividerRow: {
    paddingVertical: 8,
  },
  dividerLine: {
    height: 1,
  },
  unconnectedEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  unconnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  unconnectedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  unconnectedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  unconnectedMeta: {
    fontSize: 11.5,
  },
  unconnectedAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  celebRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  celebCopy: {
    flex: 1,
    gap: 2,
  },
  celebName: {
    fontSize: 15,
    fontWeight: '500',
  },
  celebMeta: {
    fontSize: 12,
  },
  celebBadge: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  celebBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  celebBlurb: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    marginTop: 2,
  },
  themeSection: {
    gap: 6,
    marginTop: 6,
  },
  themeTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  themeSubtitle: {
    fontSize: 12.5,
    marginBottom: 4,
  },
  themesLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  browseAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 18,
  },
  browseAllCopy: {
    flex: 1,
    gap: 4,
  },
  browseAllTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  browseAllBody: {
    fontSize: 12,
  },
  chev: {
    fontSize: 18,
    fontWeight: '500',
  },
  emptyResults: {
    fontSize: 13,
    paddingVertical: 18,
    textAlign: 'center',
  },
  confirmAvatarWrap: {
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 8,
  },
  confirmName: {
    fontFamily: SERIF_FONT,
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 4,
  },
  confirmMeta: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  confirmBlurb: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  tierCard: {
    borderRadius: 22,
    padding: 20,
    gap: 12,
  },
  tierCardHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tierGlyph: {
    fontSize: 12,
    marginTop: 2,
    width: 14,
  },
  tierText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  primaryButton: {
    borderRadius: 22,
    paddingVertical: 18,
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.05,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
