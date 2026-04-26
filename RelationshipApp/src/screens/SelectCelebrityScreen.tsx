import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { celebritiesApi, Celebrity, relationshipsApi } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { SubjectDocument } from '../../../shared/types/subject';
import { startRelationshipPreview } from './previewFlow';

type Props = StackScreenProps<RelationshipRootParamList, 'SelectCelebrity'>;

function celebrityToSubject(celebrity: Celebrity): SubjectDocument {
  return {
    _id: celebrity._id,
    createdAt: '',
    updatedAt: '',
    kind: 'celebrity',
    ownerUserId: null,
    isCelebrity: true,
    isReadOnly: true,
    firstName: celebrity.firstName,
    lastName: celebrity.lastName,
    gender: celebrity.gender,
    dateOfBirth: celebrity.dateOfBirth,
    placeOfBirth: celebrity.placeOfBirth,
    time: celebrity.time,
    birthTimeUnknown: !celebrity.time,
    totalOffsetHours: celebrity.totalOffsetHours ?? 0,
    birthChart: celebrity.birthChart,
    appDomain: null,
    firebaseUid: null,
  };
}

export const SelectCelebrityScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const activeTargetSubject = useRelationshipAppStore((state) => state.activeTargetSubject);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [celebrities, setCelebrities] = React.useState<Celebrity[]>([]);
  const [selectedCelebrity, setSelectedCelebrity] = React.useState<Celebrity | null>(
    activeTargetSubject?.kind === 'celebrity'
      ? {
          _id: activeTargetSubject._id,
          firstName: activeTargetSubject.firstName,
          lastName: activeTargetSubject.lastName,
          dateOfBirth: activeTargetSubject.dateOfBirth,
          placeOfBirth: activeTargetSubject.placeOfBirth,
          time: activeTargetSubject.time,
          gender: activeTargetSubject.gender,
          totalOffsetHours: activeTargetSubject.totalOffsetHours,
          birthChart: activeTargetSubject.birthChart,
          isCelebrity: true,
          isReadOnly: true,
          kind: 'celebrity',
        }
      : null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isStartingPreview, setIsStartingPreview] = React.useState(false);

  const loadCelebrities = React.useCallback(
    async (targetPage: number, search: string, append: boolean) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: targetPage,
          limit: 20,
          search: search.trim() || undefined,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        if (!('data' in response)) {
          throw new Error('Celebrity API returned an unexpected response shape.');
        }

        setCelebrities((current) => {
          const nextItems = append ? [...current, ...response.data] : response.data;
          return nextItems.filter(
            (celebrity, index, all) => index === all.findIndex((item) => item._id === celebrity._id)
          );
        });
        setHasMore(response.pagination.hasNext);
        setPage(targetPage);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load celebrities.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCelebrities(1, searchQuery, false).catch(() => undefined);
    }, searchQuery.trim().length >= 2 ? 250 : 0);

    return () => clearTimeout(timeoutId);
  }, [loadCelebrities, searchQuery]);

  const handleSelectCelebrity = (celebrity: Celebrity) => {
    setSelectedCelebrity(celebrity);
  };

  const handleConfirmSelection = async () => {
    if (!selectedCelebrity || !profile) {
      return;
    }

    const targetSubject = celebrityToSubject(selectedCelebrity);

    try {
      setIsStartingPreview(true);
      setError(null);

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

      setActiveTargetType('celebrity');
      setActiveTargetSubject(targetSubject);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      setRelationshipHistory({ relationshipHistory: updatedHistory });
      navigation.replace('RelationshipPreview');
    } catch (selectionError) {
      const message =
        selectionError instanceof Error
          ? selectionError.message
          : 'Could not start celebrity preview.';
      setError(message);
      Alert.alert('Celebrity preview failed', message);
    } finally {
      setIsStartingPreview(false);
    }
  };

  const renderCelebrityItem = ({ item }: { item: Celebrity }) => {
    const isSelected = selectedCelebrity?._id === item._id;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleSelectCelebrity(item)}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.cardBody, { color: colors.textMuted }]}>
          {item.dateOfBirth}
          {item.time ? ` at ${item.time}` : ''}
        </Text>
        <Text style={[styles.cardBody, { color: colors.textMuted }]} numberOfLines={2}>
          {item.placeOfBirth}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Celebrity</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Create your profile first.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Celebrity previews depend on your saved self profile before selection can start analysis.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('CreateSelfProfile')}
          >
            <Text style={styles.primaryButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Celebrity</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Choose from the shared celebrity dataset.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          This uses the same read-only celebrity APIs as the classic app, then starts the shared preview flow immediately.
        </Text>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search celebrities"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
        />

        {selectedCelebrity ? (
          <View style={[styles.selectedBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.selectedLabel, { color: colors.primary }]}>Selected</Text>
            <Text style={[styles.selectedName, { color: colors.text }]}>
              {selectedCelebrity.firstName} {selectedCelebrity.lastName}
            </Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              {selectedCelebrity.placeOfBirth}
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.body, { color: colors.textMuted }]}>Loading celebrities...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={celebrities}
            renderItem={renderCelebrityItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (hasMore && !isLoadingMore) {
                loadCelebrities(page + 1, searchQuery, true).catch(() => undefined);
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.centeredState}>
                <Text style={[styles.body, { color: colors.textMuted }]}>
                  No celebrities matched that search.
                </Text>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.footerLoader} />
              ) : null
            }
          />
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  selectedCelebrity && !isStartingPreview ? colors.primary : colors.primaryMuted,
              },
            ]}
            onPress={() => {
              handleConfirmSelection().catch(() => undefined);
            }}
            disabled={!selectedCelebrity || isStartingPreview}
          >
            <Text style={styles.primaryButtonText}>
              {isStartingPreview ? 'Starting Preview...' : 'Use This Celebrity'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
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
  searchInput: {
    borderWidth: 1,
    borderRadius: 14,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectedBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  selectedName: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  centeredState: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerLoader: {
    marginVertical: 12,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginTop: 'auto',
    paddingTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
