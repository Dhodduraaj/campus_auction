import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { ListingCard } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { formatCurrency } from '../utils/currency';
import { Gavel, ArrowRight } from 'lucide-react';

interface MyBidsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyBidsPage: React.FC<MyBidsPageProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      try {
        const res = await listingService.getMyBids(0, 50);
        setListings(res.content);
      } catch (err) {
        console.warn('Failed to load my bids', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
          My Bids
        </h1>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-14 text-center space-y-3">
          <Gavel className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-display font-bold text-base text-slate-900 dark:text-white">
            No bids placed yet
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
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
                      Highest Bid:{' '}
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

              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
