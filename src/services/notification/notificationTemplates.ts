import type { CreateTemplateRequest } from '../../types/notification';

// Default notification templates for gym management system
export const defaultNotificationTemplates: CreateTemplateRequest[] = [
  // Payment Due Templates
  {
    name: 'Payment Due - 3 Days',
    type: 'payment_due',
    title: 'Payment Due Reminder',
    messageTemplate: 'Hi {{userName}}, your payment of ${{amount}} for {{serviceName}} is due on {{dueDate}}. Please make your payment to avoid any service interruption.',
    defaultChannels: ['email', 'in_app'],
    defaultPriority: 'medium',
    variables: ['userName', 'amount', 'serviceName', 'dueDate']
  },
  {
    name: 'Payment Due - 1 Day',
    type: 'payment_due',
    title: 'Payment Due Tomorrow',
    messageTemplate: 'Hi {{userName}}, your payment of ${{amount}} for {{serviceName}} is due tomorrow ({{dueDate}}). Please make your payment today to avoid late fees.',
    defaultChannels: ['email', 'sms', 'in_app'],
    defaultPriority: 'high',
    variables: ['userName', 'amount', 'serviceName', 'dueDate']
  },

  // Payment Overdue Templates
  {
    name: 'Payment Overdue - 1 Day',
    type: 'payment_overdue',
    title: 'Payment Overdue',
    messageTemplate: 'Hi {{userName}}, your payment of ${{amount}} for {{serviceName}} was due on {{dueDate}} and is now overdue. Please make your payment immediately to avoid service suspension.',
    defaultChannels: ['email', 'sms', 'in_app'],
    defaultPriority: 'urgent',
    variables: ['userName', 'amount', 'serviceName', 'dueDate']
  },
  {
    name: 'Payment Overdue - 7 Days',
    type: 'payment_overdue',
    title: 'Final Payment Notice',
    messageTemplate: 'Hi {{userName}}, your payment of ${{amount}} for {{serviceName}} is now {{daysOverdue}} days overdue. Your account will be suspended if payment is not received within 24 hours.',
    defaultChannels: ['email', 'sms', 'in_app'],
    defaultPriority: 'urgent',
    variables: ['userName', 'amount', 'serviceName', 'daysOverdue']
  },

  // Membership Expiry Templates
  {
    name: 'Membership Expiry - 7 Days',
    type: 'membership_expiry',
    title: 'Membership Expiring Soon',
    messageTemplate: 'Hi {{userName}}, your {{membershipType}} membership will expire on {{expiryDate}}. Renew now to continue enjoying our services without interruption.',
    defaultChannels: ['email', 'in_app'],
    defaultPriority: 'medium',
    variables: ['userName', 'membershipType', 'expiryDate']
  },
  {
    name: 'Membership Expiry - 3 Days',
    type: 'membership_expiry',
    title: 'Membership Expires in 3 Days',
    messageTemplate: 'Hi {{userName}}, your {{membershipType}} membership will expire in 3 days on {{expiryDate}}. Renew today to avoid any service interruption.',
    defaultChannels: ['email', 'sms', 'in_app'],
    defaultPriority: 'high',
    variables: ['userName', 'membershipType', 'expiryDate']
  },
  {
    name: 'Membership Expired',
    type: 'membership_expiry',
    title: 'Membership Expired',
    messageTemplate: 'Hi {{userName}}, your {{membershipType}} membership has expired. Please contact us to renew your membership and continue accessing our services.',
    defaultChannels: ['email', 'sms', 'in_app'],
    defaultPriority: 'urgent',
    variables: ['userName', 'membershipType']
  },

  // Class Reminder Templates
  {
    name: 'Class Reminder - 2 Hours',
    type: 'class_reminder',
    title: 'Class Starting Soon',
    messageTemplate: 'Hi {{userName}}, your {{className}} class with {{instructorName}} starts in 2 hours at {{classTime}}. See you there!',
    defaultChannels: ['push', 'in_app'],
    defaultPriority: 'medium',
    variables: ['userName', 'className', 'instructorName', 'classTime']
  },
  {
    name: 'Class Reminder - 30 Minutes',
    type: 'class_reminder',
    title: 'Class Starting in 30 Minutes',
    messageTemplate: 'Hi {{userName}}, your {{className}} class starts in 30 minutes. Don\'t forget to bring your water bottle and towel!',
    defaultChannels: ['push', 'in_app'],
    defaultPriority: 'high',
    variables: ['userName', 'className']
  },

  // General Announcements
  {
    name: 'Welcome New Member',
    type: 'general',
    title: 'Welcome to Our Gym!',
    messageTemplate: 'Hi {{userName}}, welcome to {{gymName}}! We\'re excited to help you achieve your fitness goals. Check out our mobile app for class schedules and more.',
    defaultChannels: ['email', 'in_app'],
    defaultPriority: 'medium',
    variables: ['userName', 'gymName']
  },
  {
    name: 'Birthday Wishes',
    type: 'general',
    title: 'Happy Birthday!',
    messageTemplate: 'Happy Birthday {{userName}}! 🎉 Enjoy a complimentary guest pass as our birthday gift to you. Have a fantastic day!',
    defaultChannels: ['email', 'in_app'],
    defaultPriority: 'low',
    variables: ['userName']
  },

  // Promotional Messages
  {
    name: 'Special Offer',
    type: 'promotion',
    title: 'Special Offer Just for You!',
    messageTemplate: 'Hi {{userName}}, we have a special {{discountPercentage}}% discount on {{offerItem}} valid until {{validUntil}}. Don\'t miss out!',
    defaultChannels: ['email', 'in_app'],
    defaultPriority: 'low',
    variables: ['userName', 'discountPercentage', 'offerItem', 'validUntil']
  },
  {
    name: 'New Class Launch',
    type: 'promotion',
    title: 'New Class Alert!',
    messageTemplate: 'Hi {{userName}}, we\'re launching a new {{className}} class starting {{startDate}}. Book your spot now for early bird pricing!',
    defaultChannels: ['email', 'push', 'in_app'],
    defaultPriority: 'medium',
    variables: ['userName', 'className', 'startDate']
  }
];

// Function to create all default templates
export const createDefaultTemplates = async () => {
  // This would be called during initial setup
  // Implementation would use the createTemplate function from notificationService
  console.log('Creating default notification templates...');
  return defaultNotificationTemplates;
};