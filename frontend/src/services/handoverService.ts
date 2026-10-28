import { apiRequest } from './apiClient';
import { HandoverDetail, ListingDetail } from '../types';

export const handoverService = {
  async approveWinner(listingId: number, reason?: string): Promise<ListingDetail> {
    return apiRequest<ListingDetail>(`/api/listings/${listingId}/approve-winner`, {
      method: 'POST',
      body: JSON.stringify({ approved: true, reason }),
    });
  },

  async rejectWinner(listingId: number, reason?: string): Promise<ListingDetail> {
    return apiRequest<ListingDetail>(`/api/listings/${listingId}/reject-winner`, {
      method: 'POST',
      body: JSON.stringify({ approved: false, reason }),
    });
  },

  async confirmHandover(listingId: number): Promise<HandoverDetail> {
    return apiRequest<HandoverDetail>(`/api/listings/${listingId}/confirm-handover`, {
      method: 'POST',
    });
  },

  async reportPickupFailure(listingId: number, reason: string): Promise<HandoverDetail> {
    return apiRequest<HandoverDetail>(`/api/listings/${listingId}/report-pickup-failure`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getHandoverDetails(listingId: number): Promise<HandoverDetail> {
    return apiRequest<HandoverDetail>(`/api/listings/${listingId}/handover`);
  },
};
