import React from 'react';
import { X, ShieldCheck, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AutoBidConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listingTitle: string;
  currentHighestBid: number;
  maxAmount: number;
  isUpdate?: boolean;
  submitting?: boolean;
}

export const AutoBidConfirmModal: React.FC<AutoBidConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  listingTitle,
  currentHighestBid,
  maxAmount,
  isUpdate = false,
  submitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isUpdate ? 'Confirm Limit Update' : 'Confirm Automatic Bidding'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 font-sans text-sm">
          {/* Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
              Auction Item
            </p>
            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
              {listingTitle}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Current High Bid</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {formatCurrency(currentHighestBid)}
                </span>
              </div>
              <div>
                <span className="text-indigo-600 dark:text-indigo-400 block font-bold">Authorized Max</span>
                <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                  {formatCurrency(maxAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms / Guarantees */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                The system will automatically place the smallest valid bid necessary to keep you in the lead, up to your maximum of {formatCurrency(maxAmount)}.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                You only pay the minimum amount needed to win. You may win at a price below your maximum.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                The system will never bid above {formatCurrency(maxAmount)}. If outbid beyond this limit, bidding stops and you will be notified.
              </span>
            </div>
            {isUpdate && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-amber-800 dark:text-amber-300 text-[11px]">
                Updating your limit only restricts future automatic bids. Existing accepted bids will not be reversed or deleted.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold font-mono uppercase bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold font-mono uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm and Activate</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
