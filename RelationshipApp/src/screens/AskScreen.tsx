import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import {
  useRelationshipAppStore,
  type AskAspectRef,
  type AskMessage,
  type AskThreadKey,
} from '../store';
import { Avatar } from '../components/Avatar';
import { AspectPickerSheet } from '../components/AspectPickerSheet';
import { IrisBubble, TypingBubble, UserBubble } from '../components/AskChatBubbles';
import { AskInputBar } from '../components/AskInputBar';
import { buildProfileAspects, buildRelationshipAspects } from '../utils/askAspects';
import { getInitials } from '../utils/mainShell';
import { ASK_COST_PER_MESSAGE, sendAskMessage, type AskTarget } from '../api/ask';
import { isDailyLimitError, presentPaywallIfInsufficient } from '../api/paywall';

type Props = StackScreenProps<RelationshipRootParamList, 'AskIris'>;

type AskContext = 'home' | 'profile' | 'relationship';

const MAX_CONTEXTS = 3;

// Resolve which chart/relationship the question is scoped to. `home` and
// `profile` both ask about the signed-in user's own chart; `relationship` uses
// the composite id (carried in the thread key, with store fallbacks).
function resolveAskTarget(
  context: AskContext,
  threadKey: AskThreadKey,
  activeRelationshipId: string | null,
  previewCompositeId: string | null,
  selfUserId: string | null
): AskTarget | null {
  if (context === 'relationship') {
    let compositeChartId: string | null = null;
    if (threadKey.startsWith('relationship:')) {
      const fromKey = threadKey.slice('relationship:'.length);
      if (fromKey && fromKey !== 'active') {
        compositeChartId = fromKey;
      }
    }
    compositeChartId = compositeChartId ?? activeRelationshipId ?? previewCompositeId;
    return compositeChartId ? { kind: 'relationship', compositeChartId } : null;
  }
  return selfUserId ? { kind: 'self', userId: selfUserId } : null;
}

const RELATIONSHIP_SUGGESTIONS = [
  'What is the strongest part of this connection?',
  'Where are we most likely to misunderstand each other?',
  'What should I pay attention to before getting more invested?',
] as const;

const PROFILE_SUGGESTIONS = [
  'Why do I keep attracting the same kind of person?',
  'What part of my chart creates the strongest first impression?',
  'Where am I easiest to misread in love?',
] as const;

const HOME_SUGGESTIONS = [
  'Who in my life should I analyze next?',
  'Which celebrity charts feel closest to mine?',
  'What relationship pattern should I be watching this week?',
] as const;

const RELATIONSHIP_FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Synastry', label: 'Synastry' },
  { key: 'Composite', label: 'Composite' },
] as const;

const PROFILE_FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Aspect', label: 'Aspects' },
  { key: 'Placement', label: 'Placements' },
] as const;

function defaultThreadKey(
  context: AskContext,
  relationshipId: string | null
): AskThreadKey {
  if (context === 'relationship') {
    return `relationship:${relationshipId ?? 'active'}`;
  }
  if (context === 'profile') return 'profile';
  return 'home';
}

