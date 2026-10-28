import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { handoverService } from '../services/handoverService';
import { ListingCard } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/currency';
import { ConversationModal } from '../components/messaging/ConversationModal';
import { ContactModal } from '../components/handover/ContactModal';
import { Trophy, Eye, MessageSquare, Phone, Handshake, Calendar, UserCheck } from 'lucide-react';

interface WonItemsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const WonItemsPage: React.FC<WonItemsPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modals state
  const [contactModalListing, setContactModalListing] = useState<ListingCard | null>(null);
  const [chatModalListing, setChatModalListing] = useState<ListingCard | null>(null);

  const fetchWonItems = async () => {
    setLoading(true);
    try {
      const res = await listingService.getMyWonItems(0, 50);
      setItems(res.content);
    } catch (err) {
      console.warn('Failed to load won items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWonItems();
  }, []);

  const handleConfirmReceived = async (id: number) => {
    if (!window.confirm('Confirm that you have received this item on campus from the seller?')) return;
    setActionLoadingId(id);
    try {
      await handoverService.confirmHandover(id);
      await fetchWonItems();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm handover');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              Won Items & Purchases
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Auctions you won, reserved items awaiting campus handover, and completed student purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-14 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Trophy className="w-6 h-6 opacity-60" />
          </div>
          <p className="font-display font-bold text-base text-slate-900 dark:text-white">
            No won items yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Place bids on active campus auctions. When your bid wins and the seller approves, your reserved items will appear here!
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded transition-colors shadow-sm"
          >
            Browse Auctions
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isCompleted = item.status === 'COMPLETED' || item.status === 'SOLD';
            const isReserved = item.status === 'RESERVED';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Thumbnail & Details */}
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

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>
                        Winning Price:{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {formatCurrency(item.currentHighestBid)}
                        </strong>
                      </span>

                      {item.sellerName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                            Seller: <strong>{item.sellerName}</strong>
                          </span>
                        </>
                      )}

                      {isCompleted && item.closedAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            Completed {new Date(item.closedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNavigate('listing-detail', { id: item.id })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>

                  <button
                    onClick={() => setContactModalListing(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> Seller Contact
                  </button>

                  <button
                    onClick={() => setChatModalListing(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message Seller
                  </button>

                  {isReserved && (
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleConfirmReceived(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
                    >
                      <Handshake className="w-3.5 h-3.5" /> Confirm Received
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
