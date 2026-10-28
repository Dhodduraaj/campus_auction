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
import { formatCurrency } from '../utils/currency';
import {
  Gavel,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
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

      setBidAmount(listingData.minimumAcceptableBid.toString());

      if (
        listingData.status === 'RESERVED' ||
        listingData.status === 'SOLD' ||
        listingData.status === 'PICKUP_FAILED'
      ) {
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

    const unsubscribeListing = webSocketService.subscribe<ListingDetail>(
      `/topic/auctions/${id}`,
      (updatedListing) => {
        setListing((prev) => ({
          ...(prev || updatedListing),
          ...updatedListing,
        }));
        setBidAmount(updatedListing.minimumAcceptableBid.toString());
      }
    );

    const unsubscribeBids = webSocketService.subscribe<BidItem>(
      `/topic/auctions/${id}/bids`,
      (newBid) => {
        setBids((prev) => [newBid, ...prev]);
        setBidSuccess(`New leading bid: ${formatCurrency(newBid.amount)} by ${newBid.bidderDisplayName}`);
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

    if (user?.role === 'SENIOR') {
      setBidError('Senior accounts cannot place bids. Only Junior accounts can bid on items.');
      return;
    }

    setBidError(null);
    setBidSuccess(null);

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Enter a valid bid amount.');
      return;
    }

    if (listing && amount < listing.minimumAcceptableBid) {
      setBidError(`Bid must be at least ${formatCurrency(listing.minimumAcceptableBid)}.`);
      return;
    }

    setSubmittingBid(true);
    try {
      const placed = await bidService.placeBid(id, amount);
      setBidSuccess(`Your bid of ${formatCurrency(placed.amount)} is now leading.`);
      fetchDetails();
    } catch (err: any) {
      setBidError(err.message || 'Bid rejected.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAddIncrement = (multiplier: number) => {
    if (!listing) return;
    const currentMin = listing.minimumAcceptableBid;
    const increment = listing.minimumBidIncrement;
    const calculated = currentMin + increment * (multiplier - 1);
    setBidAmount(calculated.toString());
  };

  const handleApproveWinner = async () => {
    if (!window.confirm('Approve this winning bid and reserve item?')) return;
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

  const handleRejectWinner = async () => {
    const reason = window.prompt('Reason for rejecting winning offer:', 'Reserve price not met');
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

  const handleConfirmHandover = async () => {
    if (!window.confirm('Confirm in-person item handover on campus?')) return;
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

  const handleReportFailure = async () => {
    const reason = window.prompt('Specify reason for handover failure:', 'Buyer did not show up');
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
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-display font-bold text-xl text-slate-900 dark:text-white">
          Auction Listing Not Found
        </p>
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
  const isSenior = user?.role === 'SENIOR';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Main Grid: Gallery on Left, Bidding on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Selected Image */}
          <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative">
            <img
              src={
                selectedImage ||
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
              }
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
                    selectedImage === url
                      ? 'border-orange-600 scale-105'
                      : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Item Details
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed font-sans">
              {listing.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block uppercase">Category</span>
                <span className="font-bold text-slate-900 dark:text-white">{listing.category}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block uppercase">Condition</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {listing.condition.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block uppercase">Starting Price</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(listing.startingPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block uppercase">Min Increment</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(listing.minimumBidIncrement)}
                </span>
              </div>
            </div>
          </div>

          {/* Public Bid History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Public Bid History
                </h3>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded">
                {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}
              </span>
            </div>

            {bids.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono py-6 text-center">
                No bids placed yet. First bid starts at {formatCurrency(listing.startingPrice)}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                      <th className="py-2.5 px-3">Bidder</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bids.map((bid, index) => (
                      <tr
                        key={bid.id}
                        className={
                          index === 0
                            ? 'bg-orange-50/60 dark:bg-orange-950/20 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {bid.bidderDisplayName}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {formatCurrency(bid.amount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {new Date(bid.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          , {new Date(bid.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950 px-1.5 py-0.5 rounded">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-5">
            <div>
              <h1 className="font-display font-black text-2xl text-slate-900 dark:text-white leading-tight">
                {listing.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                ID: #{listing.id} • Seller: {listing.seller.name}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {listing.bidCount > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </span>
                <span className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(listing.currentHighestBid)}
                </span>
                {listing.leadingBidderDisplayName && (
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                    Leader:{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {listing.leadingBidderDisplayName}
                    </span>
                  </p>
                )}
              </div>

              <div className="text-right">
                <StatusBadge status={listing.status} />
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg flex items-center justify-between border border-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Timer</span>
              </div>
              <CountdownTimer closingAt={listing.closingAt} onExpire={fetchDetails} />
            </div>

            {/* Notifications */}
            {bidSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {bidError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            {/* Bidding Form / Status Logic */}
            {isAuctionOpen ? (
              isSeller ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    You are the seller of this auction
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">
                    Sellers cannot place bids on their own items.
                  </p>
                </div>
              ) : isSenior ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    Senior Account
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">
                    Seniors sell items and cannot place bids. Only Junior accounts can bid on items.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleBidSubmit}
                  className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                        Next Valid Bid
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                        Min: {formatCurrency(listing.minimumAcceptableBid)}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 dark:text-slate-400 text-lg">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="1"
                        min={listing.minimumAcceptableBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min. ${listing.minimumAcceptableBid}`}
                        required
                        className="w-full pl-9 pr-3 py-2.5 font-mono font-bold text-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(1)}
                      className="flex-1 py-1.5 px-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
                    >
                      +₹{listing.minimumBidIncrement}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(2)}
                      className="flex-1 py-1.5 px-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
                    >
                      +₹{listing.minimumBidIncrement * 2}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddIncrement(5)}
                      className="flex-1 py-1.5 px-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
                    >
                      +₹{listing.minimumBidIncrement * 5}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-display font-black text-sm uppercase tracking-wider py-3 rounded shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>{submittingBid ? 'Placing Bid...' : 'Place Bid'}</span>
                  </button>
                </form>
              )
            ) : (
              /* Auction concluded */
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono">
                  <p className="font-bold text-slate-900 dark:text-white uppercase">Auction Ended</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Closed {new Date(listing.closingAt).toLocaleString()}.
                  </p>
                </div>

                {/* Seller Approval Actions */}
                {listing.status === 'AWAITING_SELLER_APPROVAL' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Highest Bid: {formatCurrency(listing.currentHighestBid)} by{' '}
                      {listing.leadingBidderDisplayName}
                    </p>

                    {isSeller ? (
                      <div className="space-y-2">
                        <p className="text-xs text-blue-800 dark:text-blue-400">
                          Approve or reject this winning bid:
                        </p>
                        <div className="flex gap-2">
                          <button
                            disabled={actionLoading}
                            onClick={handleApproveWinner}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase py-2 px-3 rounded"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={handleRejectWinner}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase py-2 px-3 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-800 dark:text-blue-400">
                        Awaiting seller approval.
                      </p>
                    )}
                  </div>
                )}

                {/* Handover in Progress (RESERVED) */}
                {listing.status === 'RESERVED' && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>Campus Handover</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div
                        className={`p-2 rounded border ${
                          handover?.sellerConfirmation
                            ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Seller Confirmed: {handover?.sellerConfirmation ? 'YES' : 'PENDING'}
                      </div>
                      <div
                        className={`p-2 rounded border ${
                          handover?.winnerConfirmation
                            ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
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
                          Confirm Handover
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={handleReportFailure}
                          className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase py-1.5 rounded"
                        >
                          Report Issue
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase text-slate-400 tracking-wider">
              Seller
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-slate-900 dark:bg-slate-800 text-orange-400 font-bold font-mono text-sm flex items-center justify-center border border-slate-800 dark:border-slate-700">
                {listing.seller.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  {listing.seller.name}
                  {listing.seller.campusVerificationStatus === 'VERIFIED' && (
                    <span title="Campus Verified Student">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {listing.seller.campusVerificationStatus === 'VERIFIED'
                    ? 'Verified Student'
                    : 'Unverified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
