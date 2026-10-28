import { apiRequest } from './apiClient';
import { BidItem } from '../types';

export const bidService = {
  async getBids(listingId: number): Promise<BidItem[]> {
    return apiRequest<BidItem[]>(`/api/listings/${listingId}/bids`);
  },

  async placeBid(listingId: number, amount: number): Promise<BidItem> {
    return apiRequest<BidItem>(`/api/listings/${listingId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};
