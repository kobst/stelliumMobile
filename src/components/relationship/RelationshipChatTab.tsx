import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoredItem } from '../../api/relationships';
import { relationshipsApi } from '../../api/relationships';
import ConsolidatedItemsBottomSheet from './ConsolidatedItemsBottomSheet';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  mode?: 'chat' | 'custom' | 'hybrid';
  selectedElements?: ClusterScoredItem[];
  elementCount?: number;
  loading?: boolean;
}

interface RelationshipChatTabProps {
  compositeChartId: string;
  consolidatedItems: ClusterScoredItem[];
  preSelectedItems?: ClusterScoredItem[];
  userAName: string;
  userBName: string;
}

const RelationshipChatTab: React.FC<RelationshipChatTabProps> = ({
  compositeChartId,
  consolidatedItems,
  preSelectedItems = [],
  userAName,
  userBName,
}) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // State management
  const [selectedElements, setSelectedElements] = useState<ClusterScoredItem[]>(preSelectedItems);
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!compositeChartId || chatMessages.length > 0) {return;}

      console.log('Loading chat history for relationship:', compositeChartId);
      setIsHistoryLoading(true);

      try {
        const response = await relationshipsApi.fetchRelationshipEnhancedChatHistory(compositeChartId, 50);
        console.log('Chat history response:', response);

        if (response && response.success && response.chatHistory && Array.isArray(response.chatHistory)) {
          console.log('Processing', response.chatHistory.length, 'chat messages');
          // Process messages and link assistant responses to user queries
          const transformedMessages: ChatMessage[] = [];

          for (let index = 0; index < response.chatHistory.length; index++) {
            const msg = response.chatHistory[index];
            console.log(`Message ${index}:`, {
              role: msg.role,
              hasMetadata: !!msg.metadata,
              mode: msg.metadata?.mode,
              elementCount: msg.metadata?.elementCount,
              hasSelectedElements: !!msg.metadata?.selectedElements,
              selectedElementsLength: msg.metadata?.selectedElements?.length,
            });

            const transformedMessage: ChatMessage = {
              id: `history-${index}-${Date.now()}`,
              type: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              mode: msg.metadata?.mode || undefined,
              selectedElements: msg.metadata?.selectedElements || undefined,
              elementCount: msg.metadata?.elementCount || undefined,
            };

            // For assistant messages with metadata, also assign to the previous user message if it doesn't have metadata
            if (msg.role === 'assistant' && msg.metadata && index > 0) {
              const prevMsg = response.chatHistory[index - 1];
              if (prevMsg.role === 'user' && !prevMsg.metadata) {
                // The user message that prompted this assistant response should inherit the elements
                const prevTransformedMsg = transformedMessages[transformedMessages.length - 1];
                if (prevTransformedMsg && prevTransformedMsg.type === 'user') {
                  prevTransformedMsg.mode = msg.metadata.mode;
                  prevTransformedMsg.selectedElements = msg.metadata.selectedElements;
                  prevTransformedMsg.elementCount = msg.metadata.elementCount;
                }
              }
            }

            // For assistant messages without metadata, try to inherit from the previous user message
            if (msg.role === 'assistant' && !msg.metadata?.mode && index > 0) {
              const prevMsg = response.chatHistory[index - 1];
              if (prevMsg.role === 'user' && prevMsg.metadata) {
                transformedMessage.mode = prevMsg.metadata.mode;
                transformedMessage.selectedElements = prevMsg.metadata.selectedElements;
                transformedMessage.elementCount = prevMsg.metadata.elementCount;
              }
            }

            transformedMessages.push(transformedMessage);
          }

          // Debug: Log final transformed messages
          console.log('Final transformed messages:');
          transformedMessages.forEach((msg, idx) => {
            console.log(`Message ${idx}:`, {
              type: msg.type,
              hasSelectedElements: !!msg.selectedElements,
              selectedElementsCount: msg.selectedElements?.length,
              mode: msg.mode,
              elementCount: msg.elementCount,
            });
          });

          setChatMessages(transformedMessages);
        } else {
          console.log('No chat history found or response unsuccessful. Response structure:', {
            hasResponse: !!response,
            success: response?.success,
            hasChatHistory: !!response?.chatHistory,
            isArray: Array.isArray(response?.chatHistory),
            chatHistoryType: typeof response?.chatHistory,
          });
        }
      } catch (err) {
        console.error('Failed to load relationship chat history:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          compositeChartId,
          stack: err instanceof Error ? err.stack : undefined,
        });

        // Show a user-friendly message that chat history couldn't be loaded
        // but don't block the user from starting new conversations
        console.log('Chat history unavailable, but new conversations will work');
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadChatHistory();
  }, [compositeChartId]);

  // Client-side mode detection
  const getMode = (): 'chat' | 'custom' | 'hybrid' | null => {
    const hasQuery = query.trim().length > 0;
    const hasElements = selectedElements.length > 0;

    if (hasQuery && hasElements) {return 'hybrid';}
    if (hasQuery) {return 'chat';}
    if (hasElements) {return 'custom';}
    return null;
  };

  // Get contextual hint based on current mode
  const getHint = (mode: string | null): string => {
    if (!mode) {return 'Select items or ask a question to get started';}
    if (mode === 'custom') {return "I'll analyze your selected items";}
    if (mode === 'chat') {return "I'll answer your question about the relationship";}
    return "I'll answer your question about the selected items";
  };

  // Handle element selection
  const handleSelectElement = (element: ClusterScoredItem) => {
    setError(null);

    if (selectedElements.some(el => el.id === element.id)) {
      setSelectedElements(selectedElements.filter(el => el.id !== element.id));
    } else if (selectedElements.length < 4) {
      setSelectedElements([...selectedElements, element]);
    } else {
      Alert.alert(
        'Selection Limit',
        'Maximum 4 items — deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Remove selected element
  const handleRemoveElement = (elementId: string) => {
    setSelectedElements(selectedElements.filter(el => el.id !== elementId));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedElements([]);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const currentMode = getMode();

    if (!currentMode) {
      setError('Please enter a query or select at least one relationship element');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create request body based on mode
    const requestBody: { query?: string; scoredItems?: ClusterScoredItem[] } = {};
    if (query.trim()) {
      requestBody.query = query.trim();
    }
    if (selectedElements.length > 0) {
      requestBody.scoredItems = selectedElements;
    }

    // Add user message to chat if there's a query
    if (query.trim()) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: query.trim(),
        timestamp: new Date(),
        selectedElements: selectedElements.length > 0 ? [...selectedElements] : undefined,
      };
      setChatMessages(prev => [...prev, userMessage]);
    }

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
      const response = await relationshipsApi.enhancedChatForRelationship(compositeChartId, requestBody);

      if (response.success) {
        // Remove loading message and add actual response
        setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: response.analysis || response.answer, // Handle both field names for compatibility
          timestamp: new Date(),
          mode: response.mode,
        };
        setChatMessages(prev => [...prev, assistantMessage]);

        // Clear form after successful submission
        setQuery('');
        setSelectedElements([]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (err) {
      // Remove loading message and add error
      setChatMessages(prev => prev.filter(msg => msg.id !== loadingId));

      const errorMessage: ChatMessage = {
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

  // Get element display name - human readable format
  const getElementDisplayName = (element: ClusterScoredItem): string => {
    const chartType = element.source === 'synastry' ? 'Synastry' :
                     element.source === 'composite' ? 'Composite' :
                     element.source === 'synastryHousePlacement' ? 'Synastry' :
                     element.source === 'compositeHousePlacement' ? 'Composite' : 'Chart';

    if (element.type === 'aspect') {
      // Get full planet names
      const planet1Name = element.planet1 === 'ascendant' ? 'Ascendant' :
                         element.planet1 === 'midheaven' ? 'Midheaven' :
                         element.planet1?.charAt(0).toUpperCase() + element.planet1?.slice(1) || 'Planet';
      const planet2Name = element.planet2 === 'ascendant' ? 'Ascendant' :
                         element.planet2 === 'midheaven' ? 'Midheaven' :
                         element.planet2?.charAt(0).toUpperCase() + element.planet2?.slice(1) || 'Planet';

      // Get full aspect name
      const aspectName = element.aspect?.charAt(0).toUpperCase() + element.aspect?.slice(1) || 'aspect';

      return `${chartType}: ${userAName}'s ${planet1Name} ${aspectName} ${userBName}'s ${planet2Name}`;
    }

    if (element.type === 'housePlacement') {
      const planetName = element.planet === 'ascendant' ? 'Ascendant' :
                        element.planet === 'midheaven' ? 'Midheaven' :
                        element.planet?.charAt(0).toUpperCase() + element.planet?.slice(1) || 'Planet';

      return `${chartType}: ${planetName} in House ${element.house}`;
    }

    return element.description?.substring(0, 50) || 'Unknown Element';
  };

  const currentMode = getMode();

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
            <Text style={[styles.emptyIcon]}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Start a Conversation
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Select relationship elements and/or ask questions to get personalized astrological insights about your compatibility.
            </Text>

          </View>
        ) : (
          chatMessages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>

              {/* Show analysis mode indicator above assistant messages */}
              {message.type === 'assistant' && message.mode && message.mode !== 'chat' && (
                <View style={[styles.assistantElementsHeader, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.assistantElementsTitle, { color: colors.onSurfaceVariant }]}>
                    💭 {message.mode === 'custom' ? 'Analysis of selected elements' : 'Analysis with selected elements'}
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
                      <View style={styles.inlineElementChips}>
                        <Text style={[styles.selectedElementsLabel, { color: colors.onPrimary }]}>
                          Selected elements:
                        </Text>
                        {message.selectedElements.map((element, idx) => (
                          <View key={idx} style={[styles.inlineElementChip, {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderColor: 'rgba(255,255,255,0.3)',
                          }]}>
                            <Text style={[styles.inlineElementChipText, { color: colors.onPrimary }]}>
                              {getElementDisplayName(element)}
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
                {message.mode && ` • ${message.mode}`}
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
            {selectedElements.map((element) => (
              <View key={element.id} style={[styles.selectedChip, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.selectedChipText, { color: colors.onPrimaryContainer }]}>
                  {getElementDisplayName(element)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveElement(element.id)}
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
          {getHint(currentMode)}
        </Text>

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ask a question about your relationship..."
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
                +Add Elements ({selectedElements.length}/4)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!currentMode || isLoading}
              style={[
                styles.sendButton,
                {
                  backgroundColor: currentMode && !isLoading ? colors.primary : colors.surfaceVariant,
                  opacity: currentMode && !isLoading ? 1 : 0.5,
                },
              ]}
            >
              <Text style={[
                styles.sendButtonText,
                { color: currentMode && !isLoading ? colors.onPrimary : colors.onSurfaceVariant },
              ]}>
                Send
              </Text>
            </TouchableOpacity>
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
      <ConsolidatedItemsBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        scoredItems={consolidatedItems}
        selectedElements={selectedElements}
        onSelectElement={handleSelectElement}
        onClearSelection={handleClearSelection}
        userAName={userAName}
        userBName={userBName}
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  selectedElementsHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  elementsHeaderTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  userElementsHeader: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  userElementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  userElementPreviewChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
  },
  userElementPreviewText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'monospace',
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
  elementsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  elementPreviewChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  elementPreviewText: {
    fontSize: 10,
    fontWeight: '500',
  },
  elementPreviewMore: {
    fontSize: 10,
    fontStyle: 'italic',
    alignSelf: 'center',
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

export default RelationshipChatTab;
