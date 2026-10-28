import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { handoverService } from '../services/handoverService';
import { ListingCard } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { formatCurrency } from '../utils/currency';
import { Plus, Check, X, Handshake, Eye } from 'lucide-react';

interface MyListingsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyListingsPage: React.FC<MyListingsPageProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const res = await listingService.getMyListings(0, 50);
      setListings(res.content);
    } catch (err) {
      console.warn('Failed to load my listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this winning bid? The item will be reserved.')) return;
    setActionLoadingId(id);
    try {
      await handoverService.approveWinner(id);
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Reason for rejecting:', 'Reserve price not met');
    if (reason === null) return;
    setActionLoadingId(id);
    try {
      await handoverService.rejectWinner(id, reason);
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmHandover = async (id: number) => {
    if (!window.confirm('Confirm in-person handover on campus?')) return;
    setActionLoadingId(id);
    try {
      await handoverService.confirmHandover(id);
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm handover');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelAuction = async (id: number) => {
    const reason = window.prompt('Reason for cancelling auction:');
    if (!reason) return;
    setActionLoadingId(id);
    try {
      await listingService.cancelListing(id, reason);
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            My Listings
          </h1>
        </div>

        <button
          onClick={() => onNavigate('create-listing')}
          className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Listing</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-14 text-center space-y-3">
          <p className="font-display font-bold text-base text-slate-900 dark:text-white">
            No active listings found
          </p>
          <button
            onClick={() => onNavigate('create-listing')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors"
          >
            Create Listing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Item Info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden">
                  <img
                    src={
                      item.primaryImageUrl ||
                      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} size="sm" />
                    <span className="font-mono text-xs text-slate-400">#{item.id}</span>
                  </div>
                  <h3
                    onClick={() => onNavigate('listing-detail', { id: item.id })}
                    className="font-display font-bold text-base text-slate-900 dark:text-white truncate hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer mt-1"
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>
                      Current:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(item.currentHighestBid)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      {item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}
                    </span>
                    <span>•</span>
                    <CountdownTimer closingAt={item.closingAt} size="sm" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>

                {item.status === 'AWAITING_SELLER_APPROVAL' && (
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleApprove(item.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleReject(item.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {item.status === 'RESERVED' && (
                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleConfirmHandover(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    <Handshake className="w-3.5 h-3.5" /> Confirm Handover
                  </button>
                )}

                {item.status === 'OPEN' && item.bidCount === 0 && (
                  <button
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleCancelAuction(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
