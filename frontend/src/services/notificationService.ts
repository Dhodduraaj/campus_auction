import { apiRequest } from './apiClient';
import { NotificationItem, PagedData } from '../types';

export const notificationService = {
  async getNotifications(page = 0, size = 20): Promise<PagedData<NotificationItem>> {
    return apiRequest<PagedData<NotificationItem>>(`/api/users/me/notifications?page=${page}&size=${size}`);
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiRequest<{ unreadCount: number }>('/api/users/me/notifications/unread-count');
    return res.unreadCount;
  },

  async markAsRead(id: number): Promise<NotificationItem> {
    return apiRequest<NotificationItem>(`/api/users/me/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<void> {
    await apiRequest<void>('/api/users/me/notifications/read-all', {
      method: 'POST',
    });
  },
};