export const AskScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const context: AskContext = route.params?.context ?? 'home';
  const prefill = route.params?.prefill;
  const providedThreadKey = route.params?.threadKey;
  const relationshipLabelFromRoute = route.params?.relationshipLabel;

  const profile = useRelationshipAppStore((state) => state.profile);
  const credits = useRelationshipAppStore((state) => state.credits);
  const activeRelationshipId = useRelationshipAppStore(
    (state) => state.activeRelationshipId
  );
  const activeTargetSubject = useRelationshipAppStore((state) => state.activeTargetSubject);
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const activePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.activePartnerRomanticAssets
  );
  const askThreads = useRelationshipAppStore((state) => state.askThreads);
  const appendAskMessage = useRelationshipAppStore((state) => state.appendAskMessage);
  const spendCredits = useRelationshipAppStore((state) => state.spendCredits);

  const threadKey: AskThreadKey = useMemo(() => {
    if (providedThreadKey) return providedThreadKey as AskThreadKey;
    return defaultThreadKey(context, activeRelationshipId);
  }, [providedThreadKey, context, activeRelationshipId]);

  const thread = useMemo(
    () => askThreads[threadKey] ?? [],
    [askThreads, threadKey]
  );

  const partnerName =
    previewAnalysis?.userB.name ??
    activeTargetSubject?.firstName ??
    'Partner';
  const selfName =
    previewAnalysis?.userA.name ?? profile?.firstName ?? 'You';

  const relationshipLabel =
    relationshipLabelFromRoute ??
    (context === 'relationship' ? `You & ${partnerName}` : null);

  const contextSubtitle = useMemo(() => {
    if (context !== 'relationship') return null;
    const tier = previewAnalysis?.overall?.tier;
    const profileLabel =
      previewAnalysis?.overall?.summary?.label ?? previewAnalysis?.overall?.profile;
    const connectionScore = previewAnalysis?.clusters?.Connection?.score;
    const parts: string[] = [];
    if (profileLabel) parts.push(profileLabel);
    else if (tier) parts.push(tier);
    if (typeof connectionScore === 'number' && Number.isFinite(connectionScore)) {
      parts.push(`Connection ${Math.round(connectionScore)}`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [context, previewAnalysis]);

  const relationshipAspectBundle = useMemo(
    () =>
      context === 'relationship'
        ? buildRelationshipAspects(previewAnalysis)
        : { aspects: [], countsByType: {} as Record<string, number> },
    [context, previewAnalysis]
  );

  const profileBirthChart = useMemo(
    () => (profile?.subject as { birthChart?: unknown } | undefined)?.birthChart ?? null,
    [profile?.subject]
  );

  const profileAspectBundle = useMemo(() => {
    if (context !== 'profile') {
      return { aspects: [], countsByType: {} as Record<string, number> };
    }
    const raw = activePartnerRomanticAssets?.birthChart ?? profileBirthChart;
    if (!raw || typeof raw !== 'object') {
      return { aspects: [], countsByType: {} as Record<string, number> };
    }
    const shape = raw as {
      planets?: Array<{ name: string; sign?: string; house?: number }>;
      aspects?: Array<{ aspectingPlanet: string; aspectedPlanet: string; aspectType: string }>;
    };
    return buildProfileAspects(shape);
  }, [context, activePartnerRomanticAssets?.birthChart, profileBirthChart]);

  const aspectBundle =
    context === 'relationship' ? relationshipAspectBundle : profileAspectBundle;

  const filters =
    context === 'relationship'
      ? RELATIONSHIP_FILTERS
      : context === 'profile'
      ? PROFILE_FILTERS
      : [];

  const suggestions =
    context === 'relationship'
      ? RELATIONSHIP_SUGGESTIONS
      : context === 'profile'
      ? PROFILE_SUGGESTIONS
      : HOME_SUGGESTIONS;

  const placeholder =
    context === 'relationship'
      ? 'Ask about this connection…'
      : context === 'profile'
      ? 'Ask about your chart…'
      : 'Ask Iris anything…';

  const [inputValue, setInputValue] = useState(prefill ?? '');
  const [selectedAspects, setSelectedAspects] = useState<AskAspectRef[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = inputValue.trim().length > 0 && !isSending;

  const handleToggleAspect = useCallback((aspect: AskAspectRef) => {
    setSelectedAspects((prev) => {
      if (prev.some((entry) => entry.id === aspect.id)) {
        return prev.filter((entry) => entry.id !== aspect.id);
      }
      if (prev.length >= MAX_CONTEXTS) return prev;
      return [...prev, aspect];
    });
  }, []);

  const handleRemoveSelected = useCallback((aspect: AskAspectRef) => {
    setSelectedAspects((prev) => prev.filter((entry) => entry.id !== aspect.id));
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleSend = useCallback(async () => {
    const question = inputValue.trim();
    if (!question || isSending) return;

    const target = resolveAskTarget(
      context,
      threadKey,
      activeRelationshipId,
      previewAnalysis?.compositeChartId ?? null,
      profile?.id ?? null
    );
    if (!target) {
      Alert.alert(
        'Not available yet',
        'Iris needs a chart to answer. Open Ask Iris from your profile or a relationship.'
      );
      return;
    }

    const userMessage: AskMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
      createdAt: new Date().toISOString(),
      contexts: selectedAspects.length > 0 ? [...selectedAspects] : undefined,
    };

    appendAskMessage(threadKey, userMessage);
    setInputValue('');
    setSelectedAspects([]);
    setIsSending(true);
    scrollToEnd();

    const aspectPayloads = selectedAspects
      .map((aspect) => aspect.payload)
      .filter((payload): payload is Record<string, unknown> => Boolean(payload));

    try {
      const { reply, billing } = await sendAskMessage({
        target,
        question,
        // Aspect-context is wired for the self/profile chart; relationship chips
        // don't carry a payload yet (the analysis doesn't expose scored items).
        ...(target.kind === 'self' && aspectPayloads.length > 0
          ? { selectedAspects: aspectPayloads }
          : {}),
      });
      appendAskMessage(threadKey, reply);
      // Trust the server's settlement: 1 credit for non-subscribers, 0 for
      // subscribers (covered by daily fair-use).
      if (billing && billing.creditsCharged > 0) {
        spendCredits(billing.creditsCharged);
      }
    } catch (error) {
      if (presentPaywallIfInsufficient(error, { label: 'ask Iris', cost: ASK_COST_PER_MESSAGE })) {
        return;
      }
      if (isDailyLimitError(error)) {
        appendAskMessage(threadKey, {
          id: `iris-limit-${Date.now()}`,
          role: 'iris',
          text: "You've reached today's Ask Iris limit. It resets tomorrow.",
          createdAt: new Date().toISOString(),
        });
        return;
      }
      appendAskMessage(threadKey, {
        id: `iris-error-${Date.now()}`,
        role: 'iris',
        text:
          error instanceof Error
            ? `Iris couldn't answer that yet — ${error.message}`
            : 'Iris couldn’t answer that yet. Please try again in a moment.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
      scrollToEnd();
    }
  }, [
    activeRelationshipId,
    appendAskMessage,
    context,
    inputValue,
    isSending,
    previewAnalysis?.compositeChartId,
    profile?.id,
    scrollToEnd,
    selectedAspects,
    spendCredits,
    threadKey,
  ]);

  const handleSuggestionTap = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Text style={[styles.backLabel, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.creditPill, { backgroundColor: 'rgba(233, 195, 73, 0.14)', borderColor: 'rgba(233, 195, 73, 0.25)' }]}>
          <Text style={[styles.creditGlyph, { color: colors.accent }]}>◆</Text>
          <Text style={[styles.creditValue, { color: colors.accent }]}>
            {credits?.balance ?? 0}
          </Text>
        </View>
      </View>

      {context === 'relationship' ? (
        <View
          style={[
            styles.contextBar,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View style={styles.contextAvatars}>
            <View style={[styles.avatarHolder, styles.avatarLeft, { borderColor: colors.surface }]}>
              <Avatar
                size={28}
                gradient="lavender"
                fallbackInitial={getInitials(selfName) || selfName.charAt(0)}
              />
            </View>
            <View style={[styles.avatarHolder, styles.avatarRight, { borderColor: colors.surface }]}>
              <Avatar
                size={28}
                gradient="green"
                fallbackInitial={getInitials(partnerName) || partnerName.charAt(0)}
              />
            </View>
          </View>
          <View style={styles.contextBarText}>
            <Text style={[styles.contextBarTitle, { color: colors.text }]} numberOfLines={1}>
              {relationshipLabel}
            </Text>
            {contextSubtitle ? (
              <Text style={[styles.contextBarSubtitle, { color: colors.textSubtle }]} numberOfLines={1}>
                {contextSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {thread.length === 0 ? (
            <EmptyState
              title={
                context === 'relationship'
                  ? 'Ask Iris anything'
                  : context === 'profile'
                  ? 'Ask Iris about your chart'
                  : 'Ask Iris anything'
              }
              body={
                context === 'relationship'
                  ? `Ask about your connection with ${partnerName}. Add specific aspects for deeper answers.`
                  : context === 'profile'
                  ? 'Ask Iris about your own chart. Pin specific placements or aspects for grounded answers.'
                  : 'Open-ended prompts start here — pick one to get going.'
              }
              suggestions={suggestions}
              onSelect={handleSuggestionTap}
            />
          ) : (
            <>
              {thread.map((message) =>
                message.role === 'user' ? (
                  <UserBubble key={message.id} message={message} />
                ) : (
                  <IrisBubble key={message.id} message={message} />
                )
              )}
              {isSending ? <TypingBubble /> : null}

              {!isSending && suggestions.length > 0 ? (
                <View style={styles.suggestedSection}>
                  <Text style={[styles.suggestedLabel, { color: colors.textSubtle }]}>
                    Suggested
                  </Text>
                  <View style={styles.suggestedStack}>
                    {suggestions.slice(0, 2).map((prompt) => (
                      <TouchableOpacity
                        key={prompt}
                        activeOpacity={0.7}
                        onPress={() => handleSuggestionTap(prompt)}
                        style={[
                          styles.suggestedRow,
                          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                        ]}
                      >
                        <Text style={[styles.suggestedText, { color: colors.textMuted }]}>
                          {prompt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <AskInputBar
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
          selectedAspects={selectedAspects}
          onRemoveAspect={handleRemoveSelected}
          onOpenPicker={() => setShowPicker(true)}
          placeholder={placeholder}
          costLabel={`◆ ${ASK_COST_PER_MESSAGE}`}
          maxSelection={MAX_CONTEXTS}
          canSend={canSend}
          aspectsAvailable={aspectBundle.aspects.length > 0}
        />
      </KeyboardAvoidingView>

      <AspectPickerSheet
        visible={showPicker}
        aspects={aspectBundle.aspects}
        selected={selectedAspects}
        maxSelection={MAX_CONTEXTS}
        filters={filters}
        onToggle={handleToggleAspect}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
};

interface EmptyStateProps {
  title: string;
  body: string;
  suggestions: readonly string[];
  onSelect: (value: string) => void;
}

function EmptyState({ title, body, suggestions, onSelect }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: 'rgba(0, 220, 229, 0.14)' }]}>
        <Text style={[styles.emptyIconText, { color: colors.tertiary }]}>✦</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>{body}</Text>
      <View style={styles.emptySuggestions}>
        {suggestions.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            activeOpacity={0.7}
            onPress={() => onSelect(prompt)}
            style={[
              styles.emptySuggestionRow,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.emptySuggestionText, { color: colors.textMuted }]}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  creditGlyph: {
    fontSize: 10,
    fontWeight: '700',
  },
  creditValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  contextBar: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  contextAvatars: {
    width: 48,
    height: 34,
    position: 'relative',
  },
  avatarHolder: {
    position: 'absolute',
    borderRadius: 15,
    borderWidth: 2,
  },
  avatarLeft: {
    left: 0,
    top: 0,
    zIndex: 2,
  },
  avatarRight: {
    right: 0,
    top: 6,
    zIndex: 1,
  },
  contextBarText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  contextBarTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  contextBarSubtitle: {
    fontSize: 11.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
  },
  emptySuggestions: {
    alignSelf: 'stretch',
    gap: 8,
  },
  emptySuggestionRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptySuggestionText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  suggestedSection: {
    marginTop: 12,
    gap: 8,
  },
  suggestedLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  suggestedStack: {
    gap: 6,
  },
  suggestedRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestedText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
