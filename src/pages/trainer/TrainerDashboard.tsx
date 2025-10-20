import React from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import MyClasses from '../../components/trainer/MyClasses';
import ClassSchedule from '../../components/trainer/ClassSchedule';
import Attendance from '../../components/trainer/Attendance';
import MemberProgress from '../../components/trainer/MemberProgress';
import TrainerNotifications from '../../components/trainer/TrainerNotifications';
import TrainerProfile from '../../components/trainer/TrainerProfile';

const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0">
          <Background hueShift={90} speed={0.35} warpAmount={0.4} />
        </div>
        <div className="relative z-10">
          <Layout title="Trainer Dashboard">
            <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
              <CardContent className="py-12">
                <p className="text-gray-200 text-center">Please log in to access your trainer dashboard</p>
              </CardContent>
            </Card>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Background 
          hueShift={90}
          speed={0.35}
          warpAmount={0.4}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Layout
          title="Trainer Dashboard"
          subtitle={`Welcome, ${user.displayName || 'Trainer'}!`}
          headerActions={<LogoutButton />}
        >
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gray-900/70 bg-gradient-to-r from-green-500/20 to-blue-500/10 border-green-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  Welcome to Your Trainer Portal
                </CardTitle>
                <p className="text-gray-300 mt-2">
                  Manage your classes, track member attendance, and help members achieve their fitness goals.
                </p>
              </CardHeader>
            </Card>

            {/* My Classes Section */}
            <MyClasses trainerId={user.uid} trainerName={user.displayName || 'Trainer'} />

            {/* Class Schedule Section */}
            <ClassSchedule trainerId={user.uid} />

            {/* Member Attendance Section */}
            <Attendance trainerId={user.uid} />

            {/* Member Progress Section */}
            <MemberProgress trainerId={user.uid} />

            {/* Notifications Section */}
            <TrainerNotifications trainerId={user.uid} trainerName={user.displayName || 'Trainer'} />

            {/* My Profile Section */}
            <TrainerProfile trainerId={user.uid} />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default TrainerDashboard;
