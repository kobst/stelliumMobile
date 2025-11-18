import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, InteractionManager } from 'react-native';
import { useTheme } from '../theme';
import { TransitEvent, HoroscopeChatMessage } from '../types';
import { horoscopesApi, CustomHoroscope } from '../api/horoscopes';
import HoroscopeTransitsBottomSheet from './HoroscopeTransitsBottomSheet';
import { AstroIcon } from '../../utils/astrologyIcons';
import { formatDateRange } from '../utils/dateHelpers';
import { parseReferencedCodes, DecodedElement } from '../utils/parseReferencedCodes';
import { useStore } from '../store';
import { superwallService } from '../services/SuperwallService';
import { CreditActionButton } from './ui/CreditActionButton';
import { CREDIT_COSTS } from '../config/subscriptionConfig';

interface HoroscopeChatTabProps {
  userId: string;
  transitWindows: TransitEvent[];
  transitWindowsLoading: boolean;
  transitWindowsError: string | null;
  onRetryTransitWindows: () => void;
}

const HoroscopeChatTab: React.FC<HoroscopeChatTabProps> = ({
  userId,
  transitWindows,
  transitWindowsLoading,
  transitWindowsError,
  onRetryTransitWindows,
}) => {
  const { colors } = useTheme();
  const { userSubscription } = useStore();
  const subscriptionTier = userSubscription?.tier || 'free';
  const scrollViewRef = useRef<ScrollView>(null);
  // Auto-scroll helpers/flags
  const didLoadInitialHistoryRef = useRef(false);
  const didLayoutRef = useRef(false);

  // Robust attempt to scroll to end across layout timings
  const attemptScrollToEnd = (animated: boolean = true) => {
    const attempts = [0, 16, 50, 100, 200, 350];
    attempts.forEach((delay) => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            scrollViewRef.current?.scrollToEnd({ animated });
          } catch (_e) {
            // no-op
          }
        });
      }, delay);
    });
  };

  // State management
  const [selectedTransits, setSelectedTransits] = useState<TransitEvent[]>([]);
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<HoroscopeChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages, isLoading, isHistoryLoading]);

  // If the chat UI was not mounted due to transit windows loading,
  // ensure we scroll once it becomes visible.
  useEffect(() => {
    if (!transitWindowsLoading && chatMessages.length > 0) {
      InteractionManager.runAfterInteractions(() => {
        attemptScrollToEnd(false);
      });
    }
  }, [transitWindowsLoading]);

  // React to content size changes (chips/icons laying out later)
  const handleContentSizeChange = () => {
    if (didLoadInitialHistoryRef.current) {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          attemptScrollToEnd(false);
          didLoadInitialHistoryRef.current = false;
        });
      });
      return;
    }
    attemptScrollToEnd(true);
  };

  // First layout — if messages exist, force a bottom scroll
  const handleLayout = () => {
    didLayoutRef.current = true;
    if (chatMessages.length > 0) {
      attemptScrollToEnd(false);
    }
  };

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!userId || chatMessages.length > 0) return;

      console.log('Loading custom horoscope history for user:', userId);
      setIsHistoryLoading(true);

      try {
        const response = await horoscopesApi.getCustomHoroscopeHistory(userId, 50);
        console.log('Custom horoscope history response:', response);

        if (response && response.success && response.horoscopes && Array.isArray(response.horoscopes)) {
          console.log('Processing', response.horoscopes.length, 'custom horoscope entries');

          // Convert custom horoscopes to chat messages
          const transformedMessages: HoroscopeChatMessage[] = [];

          response.horoscopes.forEach((horoscope, index) => {
            console.log(`Horoscope ${index}:`, {
              mode: horoscope.metadata?.mode,
              hasUserPrompt: !!horoscope.userPrompt,
              transitEventCount: horoscope.metadata?.transitEventCount,
            });

            // Generate a user message
            let userContent: string;
            let selectedTransits: TransitEvent[] | undefined;

            if (horoscope.userPrompt) {
              // Extract the actual user query from the prompt
              // The userPrompt often contains structured data, we need to extract the actual question
              let extractedQuery = horoscope.userPrompt;

              // Look for patterns like "User Question:" or quotes
              const userQuestionMatch = extractedQuery.match(/User Question[^:]*:\s*"([^"]+)"/i);
              const quotedMatch = extractedQuery.match(/"([^"]+)"/);

              if (userQuestionMatch && userQuestionMatch[1]) {
                extractedQuery = userQuestionMatch[1];
              } else if (quotedMatch && quotedMatch[1] && quotedMatch[1].length > 10) {
                extractedQuery = quotedMatch[1];
              } else {
                // If no clear user question pattern, check if it's a simple query
                // Remove system instructions and context
                extractedQuery = extractedQuery
                  .replace(/Time Period:.*$/s, '')
                  .replace(/User Question.*?framework\):\s*/is, '')
                  .replace(/User Context.*$/s, '')
                  .replace(/Selected Transits.*$/s, '')
                  .replace(/Generate.*$/s, '')
                  .replace(/\n+/g, ' ')
                  .trim();

                // If what's left is too short or looks like system text, it's custom mode without a query
                if (extractedQuery.length < 10 ||
                    extractedQuery.includes('weave these insights') ||
                    extractedQuery.includes('framework') ||
                    extractedQuery.includes('Time Period')) {
                  extractedQuery = ''; // No user query for custom mode
                }
              }

              userContent = extractedQuery;
              selectedTransits = horoscope.customTransitEvents?.length > 0 ? horoscope.customTransitEvents : undefined;
            } else if (horoscope.customTransitEvents?.length > 0) {
              // Custom-only mode: no user query, just selected transits
              userContent = '';
              selectedTransits = horoscope.customTransitEvents;
            } else {
              // Fallback for edge cases
              userContent = '';
            }

            const userMessage: HoroscopeChatMessage = {
              id: `history-user-${horoscope._id}`,
              type: 'user',
              content: userContent,
              timestamp: new Date(horoscope.generatedAt),
              mode: horoscope.metadata?.mode || (selectedTransits && selectedTransits.length > 0 ? (userContent ? 'hybrid' : 'custom') : 'chat'),
              selectedTransits,
            };
            transformedMessages.push(userMessage);

            // Parse referenced codes if present (for natal chart context)
            const referencedElements = horoscope.referencedCodes
              ? parseReferencedCodes(horoscope.referencedCodes)
              : undefined;

            // Create assistant message with the horoscope interpretation
            const assistantMessage: HoroscopeChatMessage = {
              id: `history-assistant-${horoscope._id}`,
              type: 'assistant',
              content: horoscope.interpretation,
              timestamp: new Date(horoscope.generatedAt),
              mode: horoscope.metadata?.mode || userMessage.mode,
              selectedTransits: horoscope.customTransitEvents || [],
              referencedElements,
            };
            transformedMessages.push(assistantMessage);
          });

          // Sort messages by timestamp (oldest first)
          transformedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          console.log('Final transformed custom horoscope messages:', transformedMessages.length);
          // Mark for one-time snap to bottom after history render
          didLoadInitialHistoryRef.current = true;
          setChatMessages(transformedMessages);
        } else {
          console.log('No custom horoscope history found or response unsuccessful');
        }
      } catch (err) {
        console.error('Failed to load custom horoscope history:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          userId,
        });
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadChatHistory();
  }, [userId]);

  // Check if user can submit
  const canSubmit = (): boolean => {
    const hasQuery = query.trim().length > 0;
    const hasTransits = selectedTransits.length > 0;
    return hasQuery || hasTransits;
  };

  // Get contextual hint
  const getHint = (): string => {
    // Show premium feature hint for free users
    if (subscriptionTier === 'free') {
      return '🔒 Premium Feature - Upgrade to ask Stellium custom questions about your transits';
    }

    const hasQuery = query.trim().length > 0;
    const hasTransits = selectedTransits.length > 0;

    if (!hasQuery && !hasTransits) {
      return 'Select transits or ask a question to get your custom horoscope';
    }
    if (hasQuery && hasTransits) {
      return "I'll create a custom horoscope about your selected transits and answer your question";
    }
    if (hasQuery) {
      return "I'll analyze current transits and answer your question";
    }
    return "I'll create a custom horoscope for your selected transits";
  };

  // Handle transit selection
  const handleSelectTransit = (transit: TransitEvent) => {
    setError(null);

    const transitId = `${transit.transitingPlanet}-${transit.aspect}-${transit.targetPlanet}-${transit.start}`;

    if (selectedTransits.some(t =>
      `${t.transitingPlanet}-${t.aspect}-${t.targetPlanet}-${t.start}` === transitId
    )) {
      // Remove transit
      setSelectedTransits(selectedTransits.filter(t =>
        `${t.transitingPlanet}-${t.aspect}-${t.targetPlanet}-${t.start}` !== transitId
      ));
    } else if (selectedTransits.length < 3) {
      // Add transit
      setSelectedTransits([...selectedTransits, transit]);
    } else {
      Alert.alert(
        'Selection Limit',
        'Maximum 3 transits can be selected. Deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Remove selected transit
  const handleRemoveTransit = (transit: TransitEvent) => {
    const transitId = `${transit.transitingPlanet}-${transit.aspect}-${transit.targetPlanet}-${transit.start}`;
    setSelectedTransits(selectedTransits.filter(t =>
      `${t.transitingPlanet}-${t.aspect}-${t.targetPlanet}-${t.start}` !== transitId
    ));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedTransits([]);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Please enter a query or select at least one transit');
      return;
    }

    // Check if free user - show paywall
    if (subscriptionTier === 'free') {
      try {
        await superwallService.showSettingsUpgradePaywall();
      } catch (error) {
        console.error('[HoroscopeChatTab] Failed to show paywall:', error);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create request
    const request: any = {};
    if (query.trim()) {
      request.query = query.trim();
    }
    if (selectedTransits.length > 0) {
      request.selectedTransits = selectedTransits;
    }

    // Add user message to chat if there's a query OR selected transits (for custom mode)
    if (query.trim() || selectedTransits.length > 0) {
      const userMessage: HoroscopeChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: query.trim(),
        timestamp: new Date(),
        selectedTransits: selectedTransits.length > 0 ? [...selectedTransits] : undefined,
        mode: query.trim() ? (selectedTransits.length > 0 ? 'hybrid' : 'chat') : 'custom',
      };

      setChatMessages(prev => [...prev, userMessage]);
    }

    // Clear form immediately after adding user message
    setQuery('');
    setSelectedTransits([]);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setChatMessages(prev => [...prev, {
      id: loadingId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    }]);

    try {
      const response = await horoscopesApi.generateCustomHoroscope(userId, request);

      if (response.success) {
        // Remove loading message and add actual response
        setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

        // Parse referenced codes from API response (for natal chart context)
        const referencedElements = response.horoscope.referencedCodes
          ? parseReferencedCodes(response.horoscope.referencedCodes)
          : undefined;

        const assistantMessage: HoroscopeChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: response.horoscope.interpretation,
          timestamp: new Date(),
          selectedTransits: response.horoscope.customTransitEvents || [],
          referencedElements,
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      // Remove loading message and add error
      setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

      const errorMessage: HoroscopeChatMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: err instanceof Error ? err.message : 'An error occurred while processing your request',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get transit display name
  const getTransitDisplayName = (transit: TransitEvent): string => {
    if (transit.description) {
      return transit.description;
    }

    let description = `${transit.transitingPlanet}`;

    if (transit.transitingSign) {
      description += ` in ${transit.transitingSign}`;
    }

    description += ` ${transit.aspect} `;

    if (transit.type === 'transit-to-natal') {
      description += `natal `;
    }

    if (transit.targetPlanet) {
      description += transit.targetPlanet;
    }

    if (transit.targetSign) {
      description += ` in ${transit.targetSign}`;
    }

    return description;
  };

  // Get aspect symbol
  const getAspectSymbol = (aspect: string): string => {
    const aspectSymbols: { [key: string]: string } = {
      'conjunction': '☌',
      'sextile': '⚹',
      'square': '□',
      'trine': '△',
      'opposition': '☍',
      'quincunx': '⚻',
    };
    return aspectSymbols[aspect?.toLowerCase()] || '';
  };

  // Render transit description with symbols
  const TransitDescriptionWithSymbols: React.FC<{
    transit: TransitEvent;
    textStyle: any;
    iconSize?: number;
    iconColor?: string;
  }> = ({ transit, textStyle, iconSize = 14, iconColor = colors.onPrimaryContainer }) => {
    if (transit.description) {
      return <Text style={textStyle}>{transit.description}</Text>;
    }

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Transiting Planet */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AstroIcon type="planet" name={transit.transitingPlanet} size={iconSize} color={iconColor} />
          <Text style={textStyle}> {transit.transitingPlanet}</Text>
        </View>

        {/* Sign */}
        {transit.transitingSign && (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.transitingSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.transitingSign}</Text>
            </View>
          </>
        )}

        {/* Aspect */}
        <Text style={textStyle}> {getAspectSymbol(transit.aspect)} {transit.aspect} </Text>

        {/* Target */}
        {transit.type === 'transit-to-natal' && <Text style={textStyle}>natal </Text>}
        {transit.targetPlanet && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AstroIcon type="planet" name={transit.targetPlanet} size={iconSize} color={iconColor} />
            <Text style={textStyle}> {transit.targetPlanet}</Text>
          </View>
        )}

        {/* Target sign */}
        {transit.targetSign && (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.targetSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.targetSign}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  // Show loading state for transit windows
  if (transitWindowsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading available transits...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state for transit windows
  if (transitWindowsError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>
            Unable to Load Transit Data
          </Text>
          <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            We're experiencing issues loading transit data. Please try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.error }]}
            onPress={onRetryTransitWindows}
          >
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatMessages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatMessagesContent}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
      >
        {isHistoryLoading && chatMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
              Loading horoscope history...
            </Text>
          </View>
        ) : chatMessages.length === 0 && !isHistoryLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Ask Stellium
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Select specific transits and/or ask questions to get personalized astrological insights.
            </Text>
          </View>
        ) : (
          chatMessages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>
              <View style={[
                styles.messageBubble,
                message.type === 'user'
                  ? [styles.userMessage, { backgroundColor: colors.primary }]
                  : message.type === 'error'
                  ? [styles.errorMessage, { backgroundColor: colors.errorContainer }]
                  : [styles.assistantMessage, { backgroundColor: colors.surface }],
              ]}>
                {message.loading ? (
                  <View style={styles.loadingDots}>
                    <View style={[styles.dot, { backgroundColor: colors.onSurface }]} />
                    <View style={[styles.dot, { backgroundColor: colors.onSurface }]} />
                    <View style={[styles.dot, { backgroundColor: colors.onSurface }]} />
                  </View>
                ) : (
                  <>
                    <Text style={[
                      styles.messageText,
                      {
                        color: message.type === 'user'
                          ? colors.onPrimary
                          : message.type === 'error'
                          ? colors.onErrorContainer
                          : colors.onSurface,
                      },
                    ]}>
                      {message.content}
                    </Text>

                    {/* Selected transits for user messages - only show if mode is custom or hybrid */}
                    {message.type === 'user' && message.selectedTransits && message.selectedTransits.length > 0 && (message.mode === 'custom' || message.mode === 'hybrid') && (
                      <View style={[styles.inlineTransitChips, { backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8, marginTop: 8 }]}>
                        <Text style={[styles.selectedTransitsLabel, { color: colors.onPrimary, fontWeight: 'bold' }]}>
                          Selected transits:
                        </Text>
                        {message.selectedTransits.map((transit, idx) => (
                          <View key={idx} style={[styles.inlineTransitChip, {
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderColor: 'rgba(255,255,255,1)',
                            borderWidth: 2,
                          }]}>
                            <TransitDescriptionWithSymbols
                              transit={transit}
                              textStyle={[styles.inlineTransitChipText, { color: colors.primary, fontWeight: 'bold' }]}
                              iconSize={12}
                              iconColor={colors.primary}
                            />
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Analyzed transits for assistant messages - always show if present */}
                    {message.type === 'assistant' && message.selectedTransits && message.selectedTransits.length > 0 && (
                      <View style={[styles.inlineTransitChips, { backgroundColor: colors.surfaceVariant, padding: 8, borderRadius: 8, marginTop: 8 }]}>
                        <Text style={[styles.selectedTransitsLabel, { color: colors.onSurfaceVariant, fontWeight: 'bold' }]}>
                          {/* Show "Selected transits" for custom/hybrid mode, "Analyzed transits" for chat mode */}
                          {message.mode === 'custom' || message.mode === 'hybrid' ? 'Selected transits:' : 'Analyzed transits:'}
                        </Text>
                        {message.selectedTransits.map((transit, idx) => (
                          <View key={idx} style={[styles.inlineTransitChip, {
                            backgroundColor: colors.surface,
                            borderColor: colors.outline,
                            borderWidth: 1,
                          }]}>
                            <TransitDescriptionWithSymbols
                              transit={transit}
                              textStyle={[styles.inlineTransitChipText, { color: colors.onSurface }]}
                              iconSize={12}
                              iconColor={colors.onSurface}
                            />
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Referenced elements for assistant messages (natal chart context) */}
                    {message.type === 'assistant' && message.referencedElements && message.referencedElements.length > 0 && (
                      <View style={[styles.inlineTransitChips, { backgroundColor: colors.primaryContainer, padding: 8, borderRadius: 8, marginTop: 8 }]}>
                        <Text style={[styles.selectedTransitsLabel, { color: colors.onPrimaryContainer, fontWeight: 'bold' }]}>
                          Referenced elements:
                        </Text>
                        {message.referencedElements.map((element, idx) => (
                          <View key={`ref-${idx}`} style={[styles.inlineTransitChip, {
                            backgroundColor: colors.surface,
                            borderColor: colors.primary,
                            borderWidth: 1,
                          }]}>
                            <Text style={[styles.inlineTransitChipText, { color: colors.onSurface }]}>
                              {element.pretty}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>

              <Text style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Selected Transits Chip Rail */}
      {selectedTransits.length > 0 && (
        <View style={[styles.chipRail, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRailContent}
          >
            {selectedTransits.map((transit, idx) => (
              <View key={idx} style={[styles.selectedChip, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.selectedChipText, { color: colors.onPrimaryContainer }]}>
                  {getTransitDisplayName(transit)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTransit(transit)}
                  style={styles.removeChipButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.removeChipText, { color: colors.onPrimaryContainer }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleClearSelection}
              style={[styles.clearAllButton, { backgroundColor: colors.errorContainer }]}
            >
              <Text style={[styles.clearAllText, { color: colors.onErrorContainer }]}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Input Section */}
      <View style={[styles.inputSection, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Contextual Hint */}
        <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
          {getHint()}
        </Text>


        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ask a question about your horoscope..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.textInput, {
              backgroundColor: colors.background,
              color: colors.onSurface,
              borderColor: colors.border,
            }]}
            multiline
            maxLength={500}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setShowBottomSheet(true)}
              style={[styles.addButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.addButtonText, { color: colors.onSecondary }]}>
                +Add Transit Details ({selectedTransits.length}/3)
              </Text>
            </TouchableOpacity>

            {subscriptionTier === 'free' ? (
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.sendButtonText, { color: colors.onPrimary }]}>
                  Upgrade to Use
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.sendButtonContainer}>
                <CreditActionButton
                  cost={CREDIT_COSTS.askStelliumQuestion}
                  actionText={isLoading ? 'Sending...' : 'Send'}
                  onPress={handleSubmit}
                  disabled={!canSubmit()}
                  loading={isLoading}
                />
              </View>
            )}
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>

      {/* Bottom Sheet */}
      <HoroscopeTransitsBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        transitWindows={transitWindows}
        selectedTransits={selectedTransits}
        onSelectTransit={handleSelectTransit}
        onClearSelection={handleClearSelection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  errorMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  chipRail: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  chipRailContent: {
    paddingRight: 16,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 150,
  },
  removeChipButton: {
    marginLeft: 6,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeChipText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  hint: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'column',
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'top',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  addButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonContainer: {
    flex: 1,
    marginLeft: 8,
    marginTop: 20,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  inlineTransitChips: {
    marginTop: 8,
  },
  selectedTransitsLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  inlineTransitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  inlineTransitChipText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default HoroscopeChatTab;
