import { useState, useEffect, useCallback } from 'react';
import { 
  getUserNotifications,
  markNotificationAsRead,
  getUserPreferences,
  updateUserPreferences,
  subscribeToUserNotifications,
  getNotificationStats
} from '../services/notification/notificationService';
import { NotificationScheduler } from '../services/notification/notificationScheduler';
import type { 
  Notification,
  NotificationPreference,
  UpdatePreferencesRequest
} from '../types/notification';

// Hook for managing user notifications
export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const userNotifications = await getUserNotifications(userId);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => n.status !== 'read').length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read', readAt: new Date() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status !== 'read');
      await Promise.all(
        unreadNotifications.map(notification => markNotificationAsRead(notification.id))
      );
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: 'read', 
          readAt: new Date() 
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [notifications]);

  // Send immediate notification
  const sendNotification = useCallback(async (
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ) => {
    try {
      await NotificationScheduler.sendImmediateNotification(
        userId,
        type,
        title,
        message,
        priority
      );
      // Reload notifications to show the new one
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    }
  }, [userId, loadNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserNotifications(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => n.status !== 'read').length);
    });

    return unsubscribe;
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
    refetch: loadNotifications
  };
};

// Hook for managing notification preferences
export const useNotificationPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const userPreferences = await getUserPreferences(userId);
      setPreferences(userPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: UpdatePreferencesRequest) => {
    if (!userId) return;
    
    try {
      setSaving(true);
      setError(null);
      await updateUserPreferences(userId, updates);
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    saving,
    updatePreferences,
    refetch: loadPreferences
  };
};

// Hook for notification statistics
export const useNotificationStats = (userId?: string) => {
  const [stats, setStats] = useState<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
    read: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const notificationStats = await getNotificationStats(userId);
      setStats(notificationStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

// Hook for scheduling notifications
export const useNotificationScheduler = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedulePaymentReminders = useCallback(async (
    userId: string,
    billId: string,
    amount: number,
    dueDate: Date,
    serviceName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.schedulePaymentReminders(
        userId,
        billId,
        amount,
        dueDate,
        serviceName
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule payment reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleMembershipReminders = useCallback(async (
    userId: string,
    membershipId: string,
    membershipType: string,
    expiryDate: Date
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.scheduleMembershipReminders(
        userId,
        membershipId,
        membershipType,
        expiryDate
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule membership reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleClassReminders = useCallback(async (
    userId: string,
    classId: string,
    className: string,
    classTime: Date,
    instructorName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.scheduleClassReminders(
        userId,
        classId,
        className,
        classTime,
        instructorName
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule class reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendWelcomeNotification = useCallback(async (
    userId: string,
    userName: string,
    gymName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.sendWelcomeNotification(userId, userName, gymName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send welcome notification');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendBirthdayNotification = useCallback(async (
    userId: string,
    userName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.sendBirthdayNotification(userId, userName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send birthday notification');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPromotionalNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    relatedEntityId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationScheduler.sendPromotionalNotification(
        userId,
        title,
        message,
        relatedEntityId
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send promotional notification');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    schedulePaymentReminders,
    scheduleMembershipReminders,
    scheduleClassReminders,
    sendWelcomeNotification,
    sendBirthdayNotification,
    sendPromotionalNotification
  };
};