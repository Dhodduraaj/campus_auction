import React, { useState, useEffect } from 'react';
import { HandoverContact } from '../../types';
import { handoverService } from '../../services/handoverService';
import { X, Mail, Phone, ShieldCheck, MessageSquare, Loader2, UserCheck } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
  onOpenChat?: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  onOpenChat,
}) => {
  const [contact, setContact] = useState<HandoverContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && listingId) {
      setLoading(true);
      setError(null);
      handoverService
        .getContactDetails(listingId)
        .then((data) => setContact(data))
        .catch((err) => {
          setError(err?.message || 'Contact details are only unlocked after the winning bid is approved.');
        })
        .finally(() => setLoading(false));
    } else {
      setContact(null);
    }
  }, [isOpen, listingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Handover Contact Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            Item: <span className="font-semibold text-slate-800 dark:text-slate-200">{listingTitle}</span>
          </p>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span>Verifying authorization...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg">
              {error}
            </div>
          ) : contact ? (
            <div className="space-y-4">
              {/* Participant info card */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {contact.role === 'SENIOR' ? 'Seller Contact' : 'Buyer Contact'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold">
                    VERIFIED STUDENT
                  </span>
                </div>

                <div className="font-bold text-base text-slate-900 dark:text-white">
                  {contact.name}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:underline font-mono text-xs">
                    {contact.email}
                  </a>
                </div>

                {contact.phoneNumber && contact.phoneNumber !== 'Not provided' && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a href={`tel:${contact.phoneNumber}`} className="hover:underline font-mono text-xs">
                      {contact.phoneNumber}
                    </a>
                  </div>
                )}
              </div>

              {/* Campus handover guideline */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  {contact.campusHandoverGuide ||
                    'Meet at a well-lit, public campus location (e.g. Student Center or Campus Gate) to verify the item before completing handover.'}
                </p>
              </div>

              {/* Chat action button */}
              {onOpenChat && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChat();
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open On-Site Handover Chat</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
