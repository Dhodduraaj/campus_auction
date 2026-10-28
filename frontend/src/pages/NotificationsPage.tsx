import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem } from '../types';
import { Bell, Check, CheckCheck, Monitor, ExternalLink, ArrowLeft } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { desktopNotificationsEnabled, enableDesktopNotifications, disableDesktopNotifications, refreshUnreadCount } =
    useNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(0, 50);
      setNotifications(res.content);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      refreshUnreadCount();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      refreshUnreadCount();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleToggleDesktopNotifications = async () => {
    if (desktopNotificationsEnabled) {
      disableDesktopNotifications();
    } else {
      const granted = await enableDesktopNotifications();
      if (!granted) {
        alert('Notification permission was denied or dismissed in browser settings.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Real-time updates on your bids, auction closures, seller approvals, and campus handovers.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 bg-white"
          >
            <CheckCheck className="w-4 h-4 text-orange-600" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Desktop Web Notification Preferences Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-sm">Browser Desktop Notifications</span>
          </div>
          <p className="text-xs text-slate-400 font-mono max-w-xl">
            Receive instant pop-up alerts when outbid or when auctions close while keeping the platform open in a background tab.
          </p>
        </div>

        <button
          onClick={handleToggleDesktopNotifications}
          className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
            desktopNotificationsEnabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {desktopNotificationsEnabled ? 'Notifications Active' : 'Enable Desktop Alerts'}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center space-y-3">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-display font-bold text-base text-slate-800">No notifications yet</p>
          <p className="text-xs text-slate-500 font-mono">
            When someone bids on your item or you are outbid, alerts will appear right here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-lg border transition-colors flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-orange-50/50 border-orange-200 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0"></span>
                    )}
                    <h4 className="font-display font-bold text-sm text-slate-900">{n.title}</h4>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed">{n.message}</p>

                  {n.relatedListingId && (
                    <button
                      onClick={() => onNavigate('listing-detail', { id: n.relatedListingId })}
                      className="text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>View Auction #{n.relatedListingId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded hover:bg-orange-100 text-orange-700 text-xs font-mono flex items-center gap-1 flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
