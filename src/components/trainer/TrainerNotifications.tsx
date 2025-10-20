import React, { useState, useCallback, useEffect } from 'react';
import { Bell, Send, Users, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getTrainerClasses, getTrainerUpcomingSessions } from '../../services/fitness/classService';
import { getMembers } from '../../services/member/memberService';
import { createNotification } from '../../services/notification/notificationService';
import type { Member } from '../../types/member';

interface TrainerNotificationsProps {
  trainerId: string;
  trainerName: string;
}

const TrainerNotifications: React.FC<TrainerNotificationsProps> = ({ trainerId, trainerName }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [notificationType, setNotificationType] = useState<'all' | 'class' | 'individual'>('all');
  const [sending, setSending] = useState(false);
  const [classCount, setClassCount] = useState(0);
  const [upcomingSessionCount, setUpcomingSessionCount] = useState(0);

  // Load members and stats
  const loadData = useCallback(async () => {
    try {
      const allMembers = await getMembers();
      setMembers(allMembers);

      const classes = await getTrainerClasses(trainerId);
      setClassCount(classes.length);

      const sessions = await getTrainerUpcomingSessions(trainerId);
      setUpcomingSessionCount(sessions.length);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [trainerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Select all members
  const selectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  // Deselect all members
  const deselectAllMembers = () => {
    setSelectedMembers([]);
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and message');
      return;
    }

    const recipientIds = notificationType === 'all' 
      ? members.map(m => m.id)
      : selectedMembers;

    if (recipientIds.length === 0) {
      alert('Please select at least one member');
      return;
    }

    try {
      setSending(true);

      // Send notification to each selected member
      for (const memberId of recipientIds) {
        await createNotification({
          userId: memberId,
          type: 'class_reminder',
          title: title,
          message: message,
          priority: 'medium',
          channels: ['in_app'],
          metadata: {
            trainerId: trainerId,
            trainerName: trainerName,
          },
        });
      }

      alert(`Notification sent to ${recipientIds.length} member(s)!`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedMembers([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Quick message templates
  const quickMessages = [
    {
      title: 'Class Reminder',
      message: 'Hi! This is a reminder about your upcoming class. Looking forward to seeing you there!',
    },
    {
      title: 'Class Cancelled',
      message: 'Unfortunately, today\'s class has been cancelled. We apologize for any inconvenience.',
    },
    {
      title: 'Great Progress!',
      message: 'Keep up the excellent work! Your dedication and progress have been outstanding.',
    },
    {
      title: 'Schedule Change',
      message: 'Please note there has been a change to the class schedule. Check the schedule for details.',
    },
  ];

  const applyTemplate = (template: { title: string; message: string }) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Send Notifications
        </CardTitle>
        <CardDescription className="text-gray-400">
          Communicate with your class members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{members.length}</div>
            <div className="text-xs text-gray-400">Total Members</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <MessageSquare className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{classCount}</div>
            <div className="text-xs text-gray-400">Active Classes</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{upcomingSessionCount}</div>
            <div className="text-xs text-gray-400">Upcoming Sessions</div>
          </div>
        </div>

        {/* Notification Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Send To</label>
          <div className="flex gap-2">
            <button
              onClick={() => setNotificationType('all')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                notificationType === 'all'
                  ? 'bg-green-500/30 border-green-500 text-green-400'
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              All Members
            </button>
            <button
              onClick={() => setNotificationType('individual')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                notificationType === 'individual'
                  ? 'bg-green-500/30 border-green-500 text-green-400'
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              Select Members
            </button>
          </div>
        </div>

        {/* Member Selection (if individual) */}
        {notificationType === 'individual' && (
          <div className="mb-4 bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">
                Select Members ({selectedMembers.length} selected)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllMembers}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllMembers}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {members.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-2 bg-gray-800/50 rounded hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-white text-sm">
                    {member.firstName} {member.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Quick Templates</label>
          <div className="grid grid-cols-2 gap-2">
            {quickMessages.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-600/50 transition-colors text-left"
              >
                {template.title}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Enter your message"
              rows={5}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : `Send to ${notificationType === 'all' ? 'All Members' : `${selectedMembers.length} Member(s)`}`}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            💡 Members will receive notifications in their dashboard notification center
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainerNotifications;
