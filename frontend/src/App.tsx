import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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

interface NavigationState {
  page: string;
  params?: Record<string, any>;
}

export const MainApp: React.FC = () => {
  const [nav, setNav] = useState<NavigationState>({ page: 'home' });

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      <Navbar onNavigate={navigate} currentPage={nav.page} />
      <main className="flex-grow">{renderPage()}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
