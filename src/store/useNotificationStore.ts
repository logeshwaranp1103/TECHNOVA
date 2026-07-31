import { create } from 'zustand';
import { SystemNotification, NotificationType } from '../types/notification';
import { api } from '../services/api';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface NotificationState {
  notifications: SystemNotification[];
  toasts: ToastItem[];
  isLoading: boolean;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerNotification: (params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  isLoading: false,

  fetchNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      const notifications = await api.getNotifications(userId);
      set({ notifications, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await api.markNotificationRead(id);
    set({
      notifications: get().notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { ...toast, id };
    set({ toasts: [...get().toasts, newToast] });
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  triggerNotification: ({ userId, type, title, message, link }) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      link,
    };
    api.addNotification(newNotif);
    set({ notifications: [newNotif, ...get().notifications] });

    // Toast mapping
    const toastTypeMap: Record<NotificationType, ToastItem['type']> = {
      BOOKING_CONFIRMATION: 'success',
      UPCOMING_REMINDER: 'info',
      CHECKIN_REMINDER: 'info',
      CANCELLATION: 'warning',
      EXPIRY_WARNING: 'warning',
      WAITLIST_PROMOTION: 'success',
      ANNOUNCEMENT: 'info',
    };

    get().addToast({
      type: toastTypeMap[type] || 'info',
      title,
      message,
    });
  },
}));
