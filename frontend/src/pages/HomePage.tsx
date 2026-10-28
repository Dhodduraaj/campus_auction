import React, { useEffect, useState } from 'react';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { ListingCard, ListingCategory } from '../types';
import { AuctionCard } from '../components/auction/AuctionCard';
import { ArrowRight, Sparkles, Clock, Flame, Tag } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeAuctions, setActiveAuctions] = useState<ListingCard[]>([]);
  const [closingSoonAuctions, setClosingSoonAuctions] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  const isSenior = user?.role === 'SENIOR' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activeRes, closingRes] = await Promise.all([
          listingService.getListings({
            status: 'OPEN',
            size: 6,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          }),
          listingService.getListings({
            status: 'OPEN',
            closingSoon: true,
            size: 4,
            sortBy: 'closingAt',
            sortDirection: 'asc',
          }),
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
    { label: 'Cycles', value: 'CYCLE', icon: '🚲' },
    { label: 'Calculators', value: 'CALCULATOR', icon: '🔢' },
    { label: 'Textbooks', value: 'BOOKS', icon: '📚' },
    { label: 'Electronics', value: 'ELECTRONICS', icon: '💻' },
    { label: 'Lab Kits', value: 'LAB_EQUIPMENT', icon: '🔬' },
    { label: 'Furniture', value: 'FURNITURE', icon: '🪑' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Auction Hero Section */}
      <section className="bg-slate-900 text-white pt-14 pb-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-orange-400 font-mono text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Auction Platform</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-white">
              Pass It Down. <span className="text-orange-500">Compete Fairly.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
              Seniors list second-hand campus items. Juniors bid openly with transparent timers and in-person campus handover.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('marketplace')}
                className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded shadow-sm flex items-center gap-2 transition-all"
              >
                <span>Browse Auctions</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {(!isAuthenticated || isSenior) && (
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'create-listing' : 'login')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded border border-slate-700 flex items-center gap-2 transition-all"
                >
                  <span>Create Listing</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Category Quick Filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-600" />
              <span>Categories</span>
            </h2>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onNavigate('marketplace', { category: cat.value })}
                className="flex flex-col items-center justify-center p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-center group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-105 transition-transform">
                  {cat.icon}
                </span>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Closing Soon Auctions */}
        {closingSoonAuctions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600" />
                  <span>Closing Soon (24h)</span>
                </h2>
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
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Live Auctions</span>
              </h2>
            </div>

            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          ) : activeAuctions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center space-y-3">
              <p className="font-display font-bold text-base text-slate-800 dark:text-slate-200">
                No active auctions
              </p>
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
      </div>
    </div>
  );
};
