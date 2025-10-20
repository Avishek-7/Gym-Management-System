import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getUserBills } from '../../services/billing/billService';
import type { Bill } from '../../types/billing';

interface DashboardProps {
  userId: string;
  showQuickActions?: boolean;
  showStats?: boolean;
  limit?: number; // Number of recent bills to show
  onBookClass?: () => void;
  onViewProfile?: () => void;
  onMakePayment?: () => void;
  onGetSupport?: () => void;
  onViewNotifications?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  userId, 
  showQuickActions = true,
  showStats = true,
  limit = 3,
  onBookClass,
  onViewProfile,
  onMakePayment,
  onGetSupport,
  onViewNotifications
}) => {
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBills = async () => {
      if (userId) {
        try {
          setLoading(true);
          const bills = await getUserBills(userId);
          setRecentBills(bills.slice(0, limit));
        } catch (error) {
          console.error('Error fetching recent bills:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRecentBills();
  }, [userId, limit]);

  const getTotalOwed = () => {
    return recentBills
      .filter(bill => bill.status?.toLowerCase() === 'pending' || bill.status?.toLowerCase() === 'overdue')
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  };

  const getPaidBillsCount = () => {
    return recentBills.filter(bill => bill.status?.toLowerCase() === 'paid').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Outstanding</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">${getTotalOwed().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Amount due</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Recent Bills</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{recentBills.length}</div>
              <p className="text-xs text-muted-foreground">
                {getPaidBillsCount()} paid
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Membership Status</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Active</div>
              <p className="text-xs text-muted-foreground">Good standing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-300">Your latest billing updates</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBills.length > 0 ? (
            <div className="space-y-3">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">
                      {bill.billNumber || `Bill #${bill.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-300">
                      Due: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-white">${bill.totalAmount?.toFixed(2) || '0.00'}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full border ${
                        bill.status?.toLowerCase() === 'paid'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : bill.status?.toLowerCase() === 'overdue'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}
                    >
                      {bill.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto mb-2 opacity-50"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
              <p>No recent bills</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {showQuickActions && (
        <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-300">Common member tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button 
                onClick={onBookClass}
                className="flex flex-col items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mb-2 text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <span className="text-xs font-medium text-white">Book Class</span>
              </button>

              <button 
                onClick={onViewProfile}
                className="flex flex-col items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mb-2 text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span className="text-xs font-medium text-white">Profile</span>
              </button>

              <button 
                onClick={onMakePayment}
                className="flex flex-col items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mb-2 text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
                <span className="text-xs font-medium text-white">Payments</span>
              </button>

              <button 
                onClick={onGetSupport}
                className="flex flex-col items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mb-2 text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
                <span className="text-xs font-medium text-white">Support</span>
              </button>
              <button
                onClick={onViewNotifications}
                className="flex flex-col items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-8 h-8 mb-2 text-gray-300" />
                <span className="text-xs font-medium text-white">Notifications</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;