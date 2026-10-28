import React, { useEffect, useState } from 'react';
import { listingService, ListingFilterParams } from '../services/listingService';
import { webSocketService } from '../services/webSocketService';
import { ItemCondition, ListingCard, ListingCategory, ListingStatus } from '../types';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface MarketplacePageProps {
  onNavigate: (page: string, params?: any) => void;
  initialCategory?: ListingCategory;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate, initialCategory }) => {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<ListingCategory | ''>(initialCategory || '');
  const [condition, setCondition] = useState<ItemCondition | ''>( '');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [status, setStatus] = useState<ListingStatus | ''>('OPEN');
  const [closingSoon, setClosingSoon] = useState(false);
  const [sortBy, setSortBy] = useState('closingAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListingFilterParams = {
        search: searchTerm || undefined,
        category: category || undefined,
        condition: condition || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        status: status || undefined,
        closingSoon: closingSoon || undefined,
        page,
        size: 9,
        sortBy,
        sortDirection,
      };

      const res = await listingService.getListings(params);
      setListings(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load auction listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, category, condition, status, closingSoon, sortBy, sortDirection]);

  // Real-time WebSocket update for marketplace cards
  useEffect(() => {
    const unsubscribe = webSocketService.subscribe<ListingCard>('/topic/auctions', (updatedCard) => {
      setListings((prev) => {
        const index = prev.findIndex((item) => item.id === updatedCard.id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updatedCard;
          return clone;
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchListings();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setStatus('OPEN');
    setClosingSoon(false);
    setSortBy('closingAt');
    setSortDirection('asc');
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Campus Marketplace
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-mono">
            Browse active student listings, place live bids, or track closing timers.
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cycles, books, electronics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Layout: Filters Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center bg-white p-3 border border-slate-200 rounded">
          <span className="font-bold text-sm text-slate-800">Filter & Sort Auctions</span>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 px-3 py-1.5 bg-orange-50 rounded border border-orange-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{mobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block space-y-6 bg-white p-5 rounded-lg border border-slate-200 shadow-sm h-fit`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-orange-600" />
              <span>Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 font-mono font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ListingCategory | '');
                setPage(0);
              }}
              className="w-full p-2 text-sm bg-white border border-slate-200 rounded focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="CYCLE">Bicycles & Cycles</option>
              <option value="CALCULATOR">Calculators</option>
              <option value="BOOKS">Textbooks & Notes</option>
              <option value="ELECTRONICS">Electronics & Gadgets</option>
              <option value="LAB_EQUIPMENT">Lab Equipment & Kits</option>
              <option value="FURNITURE">Hostel Furniture</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="OTHER">Other Items</option>
            </select>
          </div>

          {/* Item Condition */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value as ItemCondition | '');
                setPage(0);
              }}
              className="w-full p-2 text-sm bg-white border border-slate-200 rounded focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Conditions</option>
              <option value="NEW">New (Unopened)</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="NEEDS_REPAIR">Needs Repair</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Current Price ($)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => { setPage(0); fetchListings(); }}
                className="w-full p-2 text-sm border border-slate-200 rounded focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => { setPage(0); fetchListings(); }}
                className="w-full p-2 text-sm border border-slate-200 rounded focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Closing Soon Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={closingSoon}
                onChange={(e) => {
                  setClosingSoon(e.target.checked);
                  setPage(0);
                }}
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <span>Closing Soon (Next 24h)</span>
            </label>
          </div>

          {/* Auction Status */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ListingStatus | '');
                setPage(0);
              }}
              className="w-full p-2 text-sm bg-white border border-slate-200 rounded focus:border-orange-500 focus:outline-none"
            >
              <option value="OPEN">Live Auctions Only</option>
              <option value="">All Statuses (Including Closed)</option>
              <option value="AWAITING_SELLER_APPROVAL">Awaiting Approval</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="UNSOLD">Unsold</option>
            </select>
          </div>
        </aside>

        {/* Listings Grid & Controls */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sorting & Result Counts Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 border border-slate-200 rounded-lg">
            <span className="text-xs font-mono font-bold text-slate-700">
              Showing <span className="text-orange-600">{listings.length}</span> of {totalElements} listings
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Sort by:</span>
              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field);
                  setSortDirection(dir as 'asc' | 'desc');
                  setPage(0);
                }}
                className="p-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="closingAt-asc">Closing Soonest</option>
                <option value="createdAt-desc">Newest Listings</option>
                <option value="currentHighestBid-asc">Price: Low to High</option>
                <option value="currentHighestBid-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Loading / Error / Results */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center space-y-3">
              <p className="text-sm font-bold text-red-800">{error}</p>
              <button
                onClick={fetchListings}
                className="bg-red-600 text-white font-bold text-xs uppercase px-4 py-2 rounded"
              >
                Retry Request
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-16 text-center space-y-3">
              <h3 className="font-display font-bold text-lg text-slate-800">No auctions match your filters</h3>
              <p className="text-xs text-slate-500 font-mono">Try adjusting your keywords, price limits, or category filters.</p>
              <button
                onClick={handleResetFilters}
                className="bg-slate-900 text-white font-bold text-xs uppercase px-4 py-2 rounded"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((item) => (
                <AuctionCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs font-mono font-bold text-slate-600">
                Page {page + 1} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
