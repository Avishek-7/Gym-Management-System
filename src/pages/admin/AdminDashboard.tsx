import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  CreditCard,
  UserPlus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    revenue: 0,
    pendingBills: 0,
  });

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Simulate fetching stats
    setStats({
      totalMembers: 245,
      activeMembers: 19. ,
      revenue: 45680,
      pendingBills: 12,
    });
  }, []);

  // Revenue data for line chart
  const revenueData = [
    { month: 'Jan', revenue: 35000, members: 180 },
    { month: 'Feb', revenue: 38000, members: 195 },
    { month: 'Mar', revenue: 42000, members: 210 },
    { month: 'Apr', revenue: 39000, members: 205 },
    { month: 'May', revenue: 43000, members: 225 },
    { month: 'Jun', revenue: 45680, members: 245 },
  ];

  // Membership type distribution
  const membershipData = [
    { name: 'Basic', value: 95, color: '#3b82f6' },
    { name: 'Premium', value: 85, color: '#8b5cf6' },
    { name: 'VIP', value: 65, color: '#ec4899' },
  ];

  // Payment status data
  const paymentStatusData = [
    { status: 'Paid', count: 233, color: '#10b981' },
    { status: 'Pending', count: 12, color: '#f59e0b' },
    { status: 'Overdue', count: 8, color: '#ef4444' },
  ];

  // Member activity data
  const activityData = [
    { day: 'Mon', checkins: 145 },
    { day: 'Tue', checkins: 168 },
    { day: 'Wed', checkins: 152 },
    { day: 'Thu', checkins: 178 },
    { day: 'Fri', checkins: 190 },
    { day: 'Sat', checkins: 210 },
    { day: 'Sun', checkins: 185 },
  ];

  if (!user) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center py-20">
          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md p-8">
            <CardContent>
              <p className="text-gray-200">Please log in to access the admin dashboard.</p>
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
          hueShift={270}
          speed={0.4}
          warpAmount={0.3}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Layout
          title="Admin Dashboard"
          subtitle="Gym management overview and analytics"
          headerActions={<LogoutButton />}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Members */}
        <Card className="bg-gray-900/70 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Members</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalMembers}</div>
            <p className="text-xs text-blue-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card className="bg-gray-900/70 bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Members</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeMembers}</div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              {((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)}% active rate
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-gray-900/70 bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-purple-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        {/* Pending Bills */}
        <Card className="bg-gray-900/70 bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Pending Bills</CardTitle>
            <CreditCard className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingBills}</div>
            <p className="text-xs text-orange-400 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Growth Chart */}
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Member Growth</CardTitle>
            <CardDescription>Total members over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Membership Distribution Pie Chart */}
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Membership Types</CardTitle>
            <CardDescription>Distribution by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Chart */}
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Payment Status</CardTitle>
            <CardDescription>Current billing status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity Bar Chart */}
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Weekly Check-ins</CardTitle>
            <CardDescription>Member activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="checkins" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all">
              <UserPlus className="w-8 h-8 mb-2 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Add Member</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all">
              <CreditCard className="w-8 h-8 mb-2 text-purple-400" />
              <span className="text-sm font-medium text-gray-200">Create Bill</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-500/10 transition-all">
              <Activity className="w-8 h-8 mb-2 text-green-400" />
              <span className="text-sm font-medium text-gray-200">View Reports</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-orange-500 hover:bg-orange-500/10 transition-all">
              <AlertCircle className="w-8 h-8 mb-2 text-orange-400" />
              <span className="text-sm font-medium text-gray-200">Pending Items</span>
            </button>
          </div>
        </CardContent>
      </Card>
        </Layout>
      </div>
    </div>
  );
};

export default AdminDashboard;