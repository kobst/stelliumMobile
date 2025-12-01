import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { BirthChartElement, BirthChartChatMessage, chartsApi } from '../../api/charts';
import { BirthChart } from '../../types';
import BirthChartElementsBottomSheet from './BirthChartElementsBottomSheet';
import { useCreditsGate } from '../../hooks/useCreditsGate';
import { parseReferencedCodes, convertToBirthChartElements } from '../../utils/parseReferencedCodes';
import { CreditActionButton } from '../ui/CreditActionButton';
import { CREDIT_COSTS } from '../../config/subscriptionConfig';

interface BirthChartChatTabProps {
  subjectId: string; // Subject ID - user's own ID for their chart, or guest subject _id for guest charts
  birthChart: BirthChart;
  preSelectedElements?: BirthChartElement[];
  guestFirstName?: string; // First name of guest if this is a guest chart
}

const BirthChartChatTab: React.FC<BirthChartChatTabProps> = ({
  subjectId,
  birthChart,
  preSelectedElements = [],
  guestFirstName,
}) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Credits gate hook
  const { checkAndProceed, isChecking, canAfford } = useCreditsGate();

  // State management
  const [selectedElements, setSelectedElements] = useState<BirthChartElement[]>(preSelectedElements);
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<BirthChartChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages, isLoading]);

  // Load chat history when component mounts or when subjectId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!subjectId) {return;}

      console.log('Loading birth chart chat history for subject:', subjectId);
      setIsHistoryLoading(true);
      setChatMessages([]); // Clear existing messages when loading new chat history

      try {
        const response = await chartsApi.fetchBirthChartEnhancedChatHistory(subjectId, 50);
        console.log('Birth chart chat history response:', response);
        console.log('Raw chat history array:', JSON.stringify(response.chatHistory, null, 2));

        if (response && response.success && response.chatHistory && Array.isArray(response.chatHistory)) {
          console.log('Processing', response.chatHistory.length, 'birth chart chat messages');

          // Process messages and link assistant responses to user queries
          const transformedMessages: BirthChartChatMessage[] = [];

          for (let index = 0; index < response.chatHistory.length; index++) {
            const msg = response.chatHistory[index];
            console.log(`Birth chart message ${index}:`, {
              role: msg.role,
              hasMetadata: !!msg.metadata,
              mode: msg.metadata?.mode,
              hasSelectedAspects: !!msg.metadata?.selectedAspects,
              selectedAspectsLength: msg.metadata?.selectedAspects?.length,
            });

            // Parse referenced codes if present in messages (can be in user or assistant messages)
            // Check both metadata.referencedCodes (expected) and msg.referencedCodes (backend bug fallback)
            const referencedCodes = msg.metadata?.referencedCodes || (msg as any).referencedCodes;

            // Log what we found
            if (referencedCodes && referencedCodes.length > 0) {
              console.log(`[BirthChartChat] Found referencedCodes in ${msg.role} message:`, referencedCodes);
            }

            const referencedElements = referencedCodes && referencedCodes.length > 0
              ? convertToBirthChartElements(parseReferencedCodes(referencedCodes))
              : undefined;

            // Filter out backend-generated default text for custom mode
            let messageContent = msg.content;
            if (msg.role === 'user' && msg.metadata?.mode === 'custom') {
              // Check if content matches common default patterns
              const defaultPatterns = [
                /^What can you tell me about these (aspects?|elements?|chart elements?)\??$/i,
                /^Generated? (natal|birth)?\s*chart (analysis|reading) for/i,
                /^Custom (analysis|reading) for/i,
              ];
              const isDefaultText = defaultPatterns.some(pattern => pattern.test(msg.content.trim()));
              if (isDefaultText) {
                messageContent = ''; // Clear default text for custom mode
              }
            }

            const transformedMessage: BirthChartChatMessage = {
              id: `history-${index}-${Date.now()}`,
              type: msg.role === 'user' ? 'user' : 'assistant',
              content: messageContent,
              timestamp: new Date(msg.timestamp),
              selectedElements: msg.metadata?.selectedAspects || undefined, // Birth chart API uses selectedAspects
              referencedElements,
            };

            // For assistant messages with metadata, also assign to the previous user message if it doesn't have metadata
            if (msg.role === 'assistant' && msg.metadata && index > 0) {
              const prevMsg = response.chatHistory[index - 1];
              if (prevMsg.role === 'user' && !prevMsg.metadata) {
                // The user message that prompted this assistant response should inherit the elements
                const prevTransformedMsg = transformedMessages[transformedMessages.length - 1];
                if (prevTransformedMsg && prevTransformedMsg.type === 'user') {
                  prevTransformedMsg.selectedElements = msg.metadata.selectedAspects; // Birth chart API uses selectedAspects
                }
              }
            }

            // For assistant messages without metadata, try to inherit from the previous user message
            if (msg.role === 'assistant' && !msg.metadata?.selectedAspects && index > 0) {
              const prevMsg = response.chatHistory[index - 1];
              if (prevMsg.role === 'user' && prevMsg.metadata) {
                transformedMessage.selectedElements = prevMsg.metadata.selectedAspects; // Birth chart API uses selectedAspects
              }
            }

            // If this is a user message with referencedElements, transfer them to the next assistant message
            if (msg.role === 'user' && referencedElements && referencedElements.length > 0) {
              // Store them temporarily, will be assigned to next assistant message below
              transformedMessage.referencedElements = referencedElements;
            }

            transformedMessages.push(transformedMessage);

            // If the previous message was a user message with referencedElements, transfer them to this assistant message
            if (msg.role === 'assistant' && transformedMessages.length >= 2) {
              const prevMessage = transformedMessages[transformedMessages.length - 2];
              if (prevMessage.type === 'user' && prevMessage.referencedElements) {
                console.log('[BirthChartChat] Transferring referencedElements from user message to assistant message');
                transformedMessage.referencedElements = prevMessage.referencedElements;
                // Clear from user message since we don't display them there
                delete prevMessage.referencedElements;
              }
            }
          }

          // Debug: Log final transformed messages
          console.log('Final transformed birth chart messages:');
          transformedMessages.forEach((msg, idx) => {
            console.log(`Message ${idx}:`, {
              type: msg.type,
              hasSelectedElements: !!msg.selectedElements,
              selectedElementsCount: msg.selectedElements?.length,
            });
          });

          setChatMessages(transformedMessages);
        } else {
          console.log('No birth chart chat history found or response unsuccessful. Response structure:', {
            hasResponse: !!response,
            success: response?.success,
            hasChatHistory: !!response?.chatHistory,
            isArray: Array.isArray(response?.chatHistory),
            chatHistoryType: typeof response?.chatHistory,
          });
        }
      } catch (err) {
        console.error('Failed to load birth chart chat history:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          subjectId,
          stack: err instanceof Error ? err.stack : undefined,
        });

        // Show a user-friendly message that chat history couldn't be loaded
        // but don't block the user from starting new conversations
        console.log('Birth chart chat history unavailable, but new conversations will work');
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadChatHistory();
  }, [subjectId]);

  // Check if user can submit
  const canSubmit = (): boolean => {
    const hasQuery = query.trim().length > 0;
    const hasElements = selectedElements.length > 0;
    return hasQuery || hasElements;
  };

  // Get contextual hint
  const getHint = (): string => {
    const hasQuery = query.trim().length > 0;
    const hasElements = selectedElements.length > 0;
    const chartOwner = guestFirstName ? `${guestFirstName}'s natal chart` : 'your birth chart';

    if (!hasQuery && !hasElements) {return 'Select chart elements or ask a question to get started';}
    if (hasQuery && hasElements) {return "I'll answer your question about the selected chart elements";}
    if (hasQuery) {return `I'll answer your question about ${chartOwner}`;}
    return `I'll analyze the selected chart elements`;
  };

  // Handle element selection
  const handleSelectElement = (element: BirthChartElement) => {
    setError(null);

    const elementId = element.type === 'aspect'
      ? `${element.planet1}-${element.aspectType}-${element.planet2}`
      : `${element.planet}-${element.sign}`;

    if (selectedElements.some(el => {
      const elId = el.type === 'aspect'
        ? `${el.planet1}-${el.aspectType}-${el.planet2}`
        : `${el.planet}-${el.sign}`;
      return elId === elementId;
    })) {
      setSelectedElements(selectedElements.filter(el => {
        const elId = el.type === 'aspect'
          ? `${el.planet1}-${el.aspectType}-${el.planet2}`
          : `${el.planet}-${el.sign}`;
        return elId !== elementId;
      }));
    } else if (selectedElements.length < 3) {
      setSelectedElements([...selectedElements, element]);
    } else {
      Alert.alert(
        'Selection Limit',
        'Maximum 3 aspects and positions — deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Remove selected element
  const handleRemoveElement = (element: BirthChartElement) => {
    const elementId = element.type === 'aspect'
      ? `${element.planet1}-${element.aspectType}-${element.planet2}`
      : `${element.planet}-${element.sign}`;

    setSelectedElements(selectedElements.filter(el => {
      const elId = el.type === 'aspect'
        ? `${el.planet1}-${el.aspectType}-${el.planet2}`
        : `${el.planet}-${el.sign}`;
      return elId !== elementId;
    }));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedElements([]);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Please enter a query or select at least one chart element');
      return;
    }

    // Check credits and proceed with chat message
    const allowed = await checkAndProceed({
      action: 'askStelliumQuestion',
      source: 'birth_chart_chat',
      onProceed: async () => {
        setIsLoading(true);
        setError(null);

        // Create request body - birth chart API expects selectedAspects, not selectedElements
        const requestBody: { query?: string; selectedAspects?: BirthChartElement[] } = {};
        if (query.trim()) {
          requestBody.query = query.trim();
        }
        if (selectedElements.length > 0) {
          requestBody.selectedAspects = selectedElements; // Backend expects selectedAspects
        }

        // Add user message to chat if there's a query OR selected elements (for custom mode)
        if (query.trim() || selectedElements.length > 0) {
          const userMessage: BirthChartChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: query.trim(),
            timestamp: new Date(),
            selectedElements: selectedElements.length > 0 ? [...selectedElements] : undefined,
            mode: query.trim() ? (selectedElements.length > 0 ? 'hybrid' : 'chat') : 'custom',
          };

          console.log('Creating user message with selectedElements:', {
            hasSelectedElements: !!userMessage.selectedElements,
            selectedElementsCount: userMessage.selectedElements?.length,
            selectedElements: userMessage.selectedElements,
            mode: userMessage.mode,
          });

          setChatMessages(prev => [...prev, userMessage]);
        }

        // Clear form immediately after adding user message
        setQuery('');
        setSelectedElements([]);

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
          const response = await chartsApi.enhancedChatForBirthChart(subjectId, requestBody);

          console.log('[BirthChartChat] 📥 RAW API Response:', JSON.stringify(response, null, 2));
          console.log('[BirthChartChat] 📥 New response received:', {
            hasReferencedCodes: !!response.referencedCodes,
            referencedCodes: response.referencedCodes,
            referencedCodesLength: response.referencedCodes?.length,
            success: response.success,
            hasAnswer: !!response.answer,
            mode: response.mode,
          });

          if (response.success) {
            // Remove loading message and add actual response
            setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

            // Parse referenced codes from API response
            const referencedElements = response.referencedCodes
              ? convertToBirthChartElements(parseReferencedCodes(response.referencedCodes))
              : undefined;

            if (referencedElements && referencedElements.length > 0) {
              console.log('[BirthChartChat] ✨ Parsed new message referenced elements:', referencedElements);
            } else {
              console.log('[BirthChartChat] ⚠️ No referencedCodes in new message response');
            }

            const assistantMessage: BirthChartChatMessage = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: response.answer,
              timestamp: new Date(),
              referencedElements,
            };
            setChatMessages(prev => [...prev, assistantMessage]);
          } else {
            throw new Error('Failed to get response');
          }
        } catch (err) {
          // Remove loading message and add error
          setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

          const errorMessage: BirthChartChatMessage = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: err instanceof Error ? err.message : 'An error occurred while processing your request',
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, errorMessage]);
          throw err; // Re-throw to let credit gate handle it
        } finally {
          setIsLoading(false);
        }
      },
    });

    if (!allowed) {
      console.log('Birth Chart Chat - User did not have enough credits or cancelled paywall');
    }
  };

  // Get element display name - human readable format (consistent with relationship chat)
  const getElementDisplayName = (element: BirthChartElement): string => {
    if (element.type === 'aspect') {
      // Get full aspect name
      const aspectName = element.aspectType?.charAt(0).toUpperCase() + element.aspectType?.slice(1) || 'aspect';

      return `Natal Chart: ${element.planet1} ${aspectName} ${element.planet2}`;
    }

    if (element.type === 'position') {
      const houseText = element.house ? ` in ${getOrdinal(element.house)} house` : '';
      const retroText = element.isRetrograde ? ' ℞' : '';

      return `Natal Chart: ${element.planet} in ${element.sign}${houseText}${retroText}`;
    }

    return 'Unknown Element';
  };

  // Helper function for ordinal numbers
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatMessages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatMessagesContent}
      >
        {isHistoryLoading && chatMessages.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
              Loading chat history...
            </Text>
          </View>
        )}

        {chatMessages.length === 0 && !isHistoryLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Ask Stellium
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Add chart elements (+) to focus on. Or just ask a question.
            </Text>

          </View>
        ) : (
          chatMessages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>

              {/* Show analysis indicator above assistant messages when elements are involved */}
              {message.type === 'assistant' && message.selectedElements && message.selectedElements.length > 0 && (
                <View style={[styles.assistantElementsHeader, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.assistantElementsTitle, { color: colors.onSurfaceVariant }]}>
                    ✨ Analysis with selected elements
                  </Text>
                </View>
              )}

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

                    {/* Selected elements for user messages */}
                    {message.type === 'user' && message.selectedElements && message.selectedElements.length > 0 && (
                      <View style={[styles.inlineElementChips, { backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8, marginTop: 8 }]}>
                        <Text style={[styles.selectedElementsLabel, { color: colors.onPrimary, fontWeight: 'bold' }]}>
                          Selected elements:
                        </Text>
                        {message.selectedElements.map((element, idx) => {
                          const displayName = getElementDisplayName(element);
                          return (
                            <View key={`${element.type}-${idx}-${element.code || element.planet || idx}`} style={[styles.inlineElementChip, {
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              borderColor: 'rgba(255,255,255,1)',
                              borderWidth: 2,
                            }]}>
                              <Text style={[styles.inlineElementChipText, { color: colors.primary, fontWeight: 'bold' }]}>
                                {displayName}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Referenced elements for assistant messages */}
                    {message.type === 'assistant' && message.referencedElements && message.referencedElements.length > 0 && (
                      <View style={[styles.inlineElementChips, { backgroundColor: colors.surfaceVariant, padding: 8, borderRadius: 8, marginTop: 8 }]}>
                        <Text style={[styles.selectedElementsLabel, { color: colors.onSurfaceVariant, fontWeight: 'bold' }]}>
                          Referenced elements:
                        </Text>
                        {message.referencedElements.map((element, idx) => {
                          const displayName = getElementDisplayName(element);
                          return (
                            <View key={`ref-${element.type}-${idx}-${element.code || element.planet || idx}`} style={[styles.inlineElementChip, {
                              backgroundColor: colors.primaryContainer,
                              borderColor: colors.primary,
                              borderWidth: 1,
                            }]}>
                              <Text style={[styles.inlineElementChipText, { color: colors.onPrimaryContainer, fontWeight: '600' }]}>
                                {displayName}
                              </Text>
                            </View>
                          );
                        })}
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

      {/* Selected Elements Chip Rail */}
      {selectedElements.length > 0 && (
        <View style={[styles.chipRail, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRailContent}
          >
            {selectedElements.map((element, idx) => (
              <View key={idx} style={[styles.selectedChip, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.selectedChipText, { color: colors.onPrimaryContainer }]}>
                  {getElementDisplayName(element)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveElement(element)}
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
        {/* Input Row with Plus Button and Text Input with Embedded Send Button */}
        <View style={styles.inputRow}>
          {/* Plus Button */}
          <TouchableOpacity
            onPress={() => setShowBottomSheet(true)}
            style={[styles.plusButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={[styles.plusButtonText, { color: colors.onSurfaceVariant }]}>+</Text>
          </TouchableOpacity>

          {/* Text Input Wrapper with Embedded Send Button */}
          <View style={styles.inputWrapper}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask a question"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.onSurface,
                borderColor: colors.border,
              }]}
              multiline
              maxLength={500}
            />

            {/* Embedded Send Button */}
            <View style={styles.embeddedButtonContainer}>
              <CreditActionButton
                cost={CREDIT_COSTS.askStelliumQuestion}
                actionText="↑"
                onPress={handleSubmit}
                disabled={!canSubmit()}
                loading={isLoading || isChecking}
                compact={true}
              />
            </View>
          </View>
        </View>

        {/* Contextual Hint - Moved Below Input */}
        <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
          Add chart elements (+) to focus on. Or just ask a question.
        </Text>

        {/* Error Message */}
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>

      {/* Bottom Sheet */}
      <BirthChartElementsBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        birthChart={birthChart}
        selectedElements={selectedElements}
        onSelectElement={handleSelectElement}
        onClearSelection={handleClearSelection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  assistantElementsHeader: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  assistantElementsTitle: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
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
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    fontSize: 24,
    fontWeight: '400',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 72,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  embeddedButtonContainer: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // Inline element chips in user messages
  inlineElementChips: {
    marginTop: 8,
  },
  selectedElementsLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  inlineElementChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  inlineElementChipText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default BirthChartChatTab;
