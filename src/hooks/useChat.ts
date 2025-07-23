import { useState, useEffect, useCallback } from 'react';
import {
  chatApi,
  ChatMessage,
  ChatResponse,
  ApiError,
} from '../api';
import { useStore } from '../store';

export type ChatContext = 'birth_chart' | 'relationship' | 'general';

export interface UseChatReturn {
  messages: ChatMessage[];
  suggestedQuestions: string[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: ChatContext, relationshipId?: string) => Promise<ChatResponse | null>;
  loadChatHistory: (context?: ChatContext, limit?: number) => Promise<void>;
  getSuggestions: (context: ChatContext, relationshipId?: string) => Promise<void>;
  clearHistory: (context?: ChatContext) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  rateResponse: (messageId: string, rating: 'helpful' | 'not_helpful', feedback?: string) => Promise<boolean>;
  clearError: () => void;
}

export const useChat = (
  defaultContext: ChatContext = 'general',
  relationshipId?: string
): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userData } = useStore();

  const clearError = () => setError(null);

  const sendMessage = useCallback(async (
    message: string,
    context: ChatContext = defaultContext,
    targetRelationshipId?: string
  ): Promise<ChatResponse | null> => {
    if (!userData?.id) {
      setError('No user data available');
      return null;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let response: ChatResponse;

      switch (context) {
        case 'birth_chart':
          response = await chatApi.chatBirthChartAnalysis({
            userId: userData.id,
            message,
          });
          break;

        case 'relationship':
          if (!targetRelationshipId && !relationshipId) {
            throw new Error('Relationship ID required for relationship context');
          }
          response = await chatApi.chatRelationshipAnalysis({
            userId: userData.id,
            message,
            relationshipId: targetRelationshipId || relationshipId!,
          });
          break;

        case 'general':
        default:
          response = await chatApi.handleUserQuery({
            userId: userData.id,
            query: message,
          });
          break;
      }

      // Create message object for local state
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        response: response.response,
        context,
        userId: userData.id,
        relationshipId: targetRelationshipId || relationshipId,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);

      // Update suggestions if provided
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [defaultContext, relationshipId, userData?.id]);

  const loadChatHistory = useCallback(async (
    context?: ChatContext,
    limit: number = 50
  ) => {
    if (!userData?.id) {
      setError('No user data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.getChatHistory(userData.id, context, limit);
      setMessages(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load chat history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  const getSuggestions = useCallback(async (
    context: ChatContext,
    targetRelationshipId?: string
  ) => {
    if (!userData?.id) {
      setError('No user data available');
      return;
    }

    try {
      const response = await chatApi.getSuggestedQuestions(
        userData.id,
        context,
        targetRelationshipId || relationshipId
      );
      setSuggestedQuestions(response);
    } catch (err) {
      console.warn('Failed to load suggestions:', err);
      // Don't set error for suggestions as they're not critical
    }
  }, [userData?.id, relationshipId]);

  const clearHistory = useCallback(async (context?: ChatContext): Promise<boolean> => {
    if (!userData?.id) {
      setError('No user data available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await chatApi.clearChatHistory(userData.id, context);

      if (context) {
        setMessages(prev => prev.filter(msg => msg.context !== context));
      } else {
        setMessages([]);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to clear chat history';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await chatApi.deleteChatMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete message';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rateResponse = useCallback(async (
    messageId: string,
    rating: 'helpful' | 'not_helpful',
    feedback?: string
  ): Promise<boolean> => {
    try {
      await chatApi.rateChatResponse(messageId, rating, feedback);
      return true;
    } catch (err) {
      console.warn('Failed to rate response:', err);
      // Don't set error for rating as it's not critical
      return false;
    }
  }, []);

  // Load chat history and suggestions on mount
  useEffect(() => {
    if (userData?.id) {
      loadChatHistory(defaultContext);
      getSuggestions(defaultContext);
    }
  }, [userData?.id, defaultContext, loadChatHistory, getSuggestions]);

  return {
    messages,
    suggestedQuestions,
    loading,
    error,
    sendMessage,
    loadChatHistory,
    getSuggestions,
    clearHistory,
    deleteMessage,
    rateResponse,
    clearError,
  };
};
