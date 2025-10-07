import React from 'react';
import Layout from '../../components/common/Layout';
import Dashboard from '../../components/member/Dashboard';
import { BillHistory } from '../../components/member/BillHistory';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';


const MemberDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout title="Member Dashboard">
        <div className="flex items-center justify-center py-20">
          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md p-8">
            <CardContent>
              <p className="text-gray-200">Please log in to view your dashboard</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Background 
          hueShift={180}
          speed={0.3}
          warpAmount={0.5}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Layout
          title="Member Dashboard"
          subtitle={`Welcome back, ${user.displayName || 'Member'}!`}
          headerActions={<LogoutButton />}
        >
          {/* Welcome Banner */}
          <Card className="bg-gray-900/70 bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-blue-500/30 mb-6 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            Welcome to your Gym Portal
          </CardTitle>
          <p className="text-gray-300 mt-2">
            Manage your membership, view billing history, and stay updated with your fitness journey.
          </p>
        </CardHeader>
      </Card>

      {/* Dashboard Component */}
      <Dashboard 
        userId={user.uid} 
        showQuickActions={true}
        showStats={true}
        limit={3}
      />

      {/* Full Bill History Section */}
      <div className="mt-8">
        <BillHistory 
          memberId={user.uid} 
          autoLoad={true}
        />
      </div>

          {/* Additional sections can be added here */}
          {/* Example: Upcoming classes, workout history, etc. */}
        </Layout>
      </div>
    </div>
  );
};

export default MemberDashboard;