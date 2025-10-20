import { createNotification } from './notificationService';
import type { CreateNotificationRequest } from '../../types/notification';
import type { Bill } from '../../types/billing';

/**
 * Create notification for a new bill
 * Sends immediate notification and schedules reminders
 */
export const createBillNotification = async (
  bill: Bill,
  userName: string
): Promise<void> => {
  try {
    // Create immediate notification for new bill
    const notification: CreateNotificationRequest = {
      userId: bill.userId,
      type: 'payment_due',
      title: 'New Bill Created',
      message: `Hi ${userName}, a new bill of $${bill.totalAmount.toFixed(2)} has been created. Due date: ${new Date(bill.dueDate).toLocaleDateString()}. Bill number: ${bill.billNumber}`,
      priority: 'medium',
      channels: ['in_app', 'email'],
      relatedEntityId: bill.id,
      relatedEntityType: 'bill',
      metadata: {
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        dueDate: bill.dueDate,
      }
    };

    await createNotification(notification);
  } catch (error) {
    console.error('Error creating bill notification:', error);
    // Don't throw - notification failure shouldn't break bill creation
  }
};

/**
 * Create payment due reminder notification
 * Called when a bill is approaching its due date
 */
export const createPaymentDueReminder = async (
  bill: Bill,
  userName: string,
  daysUntilDue: number
): Promise<void> => {
  try {
    const urgency = daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'high' : 'medium';
    const channels: ('email' | 'sms' | 'push' | 'in_app')[] = 
      daysUntilDue <= 1 ? ['in_app', 'email', 'sms'] : ['in_app', 'email'];

    const notification: CreateNotificationRequest = {
      userId: bill.userId,
      type: 'payment_due',
      title: daysUntilDue === 0 ? 'Payment Due Today' : `Payment Due in ${daysUntilDue} Day${daysUntilDue > 1 ? 's' : ''}`,
      message: `Hi ${userName}, your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber} is due ${daysUntilDue === 0 ? 'today' : `on ${new Date(bill.dueDate).toLocaleDateString()}`}. Please make your payment to avoid any service interruption.`,
      priority: urgency,
      channels: channels,
      relatedEntityId: bill.id,
      relatedEntityType: 'bill',
      metadata: {
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        dueDate: bill.dueDate,
        daysUntilDue: daysUntilDue
      }
    };

    await createNotification(notification);
  } catch (error) {
    console.error('Error creating payment due reminder:', error);
  }
};

/**
 * Create payment overdue notification
 * Called when a bill has passed its due date
 */
export const createPaymentOverdueNotification = async (
  bill: Bill,
  userName: string,
  daysOverdue: number
): Promise<void> => {
  try {
    const notification: CreateNotificationRequest = {
      userId: bill.userId,
      type: 'payment_overdue',
      title: daysOverdue === 1 ? 'Payment Overdue' : 'Final Payment Notice',
      message: `Hi ${userName}, your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber} is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please make your payment immediately to avoid service suspension.`,
      priority: 'urgent',
      channels: ['in_app', 'email', 'sms'],
      relatedEntityId: bill.id,
      relatedEntityType: 'bill',
      metadata: {
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        dueDate: bill.dueDate,
        daysOverdue: daysOverdue
      }
    };

    await createNotification(notification);
  } catch (error) {
    console.error('Error creating payment overdue notification:', error);
  }
};

/**
 * Create payment confirmation notification
 * Called when a bill is marked as paid
 */
export const createPaymentConfirmationNotification = async (
  bill: Bill,
  userName: string
): Promise<void> => {
  try {
    const notification: CreateNotificationRequest = {
      userId: bill.userId,
      type: 'general',
      title: 'Payment Received',
      message: `Hi ${userName}, we have received your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber}. Thank you!`,
      priority: 'low',
      channels: ['in_app', 'email'],
      relatedEntityId: bill.id,
      relatedEntityType: 'bill',
      metadata: {
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        paidAt: bill.paidAt
      }
    };

    await createNotification(notification);
  } catch (error) {
    console.error('Error creating payment confirmation notification:', error);
  }
};

/**
 * Schedule automatic payment reminders for a bill
 * Creates reminders for 3 days before, 1 day before, and on due date
 */
export const schedulePaymentReminders = async (
  bill: Bill,
  userName: string
): Promise<void> => {
  try {
    const dueDate = new Date(bill.dueDate);
    const now = new Date();

    // Calculate reminder dates
    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);

    // Schedule 3 days before reminder (if due date is more than 3 days away)
    if (threeDaysBefore > now) {
      const notification: CreateNotificationRequest = {
        userId: bill.userId,
        type: 'payment_due',
        title: 'Payment Due in 3 Days',
        message: `Hi ${userName}, your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber} is due on ${dueDate.toLocaleDateString()}. Please make your payment to avoid any service interruption.`,
        priority: 'medium',
        channels: ['in_app', 'email'],
        scheduledFor: threeDaysBefore,
        relatedEntityId: bill.id,
        relatedEntityType: 'bill',
        metadata: {
          billNumber: bill.billNumber,
          amount: bill.totalAmount,
          dueDate: bill.dueDate
        }
      };
      await createNotification(notification);
    }

    // Schedule 1 day before reminder (if due date is more than 1 day away)
    if (oneDayBefore > now) {
      const notification: CreateNotificationRequest = {
        userId: bill.userId,
        type: 'payment_due',
        title: 'Payment Due Tomorrow',
        message: `Hi ${userName}, your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber} is due tomorrow. Please make your payment today to avoid late fees.`,
        priority: 'high',
        channels: ['in_app', 'email'],
        scheduledFor: oneDayBefore,
        relatedEntityId: bill.id,
        relatedEntityType: 'bill',
        metadata: {
          billNumber: bill.billNumber,
          amount: bill.totalAmount,
          dueDate: bill.dueDate
        }
      };
      await createNotification(notification);
    }

    // Schedule due date reminder (if due date is in the future)
    if (dueDate > now) {
      const notification: CreateNotificationRequest = {
        userId: bill.userId,
        type: 'payment_due',
        title: 'Payment Due Today',
        message: `Hi ${userName}, your payment of $${bill.totalAmount.toFixed(2)} for ${bill.billNumber} is due today. Please make your payment to avoid service interruption.`,
        priority: 'urgent',
        channels: ['in_app', 'email', 'sms'],
        scheduledFor: dueDate,
        relatedEntityId: bill.id,
        relatedEntityType: 'bill',
        metadata: {
          billNumber: bill.billNumber,
          amount: bill.totalAmount,
          dueDate: bill.dueDate
        }
      };
      await createNotification(notification);
    }
  } catch (error) {
    console.error('Error scheduling payment reminders:', error);
  }
};
