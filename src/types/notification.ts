// Notification System Types

export interface Notification {
  id: string;
  userId: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder' | 'general' | 'promotion';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  channels: NotificationChannel[];
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  relatedEntityId?: string; // billId, subscriptionId, classId, etc.
  relatedEntityType?: 'bill' | 'subscription' | 'class' | 'membership';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationRequest {
  userId: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder' | 'general' | 'promotion';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  scheduledFor?: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'bill' | 'subscription' | 'class' | 'membership';
  metadata?: Record<string, unknown>;
}

// Notification Templates
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder' | 'general' | 'promotion';
  title: string;
  messageTemplate: string; // Template with placeholders like {{userName}}, {{amount}}
  defaultChannels: ('email' | 'sms' | 'push' | 'in_app')[];
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  variables: string[]; // List of available variables for the template
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateRequest {
  name: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder' | 'general' | 'promotion';
  title: string;
  messageTemplate: string;
  defaultChannels: ('email' | 'sms' | 'push' | 'in_app')[];
  defaultPriority?: 'low' | 'medium' | 'high' | 'urgent';
  variables: string[];
}

// Notification Preferences
export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  paymentReminders: boolean;
  membershipReminders: boolean;
  classReminders: boolean;
  promotionalMessages: boolean;
  generalAnnouncements: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePreferencesRequest {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  paymentReminders?: boolean;
  membershipReminders?: boolean;
  classReminders?: boolean;
  promotionalMessages?: boolean;
  generalAnnouncements?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

// Scheduled Notifications
export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder';
  scheduledFor: Date;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringInterval?: number; // e.g., every 2 weeks
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  lastSent?: Date;
  nextSend?: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'bill' | 'subscription' | 'class' | 'membership';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledNotificationRequest {
  userId: string;
  templateId: string;
  type: 'payment_due' | 'payment_overdue' | 'membership_expiry' | 'class_reminder';
  scheduledFor: Date;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringInterval?: number;
  relatedEntityId?: string;
  relatedEntityType?: 'bill' | 'subscription' | 'class' | 'membership';
}