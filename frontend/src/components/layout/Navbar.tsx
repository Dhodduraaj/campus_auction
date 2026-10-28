import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  Plus,
  User,
  LogOut,
  Package,
  Gavel,
  Shield,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  Trophy,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isSenior = user?.role === 'SENIOR' || user?.role === 'ADMIN';
  const isJunior = user?.role === 'JUNIOR' || user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-display font-black text-white text-lg tracking-wider">
                C
              </div>
              <div>
                <span className="font-display font-black text-lg tracking-tight uppercase text-white block leading-none">
                  Campus<span className="text-orange-500">Auction</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                  Fair Campus Trading
                </span>
              </div>
            </button>

            {/* Role-Specific Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('marketplace')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'marketplace'
                    ? 'bg-slate-800 text-orange-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Browse Auctions
              </button>

              <button
                onClick={() => onNavigate('ai-assistant')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'ai-assistant'
                    ? 'bg-slate-800 text-purple-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Assistant</span>
              </button>

              {isAuthenticated && isSenior && (
                <button
                  onClick={() => onNavigate('my-listings')}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                    currentPage === 'my-listings'
                      ? 'bg-slate-800 text-orange-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  My Listings
                </button>
              )}

              {isAuthenticated && isJunior && (
                <>
                  <button
                    onClick={() => onNavigate('my-bids')}
                    className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                      currentPage === 'my-bids'
                        ? 'bg-slate-800 text-orange-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    My Bids
                  </button>

                  <button
                    onClick={() => onNavigate('won-items')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                      currentPage === 'won-items'
                        ? 'bg-slate-800 text-orange-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Won Items</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Section: Theme Toggle, List Button, Notifications, User Menu */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-300" />
              )}
            </button>

            {/* List Item Button - ONLY for Seniors or unauthenticated */}
            {(!isAuthenticated || isSenior) && (
              <button
                onClick={() => onNavigate(isAuthenticated ? 'create-listing' : 'login')}
                className="hidden sm:inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Listing</span>
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <button
                  onClick={() => onNavigate('notifications')}
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm font-semibold text-white transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center font-bold text-xs uppercase text-orange-400">
                      {user?.name.charAt(0)}
                    </div>
                    <span className="hidden lg:inline max-w-[110px] truncate">{user?.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        user?.role === 'SENIOR'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : user?.role === 'JUNIOR'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              user?.role === 'SENIOR'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : user?.role === 'JUNIOR'
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            }`}
                          >
                            <GraduationCap className="w-3 h-3" />
                            {user?.role === 'SENIOR'
                              ? 'Senior (Seller)'
                              : user?.role === 'JUNIOR'
                              ? 'Junior (Bidder)'
                              : 'Admin'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('profile')}
                        className="w-full text-left px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Profile
                      </button>

                      <button
                        onClick={() => onNavigate('ai-assistant')}
                        className="w-full text-left px-3.5 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" /> AI Assistant
                      </button>

                      {isSenior && (
                        <button
                          onClick={() => onNavigate('my-listings')}
                          className="w-full text-left px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                        >
                          <Package className="w-4 h-4 text-slate-400" /> My Listings
                        </button>
                      )}

                      {isJunior && (
                        <>
                          <button
                            onClick={() => onNavigate('my-bids')}
                            className="w-full text-left px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                          >
                            <Gavel className="w-4 h-4 text-slate-400" /> My Bids
                          </button>

                          <button
                            onClick={() => onNavigate('won-items')}
                            className="w-full text-left px-3.5 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                          >
                            <Trophy className="w-4 h-4 text-amber-400" /> Won Items / Purchases
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            onNavigate('home');
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-sm font-bold bg-white text-slate-950 hover:bg-slate-100 rounded transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
