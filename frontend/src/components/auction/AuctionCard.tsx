import React from 'react';
import { ListingCard } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { CategoryBadge } from '../ui/CategoryBadge';
import { CountdownTimer } from '../ui/CountdownTimer';

interface AuctionCardProps {
  listing: ListingCard;
  onClick?: () => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ listing, onClick }) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const imageUrl = listing.primaryImageUrl || fallbackImage;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer duration-200"
    >
      {/* Item Image with Category Badge & Status Overlay */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          <CategoryBadge category={listing.category} />
          <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-900/85 text-white">
            {listing.condition.replace('_', ' ')}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={listing.status} size="sm" />
        </div>
      </div>

      {/* Item Content */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {listing.title}
          </h3>
        </div>

        {/* Pricing & Bids Section */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <span className="block text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              {listing.bidCount > 0 ? 'Current Bid' : 'Starting Price'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-extrabold text-xl text-slate-900">
                ${listing.currentHighestBid.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {listing.bidCount} {listing.bidCount === 1 ? 'bid' : 'bids'}
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center justify-between pt-2">
          <CountdownTimer closingAt={listing.closingAt} size="sm" />
          <span className="text-xs font-bold text-orange-600 group-hover:underline inline-flex items-center gap-0.5">
            View & Bid &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
