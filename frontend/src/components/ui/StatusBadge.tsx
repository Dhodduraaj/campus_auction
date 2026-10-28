import React from 'react';
import { ListingStatus } from '../../types';

interface StatusBadgeProps {
  status: ListingStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'OPEN':
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-amber-500 text-slate-950 font-bold uppercase tracking-wider ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
          Live Auction
        </span>
      );
    case 'AWAITING_SELLER_APPROVAL':
      return (
        <span className={`inline-flex items-center rounded bg-blue-600 text-white font-medium uppercase tracking-wider ${sizeClasses}`}>
          Awaiting Approval
        </span>
      );
    case 'RESERVED':
      return (
        <span className={`inline-flex items-center rounded bg-teal-600 text-white font-medium uppercase tracking-wider ${sizeClasses}`}>
          Reserved (Handover Pending)
        </span>
      );
    case 'SOLD':
      return (
        <span className={`inline-flex items-center rounded bg-emerald-700 text-white font-bold uppercase tracking-wider ${sizeClasses}`}>
          Sold
        </span>
      );
    case 'UNSOLD':
      return (
        <span className={`inline-flex items-center rounded bg-slate-600 text-white font-medium uppercase tracking-wider ${sizeClasses}`}>
          Unsold
        </span>
      );
    case 'SELLER_REJECTED':
      return (
        <span className={`inline-flex items-center rounded bg-rose-700 text-white font-medium uppercase tracking-wider ${sizeClasses}`}>
          Offer Rejected
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center rounded bg-slate-700 text-slate-200 font-medium uppercase tracking-wider ${sizeClasses}`}>
          Cancelled
        </span>
      );
    case 'PICKUP_FAILED':
      return (
        <span className={`inline-flex items-center rounded bg-red-800 text-white font-medium uppercase tracking-wider ${sizeClasses}`}>
          Pickup Failed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded bg-slate-500 text-white font-medium ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
