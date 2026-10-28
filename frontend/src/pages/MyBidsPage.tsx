import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { ListingCard } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { Gavel, Eye, ArrowRight } from 'lucide-react';

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
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
          My Bidding Activity
        </h1>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Track auctions where you have participated, view active bids, and monitor closing timers.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center space-y-4">
          <Gavel className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-display font-bold text-lg text-slate-900">You haven't bid on any items yet</p>
          <p className="text-xs text-slate-500 font-mono">
            Check the marketplace to find cycles, books, calculators, and lab equipment.
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.primaryImageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'}
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
                    className="font-display font-bold text-base text-slate-900 truncate hover:text-orange-600 cursor-pointer mt-1"
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                    <span>Highest Bid: <strong className="text-slate-900">${item.currentHighestBid.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>{item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}</span>
                    <span>•</span>
                    <CountdownTimer closingAt={item.closingAt} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  <span>Open Auction</span>
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
