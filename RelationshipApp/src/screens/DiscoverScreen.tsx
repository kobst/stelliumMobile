import React from 'react';
import {
  ActivityIndicator,
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
import { celebrityToSubject, getBigThree, getCelebritySunSign } from '../utils/mainShell';
import { TopCelebMatchesRail } from '../components/TopCelebMatchesRail';
import { Avatar } from '../components/Avatar';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [trendingCelebs, setTrendingCelebs] = React.useState<Celebrity[]>([]);
  const [matchingCelebs, setMatchingCelebs] = React.useState<Celebrity[]>([]);
  const [searchResults, setSearchResults] = React.useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { sun } = getBigThree(profile);
  const trimmedSearchQuery = searchQuery.trim();
  const isSearchMode = trimmedSearchQuery.length >= 2;
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

  React.useEffect(() => {
    let cancelled = false;

    const loadDiscovery = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: 1,
          limit: 24,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        if (cancelled || !('data' in response)) {
          return;
        }

        const allCelebs = response.data;
        setTrendingCelebs(allCelebs.slice(0, 8));
        setMatchingCelebs(
          sun
            ? allCelebs.filter((celebrity) => getCelebritySunSign(celebrity) === sun).slice(0, 8)
            : []
        );
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
  }, [sun]);

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
          limit: 12,
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

  const renderCelebCard = (celebrity: Celebrity, eyebrow: string) => {
    const photoUri = celebrity.profilePhotoUrl ?? celebrity.photoUrl ?? null;
    const fullName = `${celebrity.firstName ?? ''} ${celebrity.lastName ?? ''}`.trim();
    const initial = celebrity.firstName?.charAt(0) ?? '?';
    const blurb = celebrity.romanticProfileBlurb?.trim() || null;
    return (
      <TouchableOpacity
        key={`${eyebrow}-${celebrity._id}`}
        style={[styles.celebCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => startCelebrityFlow(celebrity)}
        activeOpacity={0.86}
      >
        <View style={styles.celebHeader}>
          <Avatar size={52} gradient="gold" photoUri={photoUri} fallbackInitial={initial} />
          <View style={styles.celebHeaderCopy}>
            <Text style={[styles.celebEyebrow, { color: colors.primary }]}>{eyebrow}</Text>
            <Text style={[styles.celebName, { color: colors.text }]} numberOfLines={1}>
              {fullName || 'Unknown'}
            </Text>
          </View>
        </View>
        <Text style={[styles.celebMeta, { color: colors.textMuted }]}>
          {celebrity.dateOfBirth}
          {celebrity.time ? ` • ${celebrity.time}` : ''}
        </Text>
        <Text style={[styles.celebMeta, { color: colors.textMuted }]}>
          {getCelebritySunSign(celebrity) ?? 'Unknown sign'}
        </Text>
        <Text style={[styles.celebMeta, { color: colors.textMuted }]} numberOfLines={2}>
          {celebrity.placeOfBirth}
        </Text>
        {blurb ? (
          <Text style={[styles.celebBlurb, { color: colors.text }]} numberOfLines={3}>
            {blurb}
          </Text>
        ) : null}
        <View style={styles.inlineActionRow}>
          <Text style={[styles.inlineAction, { color: colors.accent }]}>See your connection</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Discover</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Search the chart database.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Browse celebrity charts, find patterns that echo your own, and spin up a new
            connection the moment something catches.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            clearActiveRelationshipFlow();
            navigation.navigate('PartnerIdentity');
          }}
          style={[
            styles.addBanner,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View style={[styles.addBannerIcon, { backgroundColor: 'rgba(202, 190, 255, 0.12)' }]}>
            <Text style={[styles.addBannerIconGlyph, { color: colors.primary }]}>+</Text>
          </View>
          <View style={styles.addBannerCopy}>
            <Text style={[styles.addBannerTitle, { color: colors.text }]}>
              Add someone to Iris
            </Text>
            <Text style={[styles.addBannerSubtitle, { color: colors.textSubtle }]}>
              Save a chart to browse alongside the celebrity database.
            </Text>
          </View>
          <Text style={[styles.addBannerChevron, { color: colors.textSubtle }]}>›</Text>
        </TouchableOpacity>

        <TopCelebMatchesRail
          title="Your Chart in the Wild"
          subtitle="Celeb overlaps from your saved relationship-app profile."
          matches={(profile?.topCelebMatches ?? []).slice(0, 5)}
        />

        <View style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search celebrities"
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>

        {showSearchHint ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Type at least 2 characters to search the celebrity database.
            </Text>
          </View>
        ) : null}

        {isSearchMode ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Search Results
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
              </Text>
            </View>
            {searchResults.map((celebrity) => renderCelebCard(celebrity, 'Search'))}
            {!isSearching && searchResults.length === 0 ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  No celebrities found for "{trimmedSearchQuery}".
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isLoading ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading discovery picks...
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>{error}</Text>
          </View>
        ) : null}

        {!isSearchMode && matchingCelebs.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Charts Like Yours</Text>
              <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                {sun ? `Local match on Sun sign: ${sun}` : 'Shared placements'}
              </Text>
            </View>
            {matchingCelebs.map((celebrity) => renderCelebCard(celebrity, 'Like Yours'))}
          </View>
        ) : null}

        {!isSearchMode ? (
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse the Database</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              Celeb charts loaded through the supported browse API
            </Text>
          </View>
          {trendingCelebs.map((celebrity) => renderCelebCard(celebrity, 'Trending'))}
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  headerBlock: {
    gap: 10,
    paddingTop: 8,
  },
  addBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBannerIconGlyph: {
    fontSize: 22,
    fontWeight: '700',
  },
  addBannerCopy: {
    flex: 1,
    gap: 2,
  },
  addBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  addBannerSubtitle: {
    fontSize: 12.5,
  },
  addBannerChevron: {
    fontSize: 20,
    fontWeight: '500',
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
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  celebCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  celebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  celebHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  celebEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  celebName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  celebMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  celebBlurb: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 6,
  },
  inlineActionRow: {
    paddingTop: 4,
  },
  inlineAction: {
    fontSize: 13,
    fontWeight: '700',
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
