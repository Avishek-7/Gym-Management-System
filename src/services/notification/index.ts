// Notification System Exports

// Types
export type {
  Notification,
  NotificationChannel,
  CreateNotificationRequest,
  NotificationTemplate,
  CreateTemplateRequest,
  NotificationPreference,
  UpdatePreferencesRequest,
  ScheduledNotification,
  CreateScheduledNotificationRequest
} from '../../types/notification';

// Services
export {
  // Core notification operations
  createNotification,
  getNotification,
  getUserNotifications,
  markNotificationAsRead,
  updateNotificationStatus,
  deleteNotification,
  
  // Template operations
  createTemplate,
  getTemplate,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,
  
  // Preference operations
  getUserPreferences,
  createDefaultPreferences,
  updateUserPreferences,
  
  // Scheduled notification operations
  createScheduledNotification,
  getScheduledNotifications,
  updateScheduledNotification,
  cancelScheduledNotification,
  
  // Business logic functions
  sendPaymentDueNotifications,
  sendMembershipExpiryNotifications,
  sendBulkNotifications,
  subscribeToUserNotifications,
  processTemplate,
  getNotificationStats
} from './notificationService';

// Scheduler
export { NotificationScheduler } from './notificationScheduler';

// Templates
export { 
  defaultNotificationTemplates,
  createDefaultTemplates 
} from './notificationTemplates';

// Hooks
export {
  useNotifications,
  useNotificationPreferences,
  useNotificationStats,
  useNotificationScheduler
} from '../../hooks/useNotifications';