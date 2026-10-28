import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { ListingCard, ListingCategory } from '../types';
import { AuctionCard } from '../components/auction/AuctionCard';
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw, Clock, Flame, Tag } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [activeAuctions, setActiveAuctions] = useState<ListingCard[]>([]);
  const [closingSoonAuctions, setClosingSoonAuctions] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activeRes, closingRes] = await Promise.all([
          listingService.getListings({ status: 'OPEN', size: 6, sortBy: 'createdAt', sortDirection: 'desc' }),
          listingService.getListings({ status: 'OPEN', closingSoon: true, size: 4, sortBy: 'closingAt', sortDirection: 'asc' }),
        ]);
        setActiveAuctions(activeRes.content);
        setClosingSoonAuctions(closingRes.content);
      } catch (err) {
        console.warn('Failed to load home page auctions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories: { label: string; value: ListingCategory; icon: string }[] = [
    { label: 'Bicycles & Cycles', value: 'CYCLE', icon: '🚲' },
    { label: 'Calculators', value: 'CALCULATOR', icon: '🔢' },
    { label: 'Textbooks', value: 'BOOKS', icon: '📚' },
    { label: 'Electronics', value: 'ELECTRONICS', icon: '💻' },
    { label: 'Lab Equipment', value: 'LAB_EQUIPMENT', icon: '🔬' },
    { label: 'Hostel Furniture', value: 'FURNITURE', icon: '🪑' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Editorial Auction Hero Section */}
      <section className="bg-slate-900 text-white pt-16 pb-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-orange-400 font-mono text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Second-Hand Auction Marketplace</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-white">
              Good Finds. Fair Bids. <span className="text-orange-500">Campus Reuse.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Seniors pass on cycles, calculators, textbooks, and lab kits before leaving campus. Juniors bid openly with guaranteed fair pricing and verified campus handover.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('marketplace')}
                className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded shadow-sm flex items-center gap-2 transition-all"
              >
                <span>Browse Live Auctions</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('create-listing')}
                className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded border border-slate-700 flex items-center gap-2 transition-all"
              >
                <span>List an Item for Auction</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Category Quick Filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-600" />
              <span>Browse by Category</span>
            </h2>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onNavigate('marketplace', { category: cat.value })}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all text-center group"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-display font-bold text-sm text-slate-900 group-hover:text-orange-600">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Closing Soon Auctions Banner / Section */}
        {closingSoonAuctions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span>Closing Soon (Next 24 Hours)</span>
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Auctions nearing deadline. Bidding will lock automatically at closing time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {closingSoonAuctions.map((item) => (
                <AuctionCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Live Active Auctions */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Featured Live Auctions</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Real student items with active bidding and instant WebSocket updates.
              </p>
            </div>

            <button
              onClick={() => onNavigate('marketplace')}
              className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <span>Explore All Auctions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          ) : activeAuctions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <p className="font-display font-bold text-lg text-slate-800">No active auctions right now</p>
              <p className="text-sm text-slate-500">Be the first student to list an item on the campus exchange.</p>
              <button
                onClick={() => onNavigate('create-listing')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-4 py-2 rounded"
              >
                List Your Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.map((item) => (
                <AuctionCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                />
              ))}
            </div>
          )}
        </section>

        {/* How Campus Bidding Works (Strictly informative, compact) */}
        <section className="bg-slate-900 text-white rounded-xl p-8 sm:p-10 border border-slate-800 space-y-8">
          <div className="max-w-2xl">
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              How the Campus Auction Works
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Transparent, atomic, and safe. Zero ghost bids, zero backroom haggling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-display font-bold text-base text-white">Verified Student Auctions</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Every listing is created with an independent closing time, starting price, minimum increment, and condition specifications.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-display font-bold text-base text-white">Atomic Concurrency Bidding</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                PostgreSQL pessimistic row locking guarantees zero race conditions. Next minimum acceptable bid is calculated server-side in real-time.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-display font-bold text-base text-white">Seller Approval & Handover</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                The seller approves the winning reserve. Once agreed, in-person campus handover is verified by both parties before the sale finalizes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
