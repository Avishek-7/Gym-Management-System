import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../core/firebase';
import type { 
  Notification,
  NotificationTemplate,
  NotificationPreference,
  ScheduledNotification,
  CreateNotificationRequest,
  CreateTemplateRequest,
  UpdatePreferencesRequest,
  CreateScheduledNotificationRequest
} from '../../types/notification';
import { logger } from '../../utils/logger';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Notification CRUD Operations
export const createNotification = async (request: CreateNotificationRequest): Promise<string> => {
  logger.info('Creating notification', {
    service: 'notificationService',
    action: 'createNotification',
    userId: request.userId,
    type: request.type,
    channels: request.channels
  });

  try {
    const notificationData = {
      ...request,
      priority: request.priority || 'medium',
      status: 'pending',
      channels: request.channels.map(type => ({
        type,
        status: 'pending'
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.logFirebaseOperation('create', 'notifications', {
      userId: request.userId,
      type: request.type
    });

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    
    logger.info('Notification created successfully', {
      service: 'notificationService',
      notificationId: docRef.id,
      userId: request.userId,
      type: request.type
    });
    
    return docRef.id;
  } catch (error) {
    logger.error('Failed to create notification', error, {
      service: 'notificationService',
      action: 'createNotification',
      userId: request.userId
    });
    throw new Error('Failed to create notification');
  }
};

export const getNotification = async (id: string): Promise<Notification | null> => {
  try {
    const docRef = doc(db, 'notifications', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        scheduledFor: convertTimestamp(data.scheduledFor),
        sentAt: convertTimestamp(data.sentAt),
        readAt: convertTimestamp(data.readAt),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Notification;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification:', error);
    throw new Error('Failed to get notification');
  }
};

export const getUserNotifications = async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
  logger.debug('Fetching user notifications', {
    service: 'notificationService',
    action: 'getUserNotifications',
    userId,
    limit: limitCount
  });

  try {
    logger.logFirebaseOperation('query', 'notifications', { userId, limit: limitCount });
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledFor: convertTimestamp(data.scheduledFor),
        sentAt: convertTimestamp(data.sentAt),
        readAt: convertTimestamp(data.readAt),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Notification;
    });

    logger.info('User notifications fetched successfully', {
      service: 'notificationService',
      userId,
      count: notifications.length
    });

    return notifications;
  } catch (error) {
    logger.error('Failed to fetch user notifications', error, {
      service: 'notificationService',
      action: 'getUserNotifications',
      userId
    });
    throw new Error('Failed to get user notifications');
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  logger.info('Marking notification as read', {
    service: 'notificationService',
    action: 'markNotificationAsRead',
    notificationId: id
  });

  try {
    logger.logFirebaseOperation('update', 'notifications', { notificationId: id });
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, {
      status: 'read',
      readAt: new Date(),
      updatedAt: new Date()
    });
    
    logger.info('Notification marked as read', {
      service: 'notificationService',
      notificationId: id
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', error, {
      service: 'notificationService',
      notificationId: id
    });
    throw new Error('Failed to mark notification as read');
  }
};

export const updateNotificationStatus = async (id: string, status: Notification['status']): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, {
      status,
      ...(status === 'sent' && { sentAt: new Date() }),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw new Error('Failed to update notification status');
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

// Template CRUD Operations
export const createTemplate = async (request: CreateTemplateRequest): Promise<string> => {
  try {
    const templateData = {
      ...request,
      defaultPriority: request.defaultPriority || 'medium',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notificationTemplates'), templateData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw new Error('Failed to create template');
  }
};

export const getTemplate = async (id: string): Promise<NotificationTemplate | null> => {
  try {
    const docRef = doc(db, 'notificationTemplates', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as NotificationTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error getting template:', error);
    throw new Error('Failed to get template');
  }
};

export const getAllTemplates = async (): Promise<NotificationTemplate[]> => {
  try {
    const q = query(
      collection(db, 'notificationTemplates'),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as NotificationTemplate;
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    throw new Error('Failed to get templates');
  }
};

export const updateTemplate = async (id: string, updates: Partial<CreateTemplateRequest>): Promise<void> => {
  try {
    const docRef = doc(db, 'notificationTemplates', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    throw new Error('Failed to update template');
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notificationTemplates', id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    throw new Error('Failed to delete template');
  }
};

// Notification Preferences
export const getUserPreferences = async (userId: string): Promise<NotificationPreference | null> => {
  try {
    const q = query(
      collection(db, 'notificationPreferences'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as NotificationPreference;
    }
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw new Error('Failed to get user preferences');
  }
};

export const createDefaultPreferences = async (userId: string): Promise<string> => {
  try {
    const defaultPreferences = {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      paymentReminders: true,
      membershipReminders: true,
      classReminders: true,
      promotionalMessages: false,
      generalAnnouncements: true,
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notificationPreferences'), defaultPreferences);
    return docRef.id;
  } catch (error) {
    console.error('Error creating default preferences:', error);
    throw new Error('Failed to create default preferences');
  }
};

export const updateUserPreferences = async (userId: string, updates: UpdatePreferencesRequest): Promise<void> => {
  try {
    const existing = await getUserPreferences(userId);
    
    if (existing) {
      const docRef = doc(db, 'notificationPreferences', existing.id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } else {
      // Create with updates applied to defaults
      const defaultPreferences = {
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        paymentReminders: true,
        membershipReminders: true,
        classReminders: true,
        promotionalMessages: false,
        generalAnnouncements: true,
        timezone: 'UTC',
        ...updates,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'notificationPreferences'), defaultPreferences);
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update user preferences');
  }
};

// Scheduled Notifications
export const createScheduledNotification = async (request: CreateScheduledNotificationRequest): Promise<string> => {
  try {
    const scheduledData = {
      ...request,
      isRecurring: request.isRecurring || false,
      status: 'active',
      nextSend: request.scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'scheduledNotifications'), scheduledData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled notification:', error);
    throw new Error('Failed to create scheduled notification');
  }
};

export const getScheduledNotifications = async (userId?: string): Promise<ScheduledNotification[]> => {
  try {
    let q = query(
      collection(db, 'scheduledNotifications'),
      where('status', '==', 'active'),
      orderBy('nextSend')
    );

    if (userId) {
      q = query(
        collection(db, 'scheduledNotifications'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('nextSend')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledFor: convertTimestamp(data.scheduledFor) || new Date(),
        lastSent: convertTimestamp(data.lastSent),
        nextSend: convertTimestamp(data.nextSend),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as ScheduledNotification;
    });
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    throw new Error('Failed to get scheduled notifications');
  }
};

export const updateScheduledNotification = async (id: string, updates: Partial<ScheduledNotification>): Promise<void> => {
  try {
    const docRef = doc(db, 'scheduledNotifications', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating scheduled notification:', error);
    throw new Error('Failed to update scheduled notification');
  }
};

export const cancelScheduledNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'scheduledNotifications', id);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
    throw new Error('Failed to cancel scheduled notification');
  }
};

// Business Logic Functions

// Send payment due notifications
export const sendPaymentDueNotifications = async (): Promise<void> => {
  try {
    // This would typically be called by a scheduled job
    // Get all bills that are due soon (implementation depends on your bill structure)
    // For now, this is a placeholder for the business logic
    console.log('Sending payment due notifications...');
    
    // Example logic:
    // 1. Get bills due in next 3 days
    // 2. Check user preferences for payment reminders
    // 3. Create notifications for users who have payment reminders enabled
    // 4. Send notifications through preferred channels
  } catch (error) {
    console.error('Error sending payment due notifications:', error);
    throw new Error('Failed to send payment due notifications');
  }
};

// Send membership expiry notifications
export const sendMembershipExpiryNotifications = async (): Promise<void> => {
  try {
    console.log('Sending membership expiry notifications...');
    
    // Example logic:
    // 1. Get memberships expiring in next 7 days
    // 2. Check user preferences for membership reminders
    // 3. Create notifications for users who have membership reminders enabled
    // 4. Send notifications through preferred channels
  } catch (error) {
    console.error('Error sending membership expiry notifications:', error);
    throw new Error('Failed to send membership expiry notifications');
  }
};

// Bulk operations
export const sendBulkNotifications = async (notifications: CreateNotificationRequest[]): Promise<string[]> => {
  try {
    const batch = writeBatch(db);
    const notificationIds: string[] = [];
    
    notifications.forEach((notification) => {
      const docRef = doc(collection(db, 'notifications'));
      const notificationData = {
        ...notification,
        priority: notification.priority || 'medium',
        status: 'pending',
        channels: notification.channels.map(type => ({
          type,
          status: 'pending'
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      batch.set(docRef, notificationData);
      notificationIds.push(docRef.id);
    });
    
    await batch.commit();
    return notificationIds;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw new Error('Failed to send bulk notifications');
  }
};

// Real-time subscription for user notifications
export const subscribeToUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledFor: convertTimestamp(data.scheduledFor),
        sentAt: convertTimestamp(data.sentAt),
        readAt: convertTimestamp(data.readAt),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Notification;
    });
    
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

// Helper function to process template variables
export const processTemplate = (template: string, variables: Record<string, string>): string => {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processed = processed.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return processed;
};

// Get notification statistics
export const getNotificationStats = async (userId?: string) => {
  try {
    // This is a simplified version - in production you'd want to use aggregation
    let q = query(collection(db, 'notifications'));
    
    if (userId) {
      q = query(collection(db, 'notifications'), where('userId', '==', userId));
    }
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      read: notifications.filter(n => n.status === 'read').length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };
    
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new Error('Failed to get notification statistics');
  }
};