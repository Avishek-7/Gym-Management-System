import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Check, DollarSign, AlertCircle, Calendar, Gift } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, subscribeToUserNotifications } from '../../services/notification/notificationService';
import type { Notification } from '../../types/notification';

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserNotifications(userId, 50);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Initial load
    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserNotifications(userId, (updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' as const, readAt: new Date() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: Notification['type'], priority: Notification['priority']) => {
    const sizeClass = "w-5 h-5";
    
    switch (type) {
      case 'payment_due':
      case 'payment_overdue':
        return <DollarSign className={`${sizeClass} ${priority === 'urgent' ? 'text-red-400' : 'text-yellow-400'}`} />;
      case 'membership_expiry':
        return <Calendar className={`${sizeClass} text-purple-400`} />;
      case 'class_reminder':
        return <AlertCircle className={`${sizeClass} text-blue-400`} />;
      case 'promotion':
        return <Gift className={`${sizeClass} text-green-400`} />;
      default:
        return <Bell className={`${sizeClass} text-gray-400`} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-500/10';
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-l-4 border-l-blue-500 bg-blue-500/10';
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-500/10';
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => n.status !== 'read')
    : notifications;

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-gray-300">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg backdrop-blur-md transition-all hover:bg-gray-800/50 ${
                getPriorityColor(notification.priority)
              } ${notification.status === 'read' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type, notification.priority)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-semibold text-lg">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notification.status !== 'read' && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-gray-400 text-xs whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mt-2 text-sm leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      notification.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      notification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      notification.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {notification.priority.toUpperCase()}
                    </span>
                    {notification.relatedEntityType && (
                      <span className="text-gray-400">
                        Related to: {notification.relatedEntityType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-800/30 rounded-lg">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
