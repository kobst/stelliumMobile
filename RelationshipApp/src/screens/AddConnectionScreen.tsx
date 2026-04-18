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
import { Avatar } from '../components/Avatar';
import { celebritiesApi, type Celebrity } from '../api';
import { getCelebritySunSign } from '../utils/mainShell';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type Step = 'choose' | 'celeb' | 'celeb-confirm';

interface CelebListItem {
  id: string;
  name: string;
  sun: string | null;
  photoUri: string | null;
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
    raw: celeb,
  };
}

const POPULAR_LIMIT = 20;
const SEARCH_LIMIT = 24;
const SEARCH_DEBOUNCE_MS = 220;

const TIER_ROWS: readonly { glyph: string; text: string; paid: boolean }[] = [
  { glyph: '✓', text: 'Relationship archetype & aspect match', paid: false },
  { glyph: '✓', text: 'Short romantic blurb (free)', paid: false },
  { glyph: '◆', text: '5-dimension scores & overview (1 credit)', paid: true },
  { glyph: '◆', text: 'Full synastry & composite analysis (3 credits)', paid: true },
];

export function AddConnectionScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('choose');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCeleb, setSelectedCeleb] = useState<CelebListItem | null>(null);

  const [popularCelebs, setPopularCelebs] = useState<CelebListItem[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [popularError, setPopularError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<CelebListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trimmedSearch = searchValue.trim();
  const isSearchMode = trimmedSearch.length >= 2;
  const isSearchHint = trimmedSearch.length > 0 && trimmedSearch.length < 2;

  useEffect(() => {
    let cancelled = false;
    async function loadPopular() {
      setIsLoadingPopular(true);
      setPopularError(null);
      try {
        const response = await celebritiesApi.getCelebrities({
          usePagination: true,
          page: 1,
          limit: POPULAR_LIMIT,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        if (cancelled) {
          return;
        }
        const list = 'data' in response ? response.data : response;
        setPopularCelebs(list.map(toListItem));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPopularError(
          error instanceof Error ? error.message : 'Could not load celebrities right now.'
        );
      } finally {
        if (!cancelled) {
          setIsLoadingPopular(false);
        }
      }
    }
    loadPopular();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const celebListItems = useMemo(
    () => (isSearchMode ? searchResults : popularCelebs),
    [isSearchMode, popularCelebs, searchResults]
  );

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

  const handleCreateCelebConnection = useCallback(() => {
    Alert.alert(
      'Create connection',
      'Celebrity preview flow will run here once this screen is wired to the real preview endpoint.'
    );
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
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
            <ChooseStep onPickCeleb={() => setStep('celeb')} onPickPerson={handleOpenPersonFlow} />
          ) : null}
          {step === 'celeb' ? (
            <CelebStep
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              isSearchMode={isSearchMode}
              isSearchHint={isSearchHint}
              results={celebListItems}
              isLoading={isSearchMode ? isSearching : isLoadingPopular}
              error={isSearchMode ? null : popularError}
              onSelect={handleSelectCeleb}
            />
          ) : null}
          {step === 'celeb-confirm' && selectedCeleb ? (
            <CelebConfirmStep celeb={selectedCeleb} onCreate={handleCreateCelebConnection} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ChooseStepProps {
  onPickCeleb: () => void;
  onPickPerson: () => void;
}

function ChooseStep({ onPickCeleb, onPickPerson }: ChooseStepProps) {
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
        title="Someone in your life"
        body="Partner, crush, ex, friend — anyone you know birth details for."
        onPress={onPickPerson}
      />
    </View>
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
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={[styles.chooseIcon, { backgroundColor: iconBg }]}>
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
  results: readonly CelebListItem[];
  isLoading: boolean;
  error: string | null;
  onSelect: (celeb: CelebListItem) => void;
}

function CelebStep({
  searchValue,
  onSearchChange,
  isSearchMode,
  isSearchHint,
  results,
  isLoading,
  error,
  onSelect,
}: CelebStepProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepBody}>
      <View
        style={[
          styles.searchField,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
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
        {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {isSearchHint ? (
        <Text style={[styles.emptyResults, { color: colors.textSubtle }]}>
          Type at least 2 characters to search.
        </Text>
      ) : null}

      {!isSearchMode ? (
        <Text style={[styles.sectionLabel, { color: colors.accent }]}>Popular</Text>
      ) : null}

      {error ? (
        <Text style={[styles.emptyResults, { color: colors.error }]}>{error}</Text>
      ) : null}

      {results.map((celeb) => (
        <CelebRow
          key={celeb.id}
          celeb={celeb}
          onPress={() => onSelect(celeb)}
        />
      ))}

      {!isLoading && !error && results.length === 0 && isSearchMode ? (
        <Text style={[styles.emptyResults, { color: colors.textMuted }]}>
          No celebrities match "{searchValue}".
        </Text>
      ) : null}
    </View>
  );
}

interface CelebRowProps {
  celeb: CelebListItem;
  onPress: () => void;
}

function CelebRow({ celeb, onPress }: CelebRowProps) {
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
        <Text style={[styles.celebMeta, { color: colors.textMuted }]}>
          {celeb.sun ? `${celeb.sun} Sun` : 'Unknown sign'}
        </Text>
      </View>
      <Text style={[styles.chev, { color: colors.textSubtle }]}>›</Text>
    </TouchableOpacity>
  );
}

interface CelebConfirmStepProps {
  celeb: CelebListItem;
  onCreate: () => void;
}

function CelebConfirmStep({ celeb, onCreate }: CelebConfirmStepProps) {
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

      <View
        style={[
          styles.tierCard,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
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
        activeOpacity={0.85}
        onPress={onCreate}
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
          Create Connection
        </Text>
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
    fontSize: 17,
    fontWeight: '600',
    fontStyle: 'italic',
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
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  chooseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  chooseIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseIconText: {
    fontSize: 20,
  },
  chooseCopy: {
    flex: 1,
    gap: 4,
  },
  chooseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chooseBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
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
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmMeta: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
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
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
