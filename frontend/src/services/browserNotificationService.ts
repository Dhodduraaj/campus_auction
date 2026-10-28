const STORAGE_KEY = 'campus_auction_desktop_notifications_enabled';

class BrowserNotificationManager {
  private sentNotificationIds = new Set<string>();

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  isEnabled(): boolean {
    if (!this.isSupported()) return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true' && Notification.permission === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      } else {
        localStorage.setItem(STORAGE_KEY, 'false');
        return false;
      }
    } catch {
      return false;
    }
  }

  setEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }

  showNotification(id: string | number, title: string, body: string): void {
    if (!this.isEnabled()) return;
    const key = String(id);
    if (this.sentNotificationIds.has(key)) return;

    this.sentNotificationIds.add(key);

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: key,
      });
    } catch (e) {
      console.warn('Could not display browser notification', e);
    }
  }
}

export const browserNotificationService = new BrowserNotificationManager();
