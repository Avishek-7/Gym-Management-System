import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Award, Calendar, User, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getTrainerClasses, getClassSessions } from '../../services/fitness/classService';
import { getMembers } from '../../services/member/memberService';
import type { Member } from '../../types/member';

interface MemberProgressProps {
  trainerId: string;
}

interface MemberProgressData {
  member: Member;
  totalClasses: number;
  attendanceRate: number;
  lastAttended?: Date;
  achievements: string[];
}

const MemberProgress: React.FC<MemberProgressProps> = ({ trainerId }) => {
  const [progressData, setProgressData] = useState<MemberProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberProgressData | null>(null);

  // Load members and their progress
  const loadMemberProgress = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all members
      const allMembers = await getMembers();

      // Get trainer's classes
      const trainerClasses = await getTrainerClasses(trainerId);
      
      // Calculate progress for each member
      const progressList: MemberProgressData[] = [];

      for (const member of allMembers) {
        let totalClasses = 0;
        let attendedClasses = 0;
        let lastAttended: Date | undefined;

        // Check each class for this member's attendance
        for (const classItem of trainerClasses) {
          const sessions = await getClassSessions(classItem.id);
          
          for (const session of sessions) {
            if (session.attendees?.includes(member.id)) {
              totalClasses++;
              
              // Check if member actually attended (would need attendance records for accuracy)
              if (session.status === 'completed') {
                attendedClasses++;
                
                const sessionDate = session.date instanceof Date ? session.date : new Date(session.date);
                if (!lastAttended || sessionDate > lastAttended) {
                  lastAttended = sessionDate;
                }
              }
            }
          }
        }

        const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
        
        // Calculate achievements
        const achievements: string[] = [];
        if (attendanceRate === 100) achievements.push('Perfect Attendance');
        if (attendanceRate >= 90) achievements.push('High Achiever');
        if (totalClasses >= 50) achievements.push('Dedicated Member');
        if (totalClasses >= 100) achievements.push('Century Club');
        
        progressList.push({
          member,
          totalClasses,
          attendanceRate,
          lastAttended,
          achievements,
        });
      }

      // Sort by attendance rate
      progressList.sort((a, b) => b.attendanceRate - a.attendanceRate);
      setProgressData(progressList);
    } catch (error) {
      console.error('Error loading member progress:', error);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    loadMemberProgress();
  }, [loadMemberProgress]);

  // Get attendance badge color
  const getAttendanceBadgeColor = (rate: number): string => {
    if (rate >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (rate >= 70) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (rate >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
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
        <CardTitle className="text-green-400 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Member Progress
        </CardTitle>
        <CardDescription className="text-gray-400">
          Track member attendance and achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedMember ? (
          // Member List View
          <div className="space-y-4">
            {progressData.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No member progress data available</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {progressData.map((data) => (
                  <div
                    key={data.member.id}
                    onClick={() => setSelectedMember(data)}
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-600/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {data.member.firstName.charAt(0)}{data.member.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {data.member.firstName} {data.member.lastName}
                          </h3>
                          <p className="text-gray-400 text-sm">{data.member.email}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-sm border ${getAttendanceBadgeColor(data.attendanceRate)}`}>
                        {data.attendanceRate.toFixed(0)}% Attendance
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-400">{data.totalClasses}</div>
                        <div className="text-xs text-gray-400">Classes</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-400">{data.achievements.length}</div>
                        <div className="text-xs text-gray-400">Badges</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-purple-400">
                          {data.lastAttended ? new Date(data.lastAttended).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Last Visit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Member Detail View
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => setSelectedMember(null)}
              className="text-green-400 hover:text-green-300 text-sm mb-4"
            >
              ← Back to Members
            </button>

            {/* Member Header */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedMember.member.firstName.charAt(0)}{selectedMember.member.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedMember.member.firstName} {selectedMember.member.lastName}
                  </h2>
                  <p className="text-gray-300">{selectedMember.member.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <Activity className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{selectedMember.totalClasses}</div>
                  <div className="text-xs text-gray-400">Total Classes</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{selectedMember.attendanceRate.toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">Attendance Rate</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <Award className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{selectedMember.achievements.length}</div>
                  <div className="text-xs text-gray-400">Achievements</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">
                    {selectedMember.lastAttended 
                      ? new Date(selectedMember.lastAttended).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Last Attended</div>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Achievements
              </h3>
              {selectedMember.achievements.length === 0 ? (
                <p className="text-gray-400 text-sm">No achievements yet. Keep attending classes!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMember.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3"
                    >
                      <Award className="w-6 h-6 text-yellow-400" />
                      <span className="text-white font-medium">{achievement}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Info */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />
                Member Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white ml-2">{selectedMember.member.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedMember.member.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedMember.member.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Join Date:</span>
                  <span className="text-white ml-2">
                    {new Date(selectedMember.member.joinDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Membership ID:</span>
                  <span className="text-white ml-2">{selectedMember.member.membershipId}</span>
                </div>
              </div>
            </div>

            {/* Progress Chart Placeholder */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Progress Overview
              </h3>
              <div className="h-48 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p>Progress chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberProgress;
