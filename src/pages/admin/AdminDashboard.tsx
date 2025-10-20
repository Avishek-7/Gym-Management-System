import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import { 
  getDashboardStats, 
  getRevenueData, 
  getMembershipDistribution, 
  getPaymentStatusData,
  getWeeklyActivityData 
} from '../../services/admin/analyticsService';
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
  CheckCircle,
  Edit,
  Trash2,
  UserCog,
  Package
} from 'lucide-react';
import { addMember, getMembers, updateMember, deleteMember } from '../../services/member/memberService';
import { createBill, getPendingBills as fetchPendingBills, getAllBills } from '../../services/billing/billService';
import { 
  getFeePackages, 
  createFeePackage, 
  updateFeePackage, 
  deleteFeePackage,
  incrementPackageMembers,
  decrementPackageMembers
} from '../../services/billing/packageService';
import { createBillNotification, schedulePaymentReminders } from '../../services/notification/billNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import type { Member } from '../../types/member';
import type { Bill, CreateBillRequest } from '../../types/billing';
import type { FeePackage, CreateFeePackageRequest } from '../../types/package';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    revenue: 0,
    pendingBills: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{month: string, revenue: number, members: number}>>([]);
  const [membershipData, setMembershipData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<Array<{status: string, count: number, color: string}>>([]);
  const [activityData, setActivityData] = useState<Array<{day: string, checkins: number}>>([]);
  
  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Member, 'id' | 'createdAt' | 'updatedAt'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: new Date(),
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    membershipId: '',
    joinDate: new Date(),
    status: 'active',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalConditions: [],
    profileImage: '',
    lastVisit: new Date()
  });

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  
  interface BillFormItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }
  
  const [billFormData, setBillFormData] = useState<Omit<CreateBillRequest, 'items'> & { items: BillFormItem[] }>({
    userId: '',
    membershipId: '',
    amount: 0,
    taxAmount: 0,
    dueDate: new Date(),
    items: [{
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    }],
    discountApplied: 0
  });

  // View Reports Modal State
  const [isViewReportsOpen, setIsViewReportsOpen] = useState(false);
  const [reportData, setReportData] = useState<Bill[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Pending Items Modal State
  const [isPendingItemsOpen, setIsPendingItemsOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<Bill[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Manage Members Modal State
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editMemberData, setEditMemberData] = useState<Partial<Member>>({});

  // Manage Packages Modal State
  const [isManagePackagesOpen, setIsManagePackagesOpen] = useState(false);
  const [packagesList, setPackagesList] = useState<FeePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<FeePackage | null>(null);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [packageFormData, setPackageFormData] = useState<Partial<CreateFeePackageRequest>>({
    features: []
  });

  // Available packages for member assignment
  const [availablePackages, setAvailablePackages] = useState<FeePackage[]>([]);

  // Fetch real data from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all analytics data in parallel
        const [
          dashboardStats,
          revenue,
          membershipDistribution,
          paymentStatus,
          weeklyActivity,
          packages
        ] = await Promise.all([
          getDashboardStats(),
          getRevenueData(),
          getMembershipDistribution(),
          getPaymentStatusData(),
          getWeeklyActivityData(),
          getFeePackages(true) // Fetch active packages only
        ]);

        setStats(dashboardStats);
        setRevenueData(revenue);
        setMembershipData(membershipDistribution);
        setPaymentStatusData(paymentStatus);
        setActivityData(weeklyActivity);
        setAvailablePackages(packages);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle input changes
  const handleInputChange = (field: string, value: string | Date) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Open Add Member Modal
  const openAddMemberModal = () => {
    setIsAddMemberOpen(true);
  };

  // Close Add Member Modal
  const closeAddMemberModal = () => {
    setIsAddMemberOpen(false);
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      membershipId: '',
      joinDate: new Date(),
      status: 'active',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      medicalConditions: [],
      profileImage: '',
      lastVisit: new Date()
    });
  };

  // Submit Add Member Form
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add member to Firebase
      await addMember({
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // If a package was assigned, increment the package member count
      if (formData.package?.packageId) {
        await incrementPackageMembers(formData.package.packageId);
      }

      // Refresh dashboard data
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);

      // Show success message (you can add a toast notification here)
      alert('Member added successfully!');

      // Close modal
      closeAddMemberModal();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Bill Handlers
  const openCreateBillModal = () => {
    setIsCreateBillOpen(true);
  };

  const closeCreateBillModal = () => {
    setIsCreateBillOpen(false);
    setBillFormData({
      userId: '',
      membershipId: '',
      amount: 0,
      taxAmount: 0,
      dueDate: new Date(),
      items: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }],
      discountApplied: 0
    });
  };

  const handleBillInputChange = (field: string, value: string | number | Date) => {
    setBillFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBillItemChange = (index: number, field: string, value: string | number) => {
    setBillFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      // Recalculate total price for the item
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
      }
      
      // Recalculate total amount
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        ...prev,
        items: newItems,
        amount: totalAmount
      };
    });
  };

  const addBillItem = () => {
    setBillFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const removeBillItem = (index: number) => {
    setBillFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      return {
        ...prev,
        items: newItems,
        amount: totalAmount
      };
    });
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the bill
      const billId = await createBill({
        userId: billFormData.userId,
        membershipId: billFormData.membershipId,
        amount: billFormData.amount,
        taxAmount: billFormData.taxAmount,
        dueDate: billFormData.dueDate,
        items: billFormData.items,
        discountApplied: billFormData.discountApplied
      });

      // Get the created bill to send notifications
      const bills = await getAllBills();
      const createdBill = bills.find(b => b.id === billId);

      if (createdBill) {
        // Get member name for personalized notification
        const member = membersList.find(m => m.id === billFormData.userId);
        const userName = member ? `${member.firstName} ${member.lastName}` : 'Member';

        // Create immediate notification
        await createBillNotification(createdBill, userName);

        // Schedule automatic payment reminders (3 days before, 1 day before, due date)
        await schedulePaymentReminders(createdBill, userName);
      }

      // Refresh dashboard
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);

      alert('Bill created successfully! Notifications have been sent.');
      closeCreateBillModal();
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Reports Handlers
  const openViewReportsModal = async () => {
    setIsViewReportsOpen(true);
    setReportLoading(true);
    try {
      const bills = await getAllBills();
      setReportData(bills);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Failed to load reports.');
    } finally {
      setReportLoading(false);
    }
  };

  const closeViewReportsModal = () => {
    setIsViewReportsOpen(false);
  };

  // Pending Items Handlers
  const openPendingItemsModal = async () => {
    setIsPendingItemsOpen(true);
    setPendingLoading(true);
    try {
      const pending = await fetchPendingBills();
      setPendingItems(pending);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      alert('Failed to load pending items.');
    } finally {
      setPendingLoading(false);
    }
  };

  const closePendingItemsModal = () => {
    setIsPendingItemsOpen(false);
  };

  // Manage Members Handlers
  const openManageMembersModal = async () => {
    setIsManageMembersOpen(true);
    setMembersLoading(true);
    try {
      const members = await getMembers();
      setMembersList(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const closeManageMembersModal = () => {
    setIsManageMembersOpen(false);
    setSelectedMember(null);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setEditMemberData(member);
    setIsEditMemberOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    try {
      // Check if package changed
      const oldPackageId = selectedMember.package?.packageId;
      const newPackageId = editMemberData.package?.packageId;
      
      // Update member
      await updateMember(selectedMember.id, editMemberData);
      
      // Update package member counts if package changed
      if (oldPackageId !== newPackageId) {
        // Decrement old package count
        if (oldPackageId) {
          await decrementPackageMembers(oldPackageId);
        }
        // Increment new package count
        if (newPackageId) {
          await incrementPackageMembers(newPackageId);
        }
      }
      
      alert('Member updated successfully!');
      setIsEditMemberOpen(false);
      // Refresh members list
      const members = await getMembers();
      setMembersList(members);
      // Refresh dashboard stats
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Get member to check for package assignment
      const memberToDelete = membersList.find(m => m.id === memberId);
      
      // Delete member
      await deleteMember(memberId);
      
      // If member had a package, decrement the count
      if (memberToDelete?.package?.packageId) {
        await decrementPackageMembers(memberToDelete.package.packageId);
      }
      
      alert('Member deleted successfully!');
      // Refresh members list
      const members = await getMembers();
      setMembersList(members);
      // Refresh dashboard stats
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  // Package Management Handlers
  const openManagePackagesModal = async () => {
    setIsManagePackagesOpen(true);
    setPackagesLoading(true);
    try {
      const packages = await getFeePackages(); // Get all packages (not just active)
      setPackagesList(packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to load packages.');
    } finally {
      setPackagesLoading(false);
    }
  };

  const closeManagePackagesModal = () => {
    setIsManagePackagesOpen(false);
    setSelectedPackage(null);
  };

  const openAddPackageModal = () => {
    setPackageFormData({
      name: '',
      description: '',
      price: 0,
      duration: 1,
      category: 'basic',
      features: [],
      maxMembers: undefined
    });
    setIsAddPackageOpen(true);
  };

  const closeAddPackageModal = () => {
    setIsAddPackageOpen(false);
    setPackageFormData({ features: [] });
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createFeePackage(packageFormData as CreateFeePackageRequest);
      alert('Package created successfully!');
      closeAddPackageModal();
      
      // Refresh packages list
      const packages = await getFeePackages();
      setPackagesList(packages);
      
      // Refresh available packages for member assignment
      const activePackages = await getFeePackages(true);
      setAvailablePackages(activePackages);
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Failed to create package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPackage = (pkg: FeePackage) => {
    setSelectedPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      category: pkg.category,
      features: pkg.features,
      maxMembers: pkg.maxMembers
    });
    setIsEditPackageOpen(true);
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    setIsSubmitting(true);
    try {
      await updateFeePackage(selectedPackage.id, packageFormData);
      alert('Package updated successfully!');
      setIsEditPackageOpen(false);
      
      // Refresh packages list
      const packages = await getFeePackages();
      setPackagesList(packages);
      
      // Refresh available packages
      const activePackages = await getFeePackages(true);
      setAvailablePackages(activePackages);
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Failed to update package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    const pkg = packagesList.find(p => p.id === packageId);
    
    if (pkg && pkg.currentMembers > 0) {
      alert(`Cannot delete package "${pkg.name}" because it has ${pkg.currentMembers} active member(s). Please reassign members first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFeePackage(packageId);
      alert('Package deleted successfully!');
      
      // Refresh packages list
      const packages = await getFeePackages();
      setPackagesList(packages);
      
      // Refresh available packages
      const activePackages = await getFeePackages(true);
      setAvailablePackages(activePackages);
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package. Please try again.');
    }
  };

  const handleTogglePackageStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      await updateFeePackage(packageId, { isActive: !currentStatus });
      
      // Refresh packages list
      const packages = await getFeePackages();
      setPackagesList(packages);
      
      // Refresh available packages
      const activePackages = await getFeePackages(true);
      setAvailablePackages(activePackages);
    } catch (error) {
      console.error('Error toggling package status:', error);
      alert('Failed to update package status.');
    }
  };

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

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0">
          <Background 
            hueShift={270}
            speed={0.4}
            warpAmount={0.3}
          />
        </div>
        <div className="relative z-10">
          <Layout
            title="Admin Dashboard"
            subtitle="Loading analytics..."
            headerActions={<LogoutButton />}
          >
            <div className="flex items-center justify-center py-20">
              <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md p-8">
                <CardContent className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <p className="text-gray-200">Loading dashboard data...</p>
                </CardContent>
              </Card>
            </div>
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
            <button 
              onClick={openAddMemberModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all"
            >
              <UserPlus className="w-8 h-8 mb-2 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Add Member</span>
            </button>
            <button 
              onClick={openManageMembersModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-cyan-500 hover:bg-cyan-500/10 transition-all"
            >
              <UserCog className="w-8 h-8 mb-2 text-cyan-400" />
              <span className="text-sm font-medium text-gray-200">Manage Members</span>
            </button>
            <button 
              onClick={openManagePackagesModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-500/10 transition-all"
            >
              <Package className="w-8 h-8 mb-2 text-indigo-400" />
              <span className="text-sm font-medium text-gray-200">Manage Packages</span>
            </button>
            <button 
              onClick={openCreateBillModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all"
            >
              <CreditCard className="w-8 h-8 mb-2 text-purple-400" />
              <span className="text-sm font-medium text-gray-200">Create Bill</span>
            </button>
            <button 
              onClick={openViewReportsModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-500/10 transition-all"
            >
              <Activity className="w-8 h-8 mb-2 text-green-400" />
              <span className="text-sm font-medium text-gray-200">View Reports</span>
            </button>
            <button 
              onClick={openPendingItemsModal}
              className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-orange-500 hover:bg-orange-500/10 transition-all"
            >
              <AlertCircle className="w-8 h-8 mb-2 text-orange-400" />
              <span className="text-sm font-medium text-gray-200">Pending Items</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Add New Member</DialogTitle>
            <DialogDescription className="text-gray-300">
              Fill in the member details below to add them to the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('dateOfBirth', new Date(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Address</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Street</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Zip Code</label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Membership Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Membership ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.membershipId}
                    onChange={(e) => handleInputChange('membershipId', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="MEM-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fee Package Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Fee Package</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Package
                </label>
                <select
                  value={formData.package?.packageId || ''}
                  onChange={(e) => {
                    const selectedPkg = availablePackages.find(pkg => pkg.id === e.target.value);
                    if (selectedPkg) {
                      const startDate = new Date();
                      const endDate = new Date(startDate);
                      endDate.setMonth(endDate.getMonth() + selectedPkg.duration);
                      
                      setFormData(prev => ({
                        ...prev,
                        package: {
                          packageId: selectedPkg.id,
                          packageName: selectedPkg.name,
                          startDate: startDate,
                          endDate: endDate,
                          price: selectedPkg.price,
                          status: 'active' as const,
                          autoRenew: false
                        }
                      }));
                    } else {
                      // Remove package if "No Package" selected
                      setFormData(prev => ({
                        ...prev,
                        package: undefined
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">No Package (Optional)</option>
                  {availablePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price} ({pkg.duration} month{pkg.duration > 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                {formData.package && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Package:</strong> {formData.package.packageName}
                    </p>
                    <p className="text-sm text-blue-300">
                      <strong>Duration:</strong> {availablePackages.find(p => p.id === formData.package?.packageId)?.duration} months
                    </p>
                    <p className="text-sm text-blue-300">
                      <strong>Price:</strong> ${formData.package.price}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Emergency Contact</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Spouse"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                onClick={closeAddMemberModal}
                disabled={isSubmitting}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Bill Modal */}
      <Dialog open={isCreateBillOpen} onOpenChange={setIsCreateBillOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Create New Bill</DialogTitle>
            <DialogDescription className="text-gray-300">
              Generate a bill for a member with itemized charges.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBill} className="space-y-6">
            {/* Member Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Member Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={billFormData.userId}
                    onChange={(e) => handleBillInputChange('userId', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="member-user-id"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Membership ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={billFormData.membershipId}
                    onChange={(e) => handleBillInputChange('membershipId', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="MEM-001"
                  />
                </div>
              </div>
            </div>

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-white">Bill Items</h3>
                <Button
                  type="button"
                  onClick={addBillItem}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-1 px-3"
                >
                  + Add Item
                </Button>
              </div>

              {billFormData.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Item #{index + 1}</span>
                    {billFormData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBillItem(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleBillItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      placeholder="Monthly membership fee"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleBillItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Unit Price ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleBillItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Total ($)</label>
                      <input
                        type="number"
                        disabled
                        value={item.totalPrice.toFixed(2)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subtotal ($)</label>
                  <input
                    type="number"
                    disabled
                    value={billFormData.amount.toFixed(2)}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tax Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={billFormData.taxAmount}
                    onChange={(e) => handleBillInputChange('taxAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billFormData.discountApplied || 0}
                    onChange={(e) => handleBillInputChange('discountApplied', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    required
                    value={billFormData.dueDate.toISOString().split('T')[0]}
                    onChange={(e) => handleBillInputChange('dueDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">Total Amount:</span>
                  <span className="text-2xl font-bold text-purple-400">
                    ${(billFormData.amount + billFormData.taxAmount - (billFormData.discountApplied || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                onClick={closeCreateBillModal}
                disabled={isSubmitting}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Bill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Reports Modal */}
      <Dialog open={isViewReportsOpen} onOpenChange={setIsViewReportsOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">All Bills Report</DialogTitle>
            <DialogDescription className="text-gray-300">
              Complete billing history and reports
            </DialogDescription>
          </DialogHeader>

          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
              <span className="text-gray-300">Loading reports...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Bill #</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {reportData.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3 text-sm text-gray-200 font-mono">{bill.billNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-200">{bill.userId.slice(0, 12)}...</td>
                          <td className="px-4 py-3 text-sm text-gray-200 font-semibold">${bill.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              bill.status === 'paid'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : bill.status === 'overdue'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {bill.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">No bills found</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={closeViewReportsModal}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Items Modal */}
      <Dialog open={isPendingItemsOpen} onOpenChange={setIsPendingItemsOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Pending Bills</DialogTitle>
            <DialogDescription className="text-gray-300">
              Bills that require attention or payment
            </DialogDescription>
          </DialogHeader>

          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
              <span className="text-gray-300">Loading pending items...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.length > 0 ? (
                <div className="grid gap-4">
                  {pendingItems.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 bg-gray-800/30 border border-orange-500/30 rounded-lg hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{bill.billNumber}</h4>
                          <p className="text-gray-400 text-sm">User: {bill.userId.slice(0, 20)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-400">${bill.totalAmount.toFixed(2)}</p>
                          <p className="text-gray-400 text-sm">
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                          <span className="text-sm text-gray-300">
                            {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          PENDING
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">No pending bills!</p>
                  <p className="text-gray-500 text-sm mt-2">All bills are up to date</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={closePendingItemsModal}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Modal */}
      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Manage Members</DialogTitle>
            <DialogDescription className="text-gray-300">
              View, edit, or delete member records
            </DialogDescription>
          </DialogHeader>

          {membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
              <span className="text-gray-300">Loading members...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {membersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Phone</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Package</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Joined</th>
                        <th className="text-center py-3 px-4 text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersList.map((member) => (
                        <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 text-white">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="py-3 px-4 text-gray-300">{member.email}</td>
                          <td className="py-3 px-4 text-gray-300">{member.phone}</td>
                          <td className="py-3 px-4">
                            {member.package ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {member.package.packageName}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">No Package</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {member.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(member.joinDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                                title="Edit Member"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">No members found</p>
                  <p className="text-gray-500 text-sm mt-2">Add members to get started</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={closeManageMembersModal}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Edit Member</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update member information below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleUpdateMember(); }} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editMemberData.firstName || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, firstName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editMemberData.lastName || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, lastName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={editMemberData.email || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editMemberData.phone || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={editMemberData.address?.street || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      address: {...editMemberData.address!, street: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={editMemberData.address?.city || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      address: {...editMemberData.address!, city: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={editMemberData.address?.state || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      address: {...editMemberData.address!, state: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={editMemberData.address?.zipCode || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      address: {...editMemberData.address!, zipCode: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editMemberData.address?.country || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      address: {...editMemberData.address!, country: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editMemberData.emergencyContact?.name || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      emergencyContact: {
                        name: e.target.value,
                        phone: editMemberData.emergencyContact?.phone || '',
                        relationship: editMemberData.emergencyContact?.relationship || ''
                      }
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editMemberData.emergencyContact?.phone || ''}
                    onChange={(e) => setEditMemberData({
                      ...editMemberData, 
                      emergencyContact: {
                        name: editMemberData.emergencyContact?.name || '',
                        phone: e.target.value,
                        relationship: editMemberData.emergencyContact?.relationship || ''
                      }
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={editMemberData.emergencyContact?.relationship || ''}
                  onChange={(e) => setEditMemberData({
                    ...editMemberData, 
                    emergencyContact: {
                      name: editMemberData.emergencyContact?.name || '',
                      phone: editMemberData.emergencyContact?.phone || '',
                      relationship: e.target.value
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
            </div>

            {/* Membership Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Membership Status</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  value={editMemberData.status || 'active'}
                  onChange={(e) => setEditMemberData({...editMemberData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Fee Package Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Fee Package</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Package
                </label>
                <select
                  value={editMemberData.package?.packageId || ''}
                  onChange={(e) => {
                    const selectedPkg = availablePackages.find(pkg => pkg.id === e.target.value);
                    if (selectedPkg) {
                      const startDate = editMemberData.package?.startDate || new Date();
                      const endDate = new Date(startDate);
                      endDate.setMonth(endDate.getMonth() + selectedPkg.duration);
                      
                      setEditMemberData({
                        ...editMemberData,
                        package: {
                          packageId: selectedPkg.id,
                          packageName: selectedPkg.name,
                          startDate: startDate,
                          endDate: endDate,
                          price: selectedPkg.price,
                          status: 'active' as const,
                          autoRenew: editMemberData.package?.autoRenew || false
                        }
                      });
                    } else {
                      setEditMemberData({
                        ...editMemberData,
                        package: undefined
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">No Package</option>
                  {availablePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price} ({pkg.duration} month{pkg.duration > 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                {editMemberData.package && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Current Package:</strong> {editMemberData.package.packageName}
                    </p>
                    <p className="text-sm text-blue-300">
                      <strong>Status:</strong> {editMemberData.package.status}
                    </p>
                    <p className="text-sm text-blue-300">
                      <strong>Price:</strong> ${editMemberData.package.price}
                    </p>
                    {editMemberData.package.endDate && (
                      <p className="text-sm text-blue-300">
                        <strong>Expires:</strong> {new Date(editMemberData.package.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsEditMemberOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Packages Modal */}
      <Dialog open={isManagePackagesOpen} onOpenChange={setIsManagePackagesOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Manage Fee Packages</DialogTitle>
            <DialogDescription className="text-gray-300">
              Create, edit, or delete membership packages
            </DialogDescription>
          </DialogHeader>

          {packagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
              <span className="text-gray-300">Loading packages...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={openAddPackageModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add New Package
                </Button>
              </div>

              {packagesList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Price</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Duration</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Category</th>
                        <th className="text-center py-3 px-4 text-gray-300 font-semibold">Members</th>
                        <th className="text-center py-3 px-4 text-gray-300 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packagesList.map((pkg) => (
                        <tr key={pkg.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-semibold">{pkg.name}</p>
                              <p className="text-gray-400 text-xs">{pkg.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-green-400 font-bold">${pkg.price}</td>
                          <td className="py-3 px-4 text-gray-300">{pkg.duration} month{pkg.duration > 1 ? 's' : ''}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pkg.category === 'vip' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              pkg.category === 'premium' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              pkg.category === 'standard' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {pkg.category.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-white font-semibold">{pkg.currentMembers}</span>
                            {pkg.maxMembers && (
                              <span className="text-gray-400 text-sm"> / {pkg.maxMembers}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleTogglePackageStatus(pkg.id, pkg.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                pkg.isActive
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                              }`}
                            >
                              {pkg.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditPackage(pkg)}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                                title="Edit Package"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                title="Delete Package"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">No packages found</p>
                  <p className="text-gray-500 text-sm mt-2">Create your first package to get started</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={closeManagePackagesModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Package Modal */}
      <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Add New Package</DialogTitle>
            <DialogDescription className="text-gray-300">
              Create a new membership package
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePackage} className="space-y-6">
            {/* Package Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Package Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Package Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packageFormData.name || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Premium Monthly, Basic Yearly"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={packageFormData.description || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe the package benefits..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={packageFormData.price || 0}
                    onChange={(e) => setPackageFormData({...packageFormData, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (months) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageFormData.duration || 1}
                    onChange={(e) => setPackageFormData({...packageFormData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={packageFormData.category || 'basic'}
                    onChange={(e) => setPackageFormData({...packageFormData, category: e.target.value as 'basic' | 'standard' | 'premium' | 'vip'})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Members (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={packageFormData.maxMembers || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, maxMembers: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Features</h3>
              <div className="space-y-2">
                {packageFormData.features?.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...(packageFormData.features || [])];
                        newFeatures[index] = e.target.value;
                        setPackageFormData({...packageFormData, features: newFeatures});
                      }}
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Unlimited gym access"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = packageFormData.features?.filter((_, i) => i !== index);
                        setPackageFormData({...packageFormData, features: newFeatures});
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPackageFormData({...packageFormData, features: [...(packageFormData.features || []), '']})}
                  className="w-full px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
                >
                  + Add Feature
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={closeAddPackageModal}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Modal */}
      <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Edit Package</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update package information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePackage} className="space-y-6">
            {/* Package Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Package Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Package Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packageFormData.name || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Premium Monthly, Basic Yearly"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={packageFormData.description || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe the package benefits..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={packageFormData.price || 0}
                    onChange={(e) => setPackageFormData({...packageFormData, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (months) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageFormData.duration || 1}
                    onChange={(e) => setPackageFormData({...packageFormData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={packageFormData.category || 'basic'}
                    onChange={(e) => setPackageFormData({...packageFormData, category: e.target.value as 'basic' | 'standard' | 'premium' | 'vip'})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Members (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={packageFormData.maxMembers || ''}
                  onChange={(e) => setPackageFormData({...packageFormData, maxMembers: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Features</h3>
              <div className="space-y-2">
                {packageFormData.features?.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...(packageFormData.features || [])];
                        newFeatures[index] = e.target.value;
                        setPackageFormData({...packageFormData, features: newFeatures});
                      }}
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Unlimited gym access"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = packageFormData.features?.filter((_, i) => i !== index);
                        setPackageFormData({...packageFormData, features: newFeatures});
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPackageFormData({...packageFormData, features: [...(packageFormData.features || []), '']})}
                  className="w-full px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
                >
                  + Add Feature
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsEditPackageOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

        </Layout>
      </div>
    </div>
  );
};

export default AdminDashboard;