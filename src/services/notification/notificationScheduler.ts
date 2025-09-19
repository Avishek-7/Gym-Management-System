import { 
  createNotification, 
  getUserPreferences,
  createDefaultPreferences,
  getTemplate,
  processTemplate,
  getScheduledNotifications,
  updateScheduledNotification
} from './notificationService';
import type { 
  CreateNotificationRequest,
  NotificationPreference
} from '../../types/notification';

// Notification scheduler for automated notifications
export class NotificationScheduler {
  
  // Schedule payment due notifications
  static async schedulePaymentReminders(
    userId: string, 
    billId: string, 
    amount: number, 
    dueDate: Date,
    serviceName: string
  ): Promise<void> {
    try {
      const preferences = await getUserPreferences(userId);
      if (!preferences?.paymentReminders) return;

      const userName = 'Member'; // In real app, get from user profile
      
      // Schedule 3 days before
      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
      
      if (threeDaysBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'payment_due',
          title: 'Payment Due Reminder',
          message: `Hi ${userName}, your payment of $${amount} for ${serviceName} is due on ${dueDate.toLocaleDateString()}.`,
          priority: 'medium',
          channels: this.getEnabledChannels(preferences),
          scheduledFor: threeDaysBefore,
          relatedEntityId: billId,
          relatedEntityType: 'bill'
        });
      }

