export type Role = 'STUDENT' | 'ADMIN';
export type CampusVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export type ListingCategory =
  | 'CYCLE'
  | 'CALCULATOR'
  | 'BOOKS'
  | 'ELECTRONICS'
  | 'LAB_EQUIPMENT'
  | 'FURNITURE'
  | 'ACCESSORIES'
  | 'OTHER';

export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR';

export type ListingStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'AWAITING_SELLER_APPROVAL'
  | 'RESERVED'
  | 'SOLD'
  | 'UNSOLD'
  | 'SELLER_REJECTED'
  | 'CANCELLED'
  | 'PICKUP_FAILED';

export type NotificationType =
  | 'BID_RECEIVED'
  | 'OUTBID'
  | 'AUCTION_CLOSING_SOON'
  | 'AUCTION_CLOSED'
  | 'PROVISIONAL_WINNER'
  | 'WINNER_APPROVED'
  | 'WINNER_REJECTED'
  | 'ITEM_RESERVED'
  | 'HANDOVER_CONFIRMED'
  | 'HANDOVER_FAILED'
  | 'AUCTION_CANCELLED';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
  campusVerificationStatus: CampusVerificationStatus;
  studentId?: string;
  phoneNumber?: string;
}

export interface UserProfile extends UserSummary {
  createdAt: string;
  totalListingsCount: number;
  activeListingsCount: number;
  totalBidsPlacedCount: number;
  auctionsWonCount: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserSummary;
}

export interface ListingCard {
  id: number;
  title: string;
  category: ListingCategory;
  condition: ItemCondition;
  startingPrice: number;
  minimumBidIncrement: number;
  currentHighestBid: number;
  bidCount: number;
  closingAt: string;
  status: ListingStatus;
  primaryImageUrl: string | null;
  minimumAcceptableBid: number;
  expired: boolean;
}

export interface ListingDetail {
  id: number;
  title: string;
  category: ListingCategory;
  description: string;
  condition: ItemCondition;
  startingPrice: number;
  minimumBidIncrement: number;
  currentHighestBid: number;
  bidCount: number;
  minimumAcceptableBid: number;
  closingAt: string;
  status: ListingStatus;
  cancellationReason?: string;
  imageUrls: string[];
  seller: UserSummary;
  leadingBidderDisplayName?: string;
  leadingBidderId?: number;
  expired: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface BidItem {
  id: number;
  listingId: number;
  bidderDisplayName: string;
  amount: number;
  createdAt: string;
  leading: boolean;
}

export interface HandoverDetail {
  id: number;
  listingId: number;
  sellerConfirmation: boolean;
  winnerConfirmation: boolean;
  sellerConfirmedAt?: string;
  winnerConfirmedAt?: string;
  outcome: string;
  failureReason?: string;
  completedAt?: string;
}

export interface NotificationItem {
  id: number;
  eventType: NotificationType;
  title: string;
  message: string;
  relatedListingId?: number;
  createdAt: string;
  readAt?: string;
}

export interface PagedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string>;
  timestamp: string;
}
