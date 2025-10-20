import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import { User, Mail, Calendar, Shield, Search, FileText, Activity } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock user profile data - in real app, fetch from Firestore
  const [profileData] = useState({
    displayName: user?.displayName || 'User',
    email: user?.email || 'user@example.com',
    role: 'User',
    joinDate: new Date(),
    lastLogin: new Date(),
    accountStatus: 'Active',
  });

  useEffect(() => {
    // In real app, fetch user profile data here
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Mock search - in real app, search Firestore collections
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock results
      const mockResults = [
        `Profile record for ${searchQuery}`,
        `Activity log matching "${searchQuery}"`,
        `Document containing "${searchQuery}"`,
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0">
          <Background hueShift={200} speed={0.35} warpAmount={0.4} />
        </div>
        <div className="relative z-10">
          <Layout title="User Dashboard">
            <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
              <CardContent className="py-12">
                <p className="text-gray-200 text-center">Please log in to access your dashboard</p>
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
          hueShift={200}
          speed={0.35}
          warpAmount={0.4}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Layout
          title="User Dashboard"
          subtitle={`Welcome back, ${user.displayName || 'User'}!`}
          headerActions={<LogoutButton />}
        >
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gray-900/70 bg-gradient-to-r from-purple-500/20 to-blue-500/10 border-purple-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  Welcome to Your Dashboard
                </CardTitle>
                <p className="text-gray-300 mt-2">
                  View your profile information and search through your records.
                </p>
              </CardHeader>
            </Card>

            {/* Profile Information */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {profileData.displayName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white">{profileData.displayName}</h2>
                      <p className="text-gray-300 mt-1 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {profileData.role}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${
                      profileData.accountStatus === 'Active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {profileData.accountStatus}
                    </div>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-400" />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <p className="text-white">{profileData.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                        <p className="text-white text-sm font-mono">{user.uid.substring(0, 20)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Account Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Member Since</label>
                        <p className="text-white">
                          {profileData.joinDate.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Last Login</label>
                        <p className="text-white">
                          {profileData.lastLogin.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-xs text-gray-400">Activities</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-xs text-gray-400">Records</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {Math.floor((new Date().getTime() - profileData.joinDate.getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-xs text-gray-400">Days Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Records */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Records
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Search through your activity logs and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Input */}
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Search records, activities, or documents..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-600/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-purple-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white">{result}</p>
                            <p className="text-gray-400 text-sm mt-1">
                              Found on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No results found for "{searchQuery}"</p>
                  </div>
                ) : !searchQuery && !isSearching ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Enter a search query to find your records</p>
                  </div>
                ) : null}

                {/* Quick Search Suggestions */}
                {!searchQuery && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Search Suggestions</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Profile', 'Activity Log', 'Documents', 'Settings'].map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-600/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Edit Profile</h3>
                      <p className="text-gray-400 text-sm">Update your information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Security</h3>
                      <p className="text-gray-400 text-sm">Manage your security</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Activity Log</h3>
                      <p className="text-gray-400 text-sm">View your activity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default UserDashboard;
