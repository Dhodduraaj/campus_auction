import { apiRequest } from './apiClient';
import { Conversation, Message } from '../types';

export const conversationService = {
  async getUserConversations(): Promise<Conversation[]> {
    return apiRequest<Conversation[]>('/api/conversations');
  },

  async getConversationById(id: number): Promise<Conversation> {
    return apiRequest<Conversation>(`/api/conversations/${id}`);
  },

  async getConversationByListing(listingId: number): Promise<Conversation> {
    return apiRequest<Conversation>(`/api/conversations/by-listing/${listingId}`);
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    return apiRequest<Message[]>(`/api/conversations/${conversationId}/messages`);
  },

  async sendMessage(conversationId: number, content: string): Promise<Message> {
    return apiRequest<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
