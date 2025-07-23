import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  context: 'birth_chart' | 'relationship' | 'general';
  userId: string;
  relationshipId?: string;
  timestamp: string;
}

export interface ChatBirthChartRequest {
  userId: string;
  message: string;
}

export interface ChatRelationshipRequest {
  userId: string;
  message: string;
  relationshipId: string;
}

export interface ChatGeneralRequest {
  userId: string;
  query: string;
}

export interface ChatResponse {
  response: string;
  context: string;
  relatedTopics?: string[];
  suggestedQuestions?: string[];
}

export const chatApi = {
  // Chat with birth chart context
  chatBirthChartAnalysis: async (
    request: ChatBirthChartRequest
  ): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>('/userChatBirthChartAnalysis', request);
  },

  // Chat with relationship context
  chatRelationshipAnalysis: async (
    request: ChatRelationshipRequest
  ): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>('/userChatRelationshipAnalysis', request);
  },

  // General chat/query handling
  handleUserQuery: async (request: ChatGeneralRequest): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>('/handleUserQuery', request);
  },

  // Get chat history for user
  getChatHistory: async (
    userId: string,
    context?: 'birth_chart' | 'relationship' | 'general',
    limit: number = 50
  ): Promise<ChatMessage[]> => {
    return apiClient.post<ChatMessage[]>('/getChatHistory', {
      userId,
      context,
      limit,
    });
  },

  // Delete chat message
  deleteChatMessage: async (messageId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/chat/messages/${messageId}`);
  },

  // Clear chat history
  clearChatHistory: async (
    userId: string,
    context?: 'birth_chart' | 'relationship' | 'general'
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/clearChatHistory', {
      userId,
      context,
    });
  },

  // Get suggested questions based on context
  getSuggestedQuestions: async (
    userId: string,
    context: 'birth_chart' | 'relationship' | 'general',
    relationshipId?: string
  ): Promise<string[]> => {
    return apiClient.post<string[]>('/getSuggestedQuestions', {
      userId,
      context,
      relationshipId,
    });
  },

  // Rate chat response
  rateChatResponse: async (
    messageId: string,
    rating: 'helpful' | 'not_helpful',
    feedback?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/rateChatResponse', {
      messageId,
      rating,
      feedback,
    });
  },

  // Get chat statistics
  getChatStats: async (userId: string): Promise<{
    totalMessages: number;
    averageResponseTime: number;
    popularTopics: string[];
    satisfactionRating: number;
  }> => {
    return apiClient.post('/getChatStats', { userId });
  },
};
