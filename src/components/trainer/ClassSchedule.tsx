import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getTrainerUpcomingSessions, getTrainerClasses } from '../../services/fitness/classService';
import type { ClassSession, TrainerClass } from '../../types/class';

interface ClassScheduleProps {
  trainerId: string;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

interface SessionWithClass extends ClassSession {
  className: string;
  classDescription: string;
}

const ClassSchedule: React.FC<ClassScheduleProps> = ({ trainerId }) => {
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [classes, setClasses] = useState<TrainerClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  // Get the start of the week (Sunday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // Generate week days array
  const generateWeekDays = useCallback((startDate: Date): WeekDay[] => {
    const days: WeekDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
      });
    }

    return days;
  }, []);

  // Load classes and sessions
  const loadScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all trainer classes
      const classesData = await getTrainerClasses(trainerId);
      setClasses(classesData);

      // Load upcoming sessions
      const sessionsData = await getTrainerUpcomingSessions(trainerId);
      
      // Enrich sessions with class details
      const enrichedSessions: SessionWithClass[] = sessionsData.map(session => {
        const classData = classesData.find(c => c.id === session.classId);
        return {
          ...session,
          className: classData?.name || 'Unknown Class',
          classDescription: classData?.description || '',
        };
      });

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  useEffect(() => {
    setWeekDays(generateWeekDays(currentWeekStart));
  }, [currentWeekStart, generateWeekDays]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Go to current week
  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Get sessions for a specific day
  const getSessionsForDay = (date: Date): SessionWithClass[] => {
    return sessions.filter(session => {
      const sessionDate = session.date instanceof Date ? session.date : new Date(session.date);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    }).sort((a, b) => {
      // Sort by start time
      return a.startTime.localeCompare(b.startTime);
    });
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Format month and year for header
  const formatMonthYear = (): string => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  };

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Class Schedule
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              {formatMonthYear()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={goToPreviousWeek}
              variant="outline"
              size="sm"
              className="bg-gray-700/50 border-gray-600 hover:bg-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="bg-gray-700/50 border-gray-600 hover:bg-gray-600"
            >
              Today
            </Button>
            <Button
              onClick={goToNextWeek}
              variant="outline"
              size="sm"
              className="bg-gray-700/50 border-gray-600 hover:bg-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <div key={index} className="min-h-[200px]">
              {/* Day Header */}
              <div
                className={`p-2 text-center rounded-t-lg border-b ${
                  day.isToday
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-gray-700/30 border-gray-600 text-gray-400'
                }`}
              >
                <div className="text-xs font-medium">{day.dayName}</div>
                <div className="text-lg font-bold">{day.dayNumber}</div>
              </div>

              {/* Day Sessions */}
              <div className="bg-gray-700/20 rounded-b-lg p-2 space-y-2 min-h-[150px]">
                {getSessionsForDay(day.date).map((session) => (
                  <div
                    key={session.id}
                    className="bg-gray-800/70 border border-gray-600 rounded-lg p-2 hover:bg-gray-700/70 transition-colors cursor-pointer"
                  >
                    {/* Session Time */}
                    <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>

                    {/* Class Name */}
                    <div className="text-sm font-medium text-white truncate mb-1">
                      {session.className}
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {session.attendees?.length || 0}/{session.maxCapacity}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`inline-block px-2 py-0.5 rounded text-xs border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {getSessionsForDay(day.date).length === 0 && (
                  <div className="text-center text-gray-500 text-xs mt-4">
                    No classes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/30"></div>
            <span className="text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
            <span className="text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500/20 border border-gray-500/30"></div>
            <span className="text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
            <span className="text-gray-400">Cancelled</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{classes.length}</div>
            <div className="text-xs text-gray-400">Total Classes</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {sessions.filter(s => s.status === 'scheduled').length}
            </div>
            <div className="text-xs text-gray-400">Upcoming Sessions</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {sessions.reduce((sum, s) => sum + (s.attendees?.length || 0), 0)}
            </div>
            <div className="text-xs text-gray-400">Total Attendees</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassSchedule;
