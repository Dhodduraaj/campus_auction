import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { MyBidsPage } from './pages/MyBidsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ListingCategory } from './types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface NavigationState {
  page: string;
  params?: Record<string, any>;
}

const AccessDenied: React.FC<{
  title: string;
  message: string;
  onNavigate: (page: string) => void;
  targetPage: string;
  targetLabel: string;
}> = ({ title, message, onNavigate, targetPage, targetLabel }) => (
  <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm text-center">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</h2>
    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
    <button
      onClick={() => onNavigate(targetPage)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded transition-colors"
    >
      <span>{targetLabel}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

export const MainApp: React.FC = () => {
  const [nav, setNav] = useState<NavigationState>({ page: 'home' });
  const { user, isAuthenticated } = useAuth();

  // Handle browser URL hash for friendly deep linking & reload persistence
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setNav({ page: 'home' });
        return;
      }
      const [route, queryString] = hash.split('?');
      const params: Record<string, any> = {};
      if (queryString) {
        new URLSearchParams(queryString).forEach((val, key) => {
          params[key] = isNaN(Number(val)) ? val : Number(val);
        });
      }
      setNav({ page: route, params });
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: string, params?: Record<string, any>) => {
    setNav({ page, params });
    let hash = `#${page}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) hash += `?${qs}`;
    }
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    // Unauthenticated protection for private routes
    const privateRoutes = ['create-listing', 'my-listings', 'my-bids', 'notifications', 'profile'];
    if (privateRoutes.includes(nav.page) && !isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }

    // Role-based protection: Junior cannot create or manage listings
    if ((nav.page === 'create-listing' || nav.page === 'my-listings') && user?.role === 'JUNIOR') {
      return (
        <AccessDenied
          title="Senior Access Only"
          message="Junior accounts can bid on items. Creating and managing listings is reserved for Senior accounts."
          onNavigate={navigate}
          targetPage="marketplace"
          targetLabel="Browse Marketplace"
        />
      );
    }

    // Role-based protection: Senior cannot access buyer-only bidding dashboard
    if (nav.page === 'my-bids' && user?.role === 'SENIOR') {
      return (
        <AccessDenied
          title="Junior Access Only"
          message="Senior accounts can list and sell items. Placing and tracking bids is reserved for Junior accounts."
          onNavigate={navigate}
          targetPage="my-listings"
          targetLabel="View My Listings"
        />
      );
    }

    switch (nav.page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'marketplace':
        return (
          <MarketplacePage
            onNavigate={navigate}
            initialCategory={nav.params?.category as ListingCategory}
          />
        );
      case 'listing-detail':
        return <ListingDetailPage id={Number(nav.params?.id)} onNavigate={navigate} />;
      case 'create-listing':
        return <CreateListingPage onNavigate={navigate} />;
      case 'my-listings':
        return <MyListingsPage onNavigate={navigate} />;
      case 'my-bids':
        return <MyBidsPage onNavigate={navigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-600 selection:text-white transition-colors duration-150">
      <Navbar onNavigate={navigate} currentPage={nav.page} />
      <main className="flex-grow">{renderPage()}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
