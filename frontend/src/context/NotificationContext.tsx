import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { browserNotificationService } from '../services/browserNotificationService';
import { webSocketService } from '../services/webSocketService';
import { NotificationItem } from '../types';

interface NotificationContextType {
  unreadCount: number;
  desktopNotificationsEnabled: boolean;
  enableDesktopNotifications: () => Promise<boolean>;
  disableDesktopNotifications: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    browserNotificationService.isEnabled()
  );

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshUnreadCount();

      // Subscribe to real-time notification stream for this specific student
      const unsubscribe = webSocketService.subscribe<NotificationItem>(
        `/topic/notifications/${user.id}`,
        (notification) => {
          setUnreadCount((prev) => prev + 1);

          // Show browser notification if enabled
          browserNotificationService.showNotification(
            notification.id,
            notification.title,
            notification.message
          );
        }
      );

      return () => {
        unsubscribe();
      };
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id]);

  const enableDesktopNotifications = async (): Promise<boolean> => {
    const granted = await browserNotificationService.requestPermission();
    setDesktopNotificationsEnabled(granted);
    return granted;
  };

  const disableDesktopNotifications = () => {
    browserNotificationService.setEnabled(false);
    setDesktopNotificationsEnabled(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        desktopNotificationsEnabled,
        enableDesktopNotifications,
        disableDesktopNotifications,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
