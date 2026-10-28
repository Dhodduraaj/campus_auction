import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem } from '../types';
import { Bell, Check, CheckCheck, Monitor, ExternalLink } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const {
    desktopNotificationsEnabled,
    enableDesktopNotifications,
    disableDesktopNotifications,
    refreshUnreadCount,
  } = useNotifications();

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
        alert('Notification permission was denied in browser settings.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h1>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <CheckCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Desktop Web Notification Preferences Banner */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-sm">Browser Alerts</span>
        </div>

        <button
          onClick={handleToggleDesktopNotifications}
          className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
            desktopNotificationsEnabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {desktopNotificationsEnabled ? 'Active' : 'Enable'}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-14 text-center space-y-3">
          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-display font-bold text-base text-slate-800 dark:text-slate-200">
            No notifications
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
                    ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0"></span>
                    )}
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      , {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                    {n.message}
                  </p>

                  {n.relatedListingId && (
                    <button
                      onClick={() => onNavigate('listing-detail', { id: n.relatedListingId })}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>View Auction #{n.relatedListingId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded hover:bg-orange-100 dark:hover:bg-slate-800 text-orange-700 dark:text-orange-400 text-xs font-mono flex items-center gap-1 flex-shrink-0"
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
