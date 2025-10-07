import React from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';

const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();

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
          subtitle={`Welcome, ${user?.displayName || 'Trainer'}!`}
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

        {/* Coming Soon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                View and manage your scheduled classes
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Member Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Track and mark member attendance for your classes
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                View your weekly class schedule
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Member Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Track member progress and achievements
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Send notifications to your members
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Update your trainer profile and availability
              </p>
              <p className="text-blue-400 mt-4 text-sm font-medium">Coming Soon</p>
            </CardContent>
          </Card>
          </div>
        </div>
      </Layout>
    </div>
  </div>
  );
};

export default TrainerDashboard;
