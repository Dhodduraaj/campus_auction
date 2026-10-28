import { apiRequest } from './apiClient';
import { AiChatMessage, AiChatResponse, BidItem } from '../types';

export const aiService = {
  async chat(message: string, conversationHistory?: AiChatMessage[]): Promise<AiChatResponse> {
    return apiRequest<AiChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });
  },

  async confirmBid(authToken: string): Promise<BidItem> {
    return apiRequest<BidItem>('/api/ai/confirm-bid', {
      method: 'POST',
      body: JSON.stringify({
        authToken,
      }),
    });
  },
};
