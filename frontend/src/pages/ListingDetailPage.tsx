import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { bidService } from '../services/bidService';
import { handoverService } from '../services/handoverService';
import { webSocketService } from '../services/webSocketService';
import { useAuth } from '../context/AuthContext';
import { BidItem, HandoverDetail, ListingDetail } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import {
  Gavel,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Tag,
  Share2,
  Calendar,
  DollarSign,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface ListingDetailPageProps {
  id: number;
  onNavigate: (page: string, params?: any) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ id, onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [handover, setHandover] = useState<HandoverDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  // Seller decision / Handover modal or action states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const [listingData, bidsData] = await Promise.all([
        listingService.getListingById(id),
        bidService.getBids(id),
      ]);
      setListing(listingData);
      setBids(bidsData);
      setSelectedImage(listingData.imageUrls[0] || '');

      // Set default bid amount to minimum acceptable
      setBidAmount(listingData.minimumAcceptableBid.toString());

      if (listingData.status === 'RESERVED' || listingData.status === 'SOLD' || listingData.status === 'PICKUP_FAILED') {
        const hData = await handoverService.getHandoverDetails(id);
        setHandover(hData);
      }
    } catch (err: any) {
      console.warn('Failed to load auction details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // 1. WebSocket: Subscribe to listing details topic for live state updates
    const unsubscribeListing = webSocketService.subscribe<ListingDetail>(
      `/topic/auctions/${id}`,
      (updatedListing) => {
        setListing((prev) => ({
          ...(prev || updatedListing),
          ...updatedListing,
        }));
        // Adjust minimum bid
        setBidAmount(updatedListing.minimumAcceptableBid.toString());
      }
    );

    // 2. WebSocket: Subscribe to bids topic for live bid additions
    const unsubscribeBids = webSocketService.subscribe<BidItem>(
      `/topic/auctions/${id}/bids`,
      (newBid) => {
        setBids((prev) => [newBid, ...prev]);
        setBidSuccess(`New leading bid placed: $${newBid.amount.toFixed(2)} by ${newBid.bidderDisplayName}`);
        setTimeout(() => setBidSuccess(null), 5000);
      }
    );

    return () => {
      unsubscribeListing();
      unsubscribeBids();
    };
  }, [id]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }

    setBidError(null);
    setBidSuccess(null);

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid positive bid amount.');
      return;
    }

    if (listing && amount < listing.minimumAcceptableBid) {
      setBidError(`Bid must be at least $${listing.minimumAcceptableBid.toFixed(2)}.`);
      return;
    }

    setSubmittingBid(true);
    try {
      const placed = await bidService.placeBid(id, amount);
      setBidSuccess(`Success! Your bid of $${placed.amount.toFixed(2)} is now leading.`);
      // Refresh authoritative data
      fetchDetails();
    } catch (err: any) {
      setBidError(err.message || 'Bid rejected. Current price may have changed.');
    } finally {
      setSubmittingBid(false);
    }
  };

  // Quick increment button helper
  const handleAddIncrement = (multiplier: number) => {
    if (!listing) return;
    const currentMin = listing.minimumAcceptableBid;
    const increment = listing.minimumBidIncrement;
    const calculated = currentMin + increment * (multiplier - 1);
    setBidAmount(calculated.toFixed(2));
  };

  // Seller Approves Winner
  const handleApproveWinner = async () => {
    if (!window.confirm('Approve this winning bid and reserve item for buyer?')) return;
    setActionLoading(true);
    try {
      await handoverService.approveWinner(id);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to approve winner');
    } finally {
      setActionLoading(false);
    }
  };

  // Seller Rejects Winner
  const handleRejectWinner = async () => {
    const reason = window.prompt('Please enter a reason for rejecting this reserve price:', 'Reserve price not met');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await handoverService.rejectWinner(id, reason);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reject winner');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Handover
  const handleConfirmHandover = async () => {
    if (!window.confirm('Confirm that you have completed in-person item handover on campus?')) return;
    setActionLoading(true);
    try {
      await handoverService.confirmHandover(id);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm handover');
    } finally {
      setActionLoading(false);
    }
  };

  // Report Pickup Failure
  const handleReportFailure = async () => {
    const reason = window.prompt('Please specify reason for handover/pickup failure:', 'Buyer did not show up at designated campus spot');
    if (!reason) return;
    setActionLoading(true);
    try {
      await handoverService.reportPickupFailure(id, reason);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to report failure');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded"></div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-display font-bold text-xl text-slate-900">Auction Listing Not Found</p>
        <button
          onClick={() => onNavigate('marketplace')}
          className="bg-orange-600 text-white font-bold text-xs uppercase px-4 py-2 rounded"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isSeller = user && user.id === listing.seller.id;
  const isLeadingBidder = user && listing.leadingBidderId && user.id === listing.leadingBidderId;
  const isAuctionOpen = listing.status === 'OPEN' && !listing.expired;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Main Grid: Gallery on Left, Bidding & Overview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Selected Image */}
          <div className="aspect-[4/3] w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <CategoryBadge category={listing.category} />
              <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-950/80 text-white">
                {listing.condition.replace('_', ' ')}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <StatusBadge status={listing.status} />
            </div>
          </div>

          {/* Thumbnails row */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage === url ? 'border-orange-600 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
              Item Details & Condition
            </h3>
            <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed font-sans">
              {listing.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
              <div>
                <span className="text-slate-400 block uppercase">Category</span>
                <span className="font-bold text-slate-900">{listing.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Condition</span>
                <span className="font-bold text-slate-900">{listing.condition.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Starting Price</span>
                <span className="font-bold text-slate-900">${listing.startingPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Min Increment</span>
                <span className="font-bold text-slate-900">${listing.minimumBidIncrement.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Public Bid History */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Public Bid History
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Transparent campus bidding record. Protected student identities.
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded">
                {bids.length} Total {bids.length === 1 ? 'Bid' : 'Bids'}
              </span>
            </div>

            {bids.length === 0 ? (
              <p className="text-sm text-slate-500 font-mono py-6 text-center">
                No bids placed yet. First accepted bid will start at ${listing.startingPrice.toFixed(2)}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                      <th className="py-2.5 px-3">Bidder</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bids.map((bid, index) => (
                      <tr
                        key={bid.id}
                        className={index === 0 ? 'bg-orange-50/60 font-semibold' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {bid.bidderDisplayName}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-sm">
                          ${bid.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}, {new Date(bid.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                              Current High
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-slate-400 uppercase">
                              Outbid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Action / Bidding Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Auction Status & Countdown Card */}
          <div className="bg-white border-2 border-slate-900 rounded-lg p-6 shadow-md space-y-6">
            <div>
              <h1 className="font-display font-black text-2xl text-slate-900 leading-tight">
                {listing.title}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Auction ID: #{listing.id} • Posted by {listing.seller.name}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  {listing.bidCount > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </span>
                <span className="font-mono font-black text-3xl text-slate-900 tracking-tight">
                  ${listing.currentHighestBid.toFixed(2)}
                </span>
                {listing.leadingBidderDisplayName && (
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    Leader: <span className="font-bold text-slate-900">{listing.leadingBidderDisplayName}</span>
                  </p>
                )}
              </div>

              <div className="text-right">
                <StatusBadge status={listing.status} />
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Auction Timer</span>
              </div>
              <CountdownTimer closingAt={listing.closingAt} onExpire={fetchDetails} />
            </div>

            {/* Live Notifications within details */}
            {bidSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {bidError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            {/* Bidding Form / Status Logic */}
            {isAuctionOpen ? (
              isSeller ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    You are the seller of this auction
                  </p>
                  <p>
                    Campus safety rules prevent sellers from bidding on their own listings. You will be notified when new bids are placed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-slate-500 font-bold uppercase">Next Valid Bid</span>
                      <span className="text-orange-600 font-extrabold">
                        Min: ${listing.minimumAcceptableBid.toFixed(2)}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={listing.minimumAcceptableBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={listing.minimumAcceptableBid.toFixed(2)}
                        required
                        className="w-full pl-9 pr-3 py-3 font-mono font-bold text-lg bg-white border-2 border-slate-300 rounded focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(1)}
                      className="flex-1 py-1 px-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200"
                    >
                      +${listing.minimumBidIncrement.toFixed(0)}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(2)}
                      className="flex-1 py-1 px-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200"
                    >
                      +${(listing.minimumBidIncrement * 2).toFixed(0)}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(5)}
                      className="flex-1 py-1 px-2 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200"
                    >
                      +${(listing.minimumBidIncrement * 5).toFixed(0)}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-display font-black text-sm uppercase tracking-wider py-3.5 rounded shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>{submittingBid ? 'Submitting Bid...' : 'Place Secure Bid'}</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center font-mono">
                    By bidding, you commit to purchase this item at this price upon seller approval.
                  </p>
                </form>
              )
            ) : (
              /* Auction is closed / resolving */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="p-4 bg-slate-100 rounded-lg text-xs space-y-1 font-mono">
                  <p className="font-bold text-slate-900 uppercase">Auction Concluded</p>
                  <p className="text-slate-600">
                    Bidding closed on {new Date(listing.closingAt).toLocaleString()}.
                  </p>
                </div>

                {/* Seller Approval Actions */}
                {listing.status === 'AWAITING_SELLER_APPROVAL' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-xs font-bold text-blue-900">
                      Highest Bid: ${listing.currentHighestBid.toFixed(2)} by {listing.leadingBidderDisplayName}
                    </p>

                    {isSeller ? (
                      <div className="space-y-2">
                        <p className="text-xs text-blue-800">
                          Please approve or reject this sale offer:
                        </p>
                        <div className="flex gap-2">
                          <button
                            disabled={actionLoading}
                            onClick={handleApproveWinner}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase py-2 px-3 rounded"
                          >
                            Approve Winner
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={handleRejectWinner}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase py-2 px-3 rounded"
                          >
                            Reject Offer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-800">
                        Awaiting seller's final decision on the winning offer.
                      </p>
                    )}
                  </div>
                )}

                {/* Handover in Progress (RESERVED) */}
                {listing.status === 'RESERVED' && (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-teal-700" />
                      <span>Campus Handover In Progress</span>
                    </div>

                    <p className="text-xs text-teal-800 font-sans">
                      The item is reserved! Seller and buyer can meet on campus (hostel, library, cafeteria) to inspect and handover the item.
                    </p>

                    {/* Confirmation status indicators */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className={`p-2 rounded border ${handover?.sellerConfirmation ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        Seller Confirmed: {handover?.sellerConfirmation ? 'YES' : 'PENDING'}
                      </div>
                      <div className={`p-2 rounded border ${handover?.winnerConfirmation ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        Buyer Confirmed: {handover?.winnerConfirmation ? 'YES' : 'PENDING'}
                      </div>
                    </div>

                    {(isSeller || isLeadingBidder) && (
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          disabled={actionLoading}
                          onClick={handleConfirmHandover}
                          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase py-2.5 rounded shadow-sm"
                        >
                          Confirm Successful Handover
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={handleReportFailure}
                          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase py-1.5 rounded"
                        >
                          Report Pickup / Handover Issue
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase text-slate-400 tracking-wider">
              Seller Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-slate-900 text-orange-400 font-bold font-mono text-sm flex items-center justify-center">
                {listing.seller.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  {listing.seller.name}
                  {listing.seller.campusVerificationStatus === 'VERIFIED' && (
                    <span title="Campus Verified Student">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {listing.seller.campusVerificationStatus === 'VERIFIED' ? 'Verified Student Account' : 'Unverified Student'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
