import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { subscribeToUserNotifications } from '../../services/notification/notificationService';

interface NotificationBellProps {
  userId: string;
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToUserNotifications(userId, (notifications) => {
      setUnreadCount(notifications.filter(n => n.status !== 'read').length);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userId]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-blue-500/10 transition-colors focus:outline-none"
      aria-label="View notifications"
    >
      <Bell className="w-7 h-7 text-blue-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.2em] text-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
