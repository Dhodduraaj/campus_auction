import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { ShieldCheck, User as UserIcon, Mail, Phone, Calendar, Package, Gavel, Award, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-bold text-slate-800">Please sign in to view student profile.</p>
        <button
          onClick={() => onNavigate('login')}
          className="bg-orange-600 text-white font-bold text-xs uppercase px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={() => onNavigate('marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Profile Header Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-orange-600 text-white font-display font-black text-2xl flex items-center justify-center">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-2xl text-white">{profile.name}</h1>
                {profile.campusVerificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
              {profile.studentId && (
                <p className="text-xs text-slate-300 font-mono mt-0.5">Student ID: {profile.studentId}</p>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Real Database Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 text-center space-y-1 shadow-sm">
          <Package className="w-5 h-5 text-orange-600 mx-auto" />
          <span className="block font-mono font-extrabold text-2xl text-slate-900">
            {profile.totalListingsCount}
          </span>
          <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
            Total Auctions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 text-center space-y-1 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto animate-pulse"></div>
          <span className="block font-mono font-extrabold text-2xl text-slate-900">
            {profile.activeListingsCount}
          </span>
          <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
            Active Auctions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 text-center space-y-1 shadow-sm">
          <Gavel className="w-5 h-5 text-blue-600 mx-auto" />
          <span className="block font-mono font-extrabold text-2xl text-slate-900">
            {profile.totalBidsPlacedCount}
          </span>
          <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
            Bids Placed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 text-center space-y-1 shadow-sm">
          <Award className="w-5 h-5 text-amber-500 mx-auto" />
          <span className="block font-mono font-extrabold text-2xl text-slate-900">
            {profile.auctionsWonCount}
          </span>
          <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
            Auctions Won
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('my-listings')}
          className="p-4 bg-white border border-slate-200 hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
        >
          <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-orange-600">
            Manage My Listings &rarr;
          </h4>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Review incoming bids, approve provisional winners, or cancel active auctions.
          </p>
        </button>

        <button
          onClick={() => onNavigate('my-bids')}
          className="p-4 bg-white border border-slate-200 hover:border-orange-500 rounded-lg text-left shadow-sm transition-colors group"
        >
          <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-orange-600">
            View My Bidding Activity &rarr;
          </h4>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Check current high bids on items you are competing for across campus.
          </p>
        </button>
      </div>
    </div>
  );
};
