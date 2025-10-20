import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Users, Calendar, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  getTrainerUpcomingSessions,
  getSessionAttendance,
  bulkMarkAttendance,
  updateSessionStatus,
} from '../../services/fitness/classService';
import { getMemberById } from '../../services/member/memberService';
import type { ClassSession } from '../../types/class';

interface AttendanceProps {
  trainerId: string;
}

interface SessionWithDetails extends ClassSession {
  className: string;
}

interface MemberAttendance {
  memberId: string;
  memberName: string;
  status: 'present' | 'absent' | 'late';
  notes: string;
}

const Attendance: React.FC<AttendanceProps> = ({ trainerId }) => {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
  const [attendance, setAttendance] = useState<MemberAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load upcoming sessions
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const sessionsData = await getTrainerUpcomingSessions(trainerId);
      
      // Filter only today's and upcoming sessions
      const now = new Date();
      const relevantSessions = sessionsData.filter(session => {
        const sessionDate = session.date instanceof Date ? session.date : new Date(session.date);
        return sessionDate >= now || isSameDay(sessionDate, now);
      });

      setSessions(relevantSessions as SessionWithDetails[]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Load attendance for selected session
  const loadAttendance = useCallback(async (session: SessionWithDetails) => {
    try {
      setLoading(true);
      
      // Get existing attendance records
      const existingRecords = await getSessionAttendance(session.id);

      // Create attendance list from session attendees
      const attendeeIds = session.attendees || [];
      const attendanceList: MemberAttendance[] = [];

      for (const memberId of attendeeIds) {
        // Check if attendance already marked
        const existingRecord = existingRecords.find(r => r.memberId === memberId);
        
        // Get member details
        let memberName = 'Unknown Member';
        try {
          const member = await getMemberById(memberId);
          memberName = member ? `${member.firstName} ${member.lastName}` : memberName;
        } catch (error) {
          console.error('Error fetching member:', error);
        }

        attendanceList.push({
          memberId,
          memberName,
          status: existingRecord?.status || 'absent',
          notes: existingRecord?.notes || '',
        });
      }

      setAttendance(attendanceList);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance(selectedSession);
    }
  }, [selectedSession, loadAttendance]);

  // Handle session selection
  const handleSessionSelect = (session: SessionWithDetails) => {
    setSelectedSession(session);
  };

  // Toggle attendance status
  const toggleAttendance = (memberId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev =>
      prev.map(a =>
        a.memberId === memberId ? { ...a, status } : a
      )
    );
  };

  // Mark all as present
  const markAllPresent = () => {
    setAttendance(prev =>
      prev.map(a => ({ ...a, status: 'present' as const }))
    );
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!selectedSession) return;

    try {
      setSaving(true);

      // Prepare attendance data
      const attendanceData = attendance.map(a => ({
        sessionId: selectedSession.id,
        memberId: a.memberId,
        memberName: a.memberName,
        status: a.status,
        checkedInAt: a.status === 'present' || a.status === 'late' ? new Date() : undefined,
        notes: a.notes,
      }));

      // Save bulk attendance
      await bulkMarkAttendance(selectedSession.id, attendanceData);

      // Update session status if needed
      if (selectedSession.status === 'scheduled') {
        await updateSessionStatus(selectedSession.id, 'in-progress');
      }

      alert('Attendance saved successfully!');
      
      // Reload sessions
      await loadSessions();
      
      // Reload attendance for current session
      if (selectedSession) {
        const updatedSession = sessions.find(s => s.id === selectedSession.id);
        if (updatedSession) {
          await loadAttendance(updatedSession);
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'late':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'absent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading && !selectedSession) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Member Attendance
        </CardTitle>
        <CardDescription className="text-gray-400">
          Mark attendance for your class sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedSession ? (
          // Session Selection View
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Select a Session</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No upcoming sessions available</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionSelect(session)}
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-600/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">
                            {formatDate(session.date instanceof Date ? session.date : new Date(session.date))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300 text-sm">
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-300 text-sm">
                            {session.attendees?.length || 0} / {session.maxCapacity} members
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs border ${getStatusColor(session.status)}`}>
                        {session.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Attendance Marking View
          <div className="space-y-4">
            {/* Session Info Header */}
            <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  {formatDate(selectedSession.date instanceof Date ? selectedSession.date : new Date(selectedSession.date))}
                </h3>
                <Button
                  onClick={() => setSelectedSession(null)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700/50 border-gray-600 hover:bg-gray-600"
                >
                  Back to Sessions
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedSession.startTime} - {selectedSession.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {attendance.length} members
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={markAllPresent}
                variant="outline"
                size="sm"
                className="bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>

            {/* Attendance List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No members enrolled in this session</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendance.map((member) => (
                  <div
                    key={member.memberId}
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-white font-medium">{member.memberName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAttendance(member.memberId, 'present')}
                          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                            member.status === 'present'
                              ? 'bg-green-500/30 border-green-500 text-green-400'
                              : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </button>
                        <button
                          onClick={() => toggleAttendance(member.memberId, 'late')}
                          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                            member.status === 'late'
                              ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400'
                              : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          Late
                        </button>
                        <button
                          onClick={() => toggleAttendance(member.memberId, 'absent')}
                          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                            member.status === 'absent'
                              ? 'bg-red-500/30 border-red-500 text-red-400'
                              : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Absent
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {attendance.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    {attendance.filter(a => a.status === 'present').length}
                  </div>
                  <div className="text-xs text-gray-400">Present</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-3 text-center border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendance.filter(a => a.status === 'late').length}
                  </div>
                  <div className="text-xs text-gray-400">Late</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">
                    {attendance.filter(a => a.status === 'absent').length}
                  </div>
                  <div className="text-xs text-gray-400">Absent</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Attendance;
