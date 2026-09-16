import { Activity } from '@/lib/types';
import { getTodayString } from '@/lib/utils';

export const notificationService = {
  // Register lightweight service worker for mobile notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        return registration;
      } catch (err) {
        console.warn('Service Worker registration skipped or failed:', err);
        return null;
      }
    }
    return null;
  },

  // Request browser notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if ('serviceWorker' in navigator) {
        this.registerServiceWorker().catch(() => {});
      }
      return await Notification.requestPermission();
    }
    return 'denied';
  },

  // Check which activities need reminders right now
  getDueReminders(activities: Activity[]): Activity[] {
    const now = new Date();
    const today = getTodayString();

    return activities.filter((act) => {
      if (act.status === 'completed') return false;
      if (!act.hasReminder) return false;

      // Check if scheduled for today
      if (act.plannedDate !== today) return false;

      // Check reminderTime or earlierReminderTime
      const timesToCheck = [act.reminderTime, act.earlierReminderTime].filter(Boolean);

      return timesToCheck.some((timeStr) => {
        if (!timeStr) return false;
        try {
          // If format is YYYY-MM-DDTHH:mm
          const remTime = new Date(timeStr);
          if (isNaN(remTime.getTime())) {
            // Maybe HH:mm format
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduled = new Date();
            scheduled.setHours(hours, minutes, 0, 0);
            const diffMins = (now.getTime() - scheduled.getTime()) / (1000 * 60);
            return diffMins >= -15 && diffMins <= 60; // Alert within 15m before and 1h after
          }
          const diffMins = (now.getTime() - remTime.getTime()) / (1000 * 60);
          return diffMins >= -15 && diffMins <= 60;
        } catch {
          return false;
        }
      });
    });
  },

  // Trigger system notification safely (supports Mobile Chrome & Desktop)
  async showNotification(title: string, body: string, icon = '/favicon.ico'): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // 1. Try ServiceWorkerRegistration.showNotification() (Required on Mobile Chrome / Android)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: `dwm-alert-${title.slice(0, 20)}`,
          });
          return;
        }
      } catch (swErr) {
        console.warn('ServiceWorker showNotification failed, trying standard constructor:', swErr);
      }
    }

    // 2. Fallback to standard Desktop `new Notification(...)` in try/catch block
    try {
      new Notification(title, { body, icon });
    } catch (notifErr) {
      console.warn('Desktop Notification constructor failed or blocked on this device:', notifErr);
    }
  },
};
