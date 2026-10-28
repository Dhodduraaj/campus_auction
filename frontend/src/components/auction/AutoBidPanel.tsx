import React, { useState, useEffect } from 'react';
import { AutoBidRule, ListingDetail } from '../../types';
import { autoBidService } from '../../services/autoBidService';
import { formatCurrency } from '../../utils/currency';
import { AutoBidConfirmModal } from './AutoBidConfirmModal';
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
  Info
} from 'lucide-react';

interface AutoBidPanelProps {
  listing: ListingDetail;
  isAuthenticated: boolean;
  userRole?: string;
  isSeller: boolean;
  onRuleChanged?: () => void;
}

export const AutoBidPanel: React.FC<AutoBidPanelProps> = ({
  listing,
  isAuthenticated,
  userRole,
  isSeller,
  onRuleChanged,
}) => {
  const [rule, setRule] = useState<AutoBidRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [maxInput, setMaxInput] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current user's auto-bid rule
  const loadRule = async () => {
    if (!isAuthenticated || userRole !== 'JUNIOR' || isSeller) return;
    setLoading(true);
    try {
      const data = await autoBidService.getMyRule(listing.id);
      setRule(data);
      if (data) {
        setMaxInput(data.maxAmount.toString());
      } else {
        // Default suggested max: minimumAcceptableBid + 3 increments
        const suggested = listing.minimumAcceptableBid + listing.minimumBidIncrement * 2;
        setMaxInput(suggested.toString());
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRule();
  }, [listing.id, isAuthenticated, userRole]);

  // When listing updates from parent WebSocket
  useEffect(() => {
    if (rule) {
      setRule((prev) =>
        prev
          ? {
              ...prev,
              currentHighestBid: listing.currentHighestBid,
              minimumAcceptableBid: listing.minimumAcceptableBid,
              isLeading: listing.leadingBidderDisplayName === rule.listingTitle, // fallback
            }
          : null
      );
    }
  }, [listing.currentHighestBid, listing.minimumAcceptableBid]);

  if (!isAuthenticated || userRole !== 'JUNIOR' || isSeller) {
    return null;
  }

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const val = parseFloat(maxInput);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive maximum amount.');
      return;
    }

    if (val < listing.minimumAcceptableBid) {
      setError(`Maximum limit must be at least the next minimum valid bid of ${formatCurrency(listing.minimumAcceptableBid)}.`);
      return;
    }

    setIsUpdateMode(!!rule && rule.status === 'ACTIVE');
    setShowConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const val = parseFloat(maxInput);
      const saved = await autoBidService.activateOrUpdate(listing.id, val);
      setRule(saved);
      setShowConfirmModal(false);
      setSuccess(`Automatic bidding active! Proxy limit: ${formatCurrency(saved.maxAmount)}.`);
      setTimeout(() => setSuccess(null), 5000);
      if (onRuleChanged) onRuleChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to activate automatic bidding.');
      setShowConfirmModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await autoBidService.pauseRule(listing.id);
      setRule(updated);
      setSuccess('Automatic bidding paused.');
      setTimeout(() => setSuccess(null), 4000);
      if (onRuleChanged) onRuleChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to pause.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await autoBidService.resumeRule(listing.id);
      setRule(updated);
      setSuccess('Automatic bidding resumed.');
      setTimeout(() => setSuccess(null), 4000);
      if (onRuleChanged) onRuleChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to resume.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your automatic bidding rule for this auction?')) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await autoBidService.cancelRule(listing.id);
      setRule(updated);
      setSuccess('Automatic bidding cancelled.');
      setTimeout(() => setSuccess(null), 4000);
      if (onRuleChanged) onRuleChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        );
      case 'OUTBID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Outbid (Limit Reached)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Cancelled
          </span>
        );
      case 'WON':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 text-white">
            Won
          </span>
        );
      case 'LOST':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            Auction Ended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
            Automatic (Proxy) Bidding
          </h4>
        </div>
        {rule && getStatusBadge(rule.status)}
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Existing Active/Paused Rule Summary */}
      {rule && (rule.status === 'ACTIVE' || rule.status === 'PAUSED' || rule.status === 'OUTBID') && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 uppercase font-bold">Your Authorized Max:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {formatCurrency(rule.maxAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Next Required Bid:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(listing.minimumAcceptableBid)}
            </span>
          </div>

          {rule.status === 'OUTBID' && (
            <p className="text-rose-600 dark:text-rose-400 text-[11px] font-sans pt-1">
              Bidding reached or exceeded your limit of {formatCurrency(rule.maxAmount)}. Enter a higher limit below to resume.
            </p>
          )}

          {/* Quick Action Buttons: Pause/Resume/Cancel */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {rule.status === 'ACTIVE' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePause}
                className="flex-1 py-1.5 px-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold font-mono rounded flex items-center justify-center gap-1 transition-all"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            )}

            {rule.status === 'PAUSED' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResume}
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono rounded flex items-center justify-center gap-1 transition-all"
              >
                <Play className="w-3 h-3" />
                Resume
              </button>
            )}

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCancel}
              className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono rounded flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activation / Update Form */}
      {listing.status === 'OPEN' && !listing.expired && (
        <form onSubmit={handleOpenConfirm} className="space-y-3">
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <label htmlFor="maxAmountInput" className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                {rule && rule.status === 'ACTIVE' ? 'Update Max Amount (₹)' : 'Set Max Limit (₹)'}
              </label>
              <span className="text-slate-500 text-[11px]">
                Min: {formatCurrency(listing.minimumAcceptableBid)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-base">
                ₹
              </span>
              <input
                id="maxAmountInput"
                type="number"
                step="1"
                min={listing.minimumAcceptableBid}
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                placeholder={`Min ${listing.minimumAcceptableBid}`}
                required
                className="w-full pl-8 pr-3 py-2 font-mono font-bold text-base bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-display font-black text-xs uppercase tracking-wider py-2.5 rounded shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>
              {rule && rule.status === 'ACTIVE'
                ? 'Update Automatic Limit'
                : 'Activate Automatic Bidding'}
            </span>
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      <AutoBidConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmActivate}
        listingTitle={listing.title}
        currentHighestBid={listing.currentHighestBid}
        maxAmount={parseFloat(maxInput) || 0}
        isUpdate={isUpdateMode}
        submitting={actionLoading}
      />
    </div>
  );
};
