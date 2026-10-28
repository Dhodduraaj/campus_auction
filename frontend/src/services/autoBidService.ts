import { apiRequest } from './apiClient';
import { AutoBidRule } from '../types';

export const autoBidService = {
  async activateOrUpdate(listingId: number, maxAmount: number): Promise<AutoBidRule> {
    return apiRequest<AutoBidRule>(`/api/listings/${listingId}/auto-bid`, {
      method: 'POST',
      body: JSON.stringify({ maxAmount }),
    });
  },

  async getMyRule(listingId: number): Promise<AutoBidRule | null> {
    try {
      return await apiRequest<AutoBidRule>(`/api/listings/${listingId}/auto-bid`);
    } catch {
      return null;
    }
  },

  async pauseRule(listingId: number): Promise<AutoBidRule> {
    return apiRequest<AutoBidRule>(`/api/listings/${listingId}/auto-bid/pause`, {
      method: 'PUT',
    });
  },

  async resumeRule(listingId: number): Promise<AutoBidRule> {
    return apiRequest<AutoBidRule>(`/api/listings/${listingId}/auto-bid/resume`, {
      method: 'PUT',
    });
  },

  async cancelRule(listingId: number): Promise<AutoBidRule> {
    return apiRequest<AutoBidRule>(`/api/listings/${listingId}/auto-bid`, {
      method: 'DELETE',
    });
  },
};
