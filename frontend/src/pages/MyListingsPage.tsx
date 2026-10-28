import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { handoverService } from '../services/handoverService';
import { ListingCard } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { ConversationModal } from '../components/messaging/ConversationModal';
import { ContactModal } from '../components/handover/ContactModal';
import { formatCurrency } from '../utils/currency';
import { Plus, Check, X, Handshake, Eye, MessageSquare, Phone, UserCheck, Calendar } from 'lucide-react';

interface MyListingsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

type TabKey = 'all' | 'active' | 'awaiting_approval' | 'reserved' | 'completed' | 'unsuccessful';

export const MyListingsPage: React.FC<MyListingsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modals state
  const [contactModalListing, setContactModalListing] = useState<ListingCard | null>(null);
  const [chatModalListing, setChatModalListing] = useState<ListingCard | null>(null);

  const fetchMyListings = async (tab: TabKey = activeTab) => {
    setLoading(true);
    try {
      const res = await listingService.getMyListings(tab, 0, 50);
      setListings(res.content);
    } catch (err) {
      console.warn('Failed to load my listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings(activeTab);
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this winning bid? The item will be reserved.')) return;
    setActionLoadingId(id);
    try {
      await handoverService.approveWinner(id);
      await fetchMyListings(activeTab);
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
      await fetchMyListings(activeTab);
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmHandover = async (id: number) => {
    if (!window.confirm('Confirm in-person handover on campus? Once both parties confirm, the auction completes.')) return;
    setActionLoadingId(id);
    try {
      await handoverService.confirmHandover(id);
      await fetchMyListings(activeTab);
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
      await fetchMyListings(activeTab);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Listings' },
    { key: 'active', label: 'Active' },
    { key: 'awaiting_approval', label: 'Awaiting Approval' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'completed', label: 'Completed' },
    { key: 'unsuccessful', label: 'Unsuccessful' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            My Listings Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track active auctions, approve winning bids, coordinate campus handovers, and view completed sales.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-listing')}
          className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Listing</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-14 text-center space-y-3">
          <p className="font-display font-bold text-base text-slate-900 dark:text-white">
            No listings found in "{tabs.find((t) => t.key === activeTab)?.label}"
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'completed'
              ? 'Completed auctions where both parties verified campus handover will appear here.'
              : 'Create a new auction to begin selling to campus students.'}
          </p>
          {activeTab === 'all' && (
            <button
              onClick={() => onNavigate('create-listing')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors"
            >
              Create Listing
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => {
            const isCompleted = item.status === 'COMPLETED' || item.status === 'SOLD';
            const isAwaitingApproval = item.status === 'AWAITING_SELLER_APPROVAL';
            const isReserved = item.status === 'RESERVED';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Item Thumbnail & Basic Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
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

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="font-mono text-xs text-slate-400">#{item.id}</span>
                      <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                        • {item.category}
                      </span>
                    </div>

                    <h3
                      onClick={() => onNavigate('listing-detail', { id: item.id })}
                      className="font-display font-bold text-base text-slate-900 dark:text-white truncate hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    {/* Price and Bid Count */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>
                        {isCompleted ? 'Final Sale Price:' : 'Winning / Current:'}{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {formatCurrency(item.currentHighestBid)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        {item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}
                      </span>

                      {!isCompleted && item.status === 'OPEN' && (
                        <>
                          <span>•</span>
                          <CountdownTimer closingAt={item.closingAt} size="sm" />
                        </>
                      )}

                      {isCompleted && item.closedAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            Completed on {new Date(item.closedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Provisional Winner or Successful Buyer Badge */}
                    {(isAwaitingApproval || isReserved || isCompleted) && item.winnerName && (
                      <div className="pt-1 flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>
                            {isCompleted ? 'Purchased by' : isReserved ? 'Reserved for' : 'Highest Bidder'}:{' '}
                            <strong>{item.winnerName}</strong>
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNavigate('listing-detail', { id: item.id })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>

                  {/* Awaiting Seller Approval Actions */}
                  {isAwaitingApproval && (
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleApprove(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Sale
                      </button>
                      <button
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleReject(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {/* Reserved Actions: Contact, Chat, Confirm Handover */}
                  {isReserved && (
                    <>
                      <button
                        onClick={() => setContactModalListing(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="View buyer verified contact info"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> Contact
                      </button>

                      <button
                        onClick={() => setChatModalListing(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message Buyer
                      </button>

                      <button
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleConfirmHandover(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
                      >
                        <Handshake className="w-3.5 h-3.5" /> Confirm Handover
                      </button>
                    </>
                  )}

                  {/* Completed Actions: Chat, Contact, View Details */}
                  {isCompleted && (
                    <>
                      <button
                        onClick={() => setContactModalListing(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> Buyer Contact
                      </button>

                      <button
                        onClick={() => setChatModalListing(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> View Chat
                      </button>
                    </>
                  )}

                  {/* Open Auction: Cancel */}
                  {item.status === 'OPEN' && item.bidCount === 0 && (
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleCancelAuction(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controlled Contact Modal */}
      {contactModalListing && (
        <ContactModal
          isOpen={!!contactModalListing}
          onClose={() => setContactModalListing(null)}
          listingId={contactModalListing.id}
          listingTitle={contactModalListing.title}
          onOpenChat={() => {
            const l = contactModalListing;
            setContactModalListing(null);
            setChatModalListing(l);
          }}
        />
      )}

      {/* Secure Seller-Buyer Chat Modal */}
      {chatModalListing && (
        <ConversationModal
          isOpen={!!chatModalListing}
          onClose={() => setChatModalListing(null)}
          listingId={chatModalListing.id}
        />
      )}
    </div>
  );
};