      // Schedule 1 day before
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      if (oneDayBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'payment_due',
          title: 'Payment Due Tomorrow',
          message: `Hi ${userName}, your payment of $${amount} for ${serviceName} is due tomorrow.`,
          priority: 'high',
          channels: this.getEnabledChannels(preferences),
          scheduledFor: oneDayBefore,
          relatedEntityId: billId,
          relatedEntityType: 'bill'
        });
      }

      // Schedule overdue notification for 1 day after
      const oneDayAfter = new Date(dueDate);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);
      
      await this.scheduleNotification({
        userId,
        type: 'payment_overdue',
        title: 'Payment Overdue',
        message: `Hi ${userName}, your payment of $${amount} for ${serviceName} is now overdue.`,
        priority: 'urgent',
        channels: this.getEnabledChannels(preferences),
        scheduledFor: oneDayAfter,
        relatedEntityId: billId,
        relatedEntityType: 'bill'
      });

    } catch (error) {
      console.error('Error scheduling payment reminders:', error);
      throw new Error('Failed to schedule payment reminders');
    }
  }

  // Schedule membership expiry notifications
  static async scheduleMembershipReminders(
    userId: string,
    membershipId: string,
    membershipType: string,
    expiryDate: Date
  ): Promise<void> {
    try {
      const preferences = await getUserPreferences(userId);
      if (!preferences?.membershipReminders) return;

      const userName = 'Member'; // In real app, get from user profile
      
      // Schedule 7 days before
      const sevenDaysBefore = new Date(expiryDate);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      
      if (sevenDaysBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'membership_expiry',
          title: 'Membership Expiring Soon',
          message: `Hi ${userName}, your ${membershipType} membership will expire on ${expiryDate.toLocaleDateString()}.`,
          priority: 'medium',
          channels: this.getEnabledChannels(preferences),
          scheduledFor: sevenDaysBefore,
          relatedEntityId: membershipId,
          relatedEntityType: 'membership'
        });
      }

      // Schedule 3 days before
      const threeDaysBefore = new Date(expiryDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
      
      if (threeDaysBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'membership_expiry',
          title: 'Membership Expires in 3 Days',
          message: `Hi ${userName}, your ${membershipType} membership expires in 3 days.`,
          priority: 'high',
          channels: this.getEnabledChannels(preferences),
          scheduledFor: threeDaysBefore,
          relatedEntityId: membershipId,
          relatedEntityType: 'membership'
        });
      }

      // Schedule expiry day notification
      await this.scheduleNotification({
        userId,
        type: 'membership_expiry',
        title: 'Membership Expired',
        message: `Hi ${userName}, your ${membershipType} membership has expired.`,
        priority: 'urgent',
        channels: this.getEnabledChannels(preferences),
        scheduledFor: expiryDate,
        relatedEntityId: membershipId,
        relatedEntityType: 'membership'
      });

    } catch (error) {
      console.error('Error scheduling membership reminders:', error);
      throw new Error('Failed to schedule membership reminders');
    }
  }

  // Schedule class reminders
  static async scheduleClassReminders(
    userId: string,
    classId: string,
    className: string,
    classTime: Date,
    instructorName: string
  ): Promise<void> {
    try {
      const preferences = await getUserPreferences(userId);
      if (!preferences?.classReminders) return;

      const userName = 'Member'; // In real app, get from user profile
      
      // Schedule 2 hours before
      const twoHoursBefore = new Date(classTime);
      twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
      
      if (twoHoursBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'class_reminder',
          title: 'Class Starting Soon',
          message: `Hi ${userName}, your ${className} class with ${instructorName} starts in 2 hours.`,
          priority: 'medium',
          channels: ['push', 'in_app'], // Class reminders typically use push/in-app
          scheduledFor: twoHoursBefore,
          relatedEntityId: classId,
          relatedEntityType: 'class'
        });
      }

      // Schedule 30 minutes before
      const thirtyMinutesBefore = new Date(classTime);
      thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30);
      
      if (thirtyMinutesBefore > new Date()) {
        await this.scheduleNotification({
          userId,
          type: 'class_reminder',
          title: 'Class Starting in 30 Minutes',
          message: `Hi ${userName}, your ${className} class starts in 30 minutes.`,
          priority: 'high',
          channels: ['push', 'in_app'],
          scheduledFor: thirtyMinutesBefore,
          relatedEntityId: classId,
          relatedEntityType: 'class'
        });
      }

    } catch (error) {
      console.error('Error scheduling class reminders:', error);
      throw new Error('Failed to schedule class reminders');
    }
  }

  // Process pending scheduled notifications
  static async processPendingNotifications(): Promise<void> {
    try {
      const now = new Date();
      const scheduledNotifications = await getScheduledNotifications();
      
      const pendingNotifications = scheduledNotifications.filter(
        scheduled => scheduled.nextSend && scheduled.nextSend <= now && scheduled.status === 'active'
      );

      for (const scheduled of pendingNotifications) {
        try {
          // Get template if using one
          const template = await getTemplate(scheduled.templateId);
          
          let title = 'Notification';
          let message = 'You have a new notification';
          
          if (template) {
            title = template.title;
            message = processTemplate(template.messageTemplate, {
              userName: 'Member', // In real app, get from user profile
              // Add other variables as needed
            });
          }

          // Create the notification
          await createNotification({
            userId: scheduled.userId,
            type: scheduled.type,
            title,
            message,
            priority: 'medium',
            channels: ['in_app'], // Default channels
            relatedEntityId: scheduled.relatedEntityId,
            relatedEntityType: scheduled.relatedEntityType
          });

          // Update scheduled notification
          if (scheduled.isRecurring && scheduled.recurringPattern && scheduled.nextSend) {
            // Calculate next send time for recurring notifications
            const nextSend = this.calculateNextSendTime(
              scheduled.nextSend,
              scheduled.recurringPattern,
              scheduled.recurringInterval || 1
            );
            
            await updateScheduledNotification(scheduled.id, {
              lastSent: now,
              nextSend
            });
          } else {
            // Mark as completed for one-time notifications
            await updateScheduledNotification(scheduled.id, {
              status: 'completed',
              lastSent: now
            });
          }
          
        } catch (error) {
          console.error(`Error processing scheduled notification ${scheduled.id}:`, error);
          // Continue processing other notifications
        }
      }
      
    } catch (error) {
      console.error('Error processing pending notifications:', error);
      throw new Error('Failed to process pending notifications');
    }
  }

  // Send immediate notification
  static async sendImmediateNotification(
    userId: string,
    type: CreateNotificationRequest['type'],
    title: string,
    message: string,
    priority: CreateNotificationRequest['priority'] = 'medium',
    relatedEntityId?: string,
    relatedEntityType?: CreateNotificationRequest['relatedEntityType']
  ): Promise<string> {
    try {
      let preferences = await getUserPreferences(userId);
      
      // Create default preferences if none exist
      if (!preferences) {
        await createDefaultPreferences(userId);
        preferences = await getUserPreferences(userId);
      }

      if (!preferences) {
        throw new Error('Failed to get user preferences');
      }

      // Check if user wants this type of notification
      const shouldSend = this.shouldSendNotification(type, preferences);
      if (!shouldSend) return '';

      return await createNotification({
        userId,
        type,
        title,
        message,
        priority,
        channels: this.getEnabledChannels(preferences),
        relatedEntityId,
        relatedEntityType
      });
      
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      throw new Error('Failed to send immediate notification');
    }
  }

  // Helper: Schedule a notification
  private static async scheduleNotification(request: CreateNotificationRequest): Promise<string> {
    // For now, create immediate notification
    // In production, this would create a scheduled notification that gets processed later
    return await createNotification(request);
  }

  // Helper: Get enabled channels based on user preferences
  private static getEnabledChannels(preferences: NotificationPreference): ('email' | 'sms' | 'push' | 'in_app')[] {
    const channels: ('email' | 'sms' | 'push' | 'in_app')[] = [];
    
    if (preferences.emailEnabled) channels.push('email');
    if (preferences.smsEnabled) channels.push('sms');
    if (preferences.pushEnabled) channels.push('push');
    if (preferences.inAppEnabled) channels.push('in_app');
    
    return channels.length > 0 ? channels : ['in_app']; // Always have at least in_app
  }

  // Helper: Check if notification should be sent based on user preferences
  private static shouldSendNotification(
    type: CreateNotificationRequest['type'],
    preferences: NotificationPreference
  ): boolean {
    switch (type) {
      case 'payment_due':
      case 'payment_overdue':
        return preferences.paymentReminders;
      case 'membership_expiry':
        return preferences.membershipReminders;
      case 'class_reminder':
        return preferences.classReminders;
      case 'promotion':
        return preferences.promotionalMessages;
      case 'general':
        return preferences.generalAnnouncements;
      default:
        return true; // Send by default
    }
  }

  // Helper: Calculate next send time for recurring notifications
  private static calculateNextSendTime(
    currentTime: Date,
    pattern: 'daily' | 'weekly' | 'monthly',
    interval: number
  ): Date {
    const nextTime = new Date(currentTime);
    
    switch (pattern) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + interval);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + interval);
        break;
    }
    
    return nextTime;
  }

  // Send welcome notification for new members
  static async sendWelcomeNotification(userId: string, userName: string, gymName: string): Promise<string> {
    return await this.sendImmediateNotification(
      userId,
      'general',
      'Welcome to Our Gym!',
      `Hi ${userName}, welcome to ${gymName}! We're excited to help you achieve your fitness goals.`,
      'medium'
    );
  }

  // Send birthday notification
  static async sendBirthdayNotification(userId: string, userName: string): Promise<string> {
    return await this.sendImmediateNotification(
      userId,
      'general',
      'Happy Birthday!',
      `Happy Birthday ${userName}! 🎉 Enjoy a complimentary guest pass as our birthday gift to you.`,
      'low'
    );
  }

  // Send promotional notification
  static async sendPromotionalNotification(
    userId: string,
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<string> {
    return await this.sendImmediateNotification(
      userId,
      'promotion',
      title,
      message,
      'low',
      relatedEntityId
    );
  }
}