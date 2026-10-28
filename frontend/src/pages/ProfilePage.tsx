import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { UserProfile, UpdateContactDetailsInput } from '../types';
import {
  ShieldCheck,
  Package,
  Gavel,
  Award,
  ArrowLeft,
  GraduationCap,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  Edit3,
  Check,
  Loader2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Contact details update state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [campusLocation, setCampusLocation] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState<string | null>(null);
  const [contactErrorMsg, setContactErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
      } catch (err) {
        console.warn('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || '');
      setWhatsappNumber(profile.whatsappNumber || '');
      setCampusLocation(profile.campusLocation || '');
      setContactNote(profile.contactNote || '');
      setSameAsMobile(
        !!profile.phoneNumber &&
        !!profile.whatsappNumber &&
        profile.phoneNumber === profile.whatsappNumber
      );
    }
  }, [profile]);

  const handleStartEdit = () => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || '');
      setWhatsappNumber(profile.whatsappNumber || '');
      setCampusLocation(profile.campusLocation || '');
      setContactNote(profile.contactNote || '');
      setSameAsMobile(
        !!profile.phoneNumber &&
        !!profile.whatsappNumber &&
        profile.phoneNumber === profile.whatsappNumber
      );
    }
    setContactSuccessMsg(null);
    setContactErrorMsg(null);
    setIsEditingContact(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || '');
      setWhatsappNumber(profile.whatsappNumber || '');
      setCampusLocation(profile.campusLocation || '');
      setContactNote(profile.contactNote || '');
    }
    setContactErrorMsg(null);
    setIsEditingContact(false);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactSuccessMsg(null);
    setContactErrorMsg(null);

    const payload: UpdateContactDetailsInput = {
      phoneNumber: phoneNumber.trim(),
      whatsappNumber: sameAsMobile ? phoneNumber.trim() : whatsappNumber.trim(),
      campusLocation: campusLocation.trim(),
      contactNote: contactNote.trim(),
    };

    try {
      const updated = await authService.updateContactDetails(payload);
      setProfile(updated);
      setContactSuccessMsg(
        'Contact details updated successfully! These details will be shown to the counterparty after the auction ends.'
      );
      setIsEditingContact(false);
      setTimeout(() => setContactSuccessMsg(null), 6000);
    } catch (err: any) {
      setContactErrorMsg(err?.message || 'Failed to update contact details. Please try again.');
    } finally {
      setSavingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-bold text-slate-800 dark:text-slate-200">
          Please sign in to view profile.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="bg-orange-600 text-white font-bold text-xs uppercase px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  const isSenior = profile.role === 'SENIOR' || profile.role === 'ADMIN';
  const isJunior = profile.role === 'JUNIOR' || profile.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => onNavigate('marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Profile Header Card */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-lg p-6 sm:p-7 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-orange-600 text-white font-display font-black text-2xl flex items-center justify-center">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-black text-2xl text-white">{profile.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    profile.role === 'SENIOR'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : profile.role === 'JUNIOR'
                      ? 'bg-sky-950 text-sky-300 border-sky-800'
                      : 'bg-purple-950 text-purple-300 border-purple-800'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  {profile.role === 'SENIOR'
                    ? 'Senior Account (Seller)'
                    : profile.role === 'JUNIOR'
                    ? 'Junior Account (Bidder)'
                    : 'Admin'}
                </span>
                {profile.campusVerificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> Campus Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
              {profile.studentId && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Student ID: {profile.studentId}
                </p>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Role-Specific Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {isSenior && (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center space-y-1 shadow-sm">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400 mx-auto" />
              <span className="block font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                {profile.totalListingsCount}
              </span>
              <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                Total Listings
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center space-y-1 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto animate-pulse"></div>
              <span className="block font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                {profile.activeListingsCount}
              </span>
              <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                Active Listings
              </span>
            </div>
          </>
        )}

        {isJunior && (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center space-y-1 shadow-sm">
              <Gavel className="w-5 h-5 text-sky-600 dark:text-sky-400 mx-auto" />
              <span className="block font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                {profile.totalBidsPlacedCount}
              </span>
              <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                Bids Placed
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center space-y-1 shadow-sm">
              <Award className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto" />
              <span className="block font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                {profile.auctionsWonCount}
              </span>
              <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                Items Won
              </span>
            </div>
          </>
        )}
      </div>

      {/* Contact & Campus Handover Details Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Contact & Campus Handover Details
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              These details are securely shared with the counterparty when an auction ends to facilitate item inspection, calls, WhatsApp coordination, and on-campus handover.
            </p>
          </div>

          {!isEditingContact && (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Contact Details
            </button>
          )}
        </div>

        {/* Notifications */}
        {contactSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{contactSuccessMsg}</span>
          </div>
        )}

        {contactErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{contactErrorMsg}</span>
          </div>
        )}

        {!isEditingContact ? (
          /* View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Mobile Number
              </div>
              {profile.phoneNumber ? (
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`tel:${profile.phoneNumber}`}
                    className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 transition-colors"
                  >
                    {profile.phoneNumber}
                  </a>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Voice Calling
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">Not provided yet</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                WhatsApp Number
              </div>
              {profile.whatsappNumber ? (
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 transition-colors"
                  >
                    {profile.whatsappNumber}
                  </a>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    WhatsApp Chat
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">Not provided yet</p>
              )}
            </div>

            {/* Campus / Hostel Location */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-sky-500" />
                Campus Location / Hostel
              </div>
              {profile.campusLocation ? (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 pt-1">
                  {profile.campusLocation}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">Not provided yet</p>
              )}
            </div>

            {/* Handover Notes / Availability */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <FileText className="w-4 h-4 text-amber-500" />
                Handover Notes & Availability
              </div>
              {profile.contactNote ? (
                <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1">
                  "{profile.contactNote}"
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">Not provided yet</p>
              )}
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mobile Number Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (sameAsMobile) {
                      setWhatsappNumber(e.target.value);
                    }
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Used by the buyer/seller to reach you via direct call upon auction conclusion.
                </span>
              </div>

              {/* WhatsApp Number Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    WhatsApp Number
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => {
                        setSameAsMobile(e.target.checked);
                        if (e.target.checked) {
                          setWhatsappNumber(phoneNumber);
                        }
                      }}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Same as mobile
                  </label>
                </div>
                <input
                  type="tel"
                  value={sameAsMobile ? phoneNumber : whatsappNumber}
                  disabled={sameAsMobile}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Enables instant 1-click WhatsApp messaging on the handover contact modal.
                </span>
              </div>
            </div>

            {/* Campus / Hostel Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                Campus Location / Hostel Room
              </label>
              <input
                type="text"
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                placeholder="e.g. Hostel Block B, Room 305 or Day Scholar (Mechanical Dept)"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Helps coordinate physical item handoff locations across campus.
              </span>
            </div>

            {/* Handover Notes & Availability */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Handover Notes & Availability
              </label>
              <textarea
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                rows={2}
                placeholder="e.g. Free weekdays after 4:30 PM; prefer meeting near Central Library or Canteen"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                Privacy Protection: Your contact information is never displayed publicly on marketplace auction listings. It is disclosed strictly to the winning student or seller after the auction completes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingContact}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingContact}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                {savingContact ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Contact Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Role-Specific Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isSenior && (
          <>
            <button
              onClick={() => onNavigate('my-listings')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
            >
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                My Listings &rarr;
              </h4>
            </button>

            <button
              onClick={() => onNavigate('create-listing')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
            >
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Create Listing &rarr;
              </h4>
            </button>
          </>
        )}

        {isJunior && (
          <>
            <button
              onClick={() => onNavigate('my-bids')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
            >
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                My Bids &rarr;
              </h4>
            </button>

            <button
              onClick={() => onNavigate('marketplace')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
            >
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Browse Marketplace &rarr;
              </h4>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
