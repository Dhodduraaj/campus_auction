import { apiRequest } from './apiClient';
import {
  ItemCondition,
  ListingCard,
  ListingCategory,
  ListingDetail,
  ListingStatus,
  PagedData,
} from '../types';

export interface ListingFilterParams {
  search?: string;
  category?: ListingCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  status?: ListingStatus;
  closingSoon?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateListingPayload {
  title: string;
  category: ListingCategory;
  description: string;
  condition: ItemCondition;
  startingPrice: number;
  minimumBidIncrement: number;
  closingAt: string;
  imageUrls: string[];
}

export interface UpdateListingPayload {
  title?: string;
  category?: ListingCategory;
  description?: string;
  condition?: ItemCondition;
  startingPrice?: number;
  minimumBidIncrement?: number;
  closingAt?: string;
  imageUrls?: string[];
}

export const listingService = {
  async getListings(params: ListingFilterParams = {}): Promise<PagedData<ListingCard>> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.condition) searchParams.append('condition', params.condition);
    if (params.minPrice !== undefined && params.minPrice !== null)
      searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined && params.maxPrice !== null)
      searchParams.append('maxPrice', params.maxPrice.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.closingSoon) searchParams.append('closingSoon', 'true');
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const query = searchParams.toString();
    const endpoint = query ? `/api/listings?${query}` : '/api/listings';
    return apiRequest<PagedData<ListingCard>>(endpoint);
  },

  async getListingById(id: number): Promise<ListingDetail> {
    return apiRequest<ListingDetail>(`/api/listings/${id}`);
  },

  async createListing(payload: CreateListingPayload): Promise<ListingDetail> {
    return apiRequest<ListingDetail>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateListing(id: number, payload: UpdateListingPayload): Promise<ListingDetail> {
    return apiRequest<ListingDetail>(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async cancelListing(id: number, reason: string): Promise<ListingDetail> {
    return apiRequest<ListingDetail>(`/api/listings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiRequest<{ url: string }>('/api/listings/upload-image', {
      method: 'POST',
      body: formData,
    });
    return result.url;
  },

  async getMyListings(page = 0, size = 12): Promise<PagedData<ListingCard>> {
    return apiRequest<PagedData<ListingCard>>(`/api/users/me/listings?page=${page}&size=${size}`);
  },

  async getMyBids(page = 0, size = 12): Promise<PagedData<ListingCard>> {
    return apiRequest<PagedData<ListingCard>>(`/api/users/me/bids?page=${page}&size=${size}`);
  },
};
