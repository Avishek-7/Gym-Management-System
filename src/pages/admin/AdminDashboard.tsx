import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import { MemberSelector } from '../../components/admin/MemberSelector';
import { SupplementStoreModals } from '../../components/admin/SupplementStoreModals';
import { DietDetailsModals } from '../../components/admin/DietDetailsModals';
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
  Package,
  Bell,
  Calendar,
  X,
  ShoppingCart,
  Apple,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { addMember, getMembers, updateMember, deleteMember } from '../../services/member/memberService';
import { getAllUsers, checkUserHasMemberProfile, type FirebaseUser } from '../../services/user/userService';
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
import { 
  createScheduledNotification, 
  getScheduledNotifications, 
  cancelScheduledNotification 
} from '../../services/notification/notificationService';
import {
  getAllSupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
  createSupplementSale,
  getAllSupplementSales
} from '../../services/inventory/supplementService';
import {
  getAllDietPlans,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan
} from '../../services/diet/dietService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import type { Member } from '../../types/member';
import type { Bill, CreateBillRequest } from '../../types/billing';
import type { FeePackage, CreateFeePackageRequest } from '../../types/package';
import type { ScheduledNotification, CreateScheduledNotificationRequest } from '../../types/notification';
import type { Supplement, CreateSupplementRequest, SupplementSale, CreateSupplementSaleRequest } from '../../types/supplement';
import type { DietPlan, CreateDietPlanRequest, DietTemplate } from '../../types/diet';

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

  // User Selection State for Add Member
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<FirebaseUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FirebaseUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  // Manage Notifications Modal State
  const [isManageNotificationsOpen, setIsManageNotificationsOpen] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [notificationFrequency, setNotificationFrequency] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
  const [customDayOfMonth, setCustomDayOfMonth] = useState<number>(1);

  // Supplement Store Modal State
  const [isSupplementStoreOpen, setIsSupplementStoreOpen] = useState(false);
  const [supplementsList, setSupplementsList] = useState<Supplement[]>([]);
  const [supplementsLoading, setSupplementsLoading] = useState(false);
  const [isAddSupplementOpen, setIsAddSupplementOpen] = useState(false);
  const [isEditSupplementOpen, setIsEditSupplementOpen] = useState(false);
  const [isSaleSupplementOpen, setIsSaleSupplementOpen] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [supplementFormData, setSupplementFormData] = useState<Partial<CreateSupplementRequest>>({
    category: 'protein',
    unit: 'kg'
  });
  const [saleFormData, setSaleFormData] = useState<Partial<CreateSupplementSaleRequest>>({
    quantity: 1,
    discountApplied: 0,
    paymentMethod: 'cash',
    paymentStatus: 'completed'
  });
  const [supplementSales, setSupplementSales] = useState<SupplementSale[]>([]);

  // Diet Details Modal State
  const [isDietDetailsOpen, setIsDietDetailsOpen] = useState(false);
  const [dietPlansList, setDietPlansList] = useState<DietPlan[]>([]);
  const [dietTemplatesList] = useState<DietTemplate[]>([]);
  const [dietLoading, setDietLoading] = useState(false);
  const [isAddDietPlanOpen, setIsAddDietPlanOpen] = useState(false);
  const [isEditDietPlanOpen, setIsEditDietPlanOpen] = useState(false);
  const [isViewDietPlanOpen, setIsViewDietPlanOpen] = useState(false);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);

  // Quick Actions expand/collapse state
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);


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
    setShowUserSelector(true); // Show user selector by default
    loadAvailableUsers(); // Load users when opening
  };

  // Close Add Member Modal
  const closeAddMemberModal = () => {
    setIsAddMemberOpen(false);
    setShowUserSelector(false);
    setSelectedUserId(null);
    setUserSearchQuery('');
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

  // User Selection Handlers
  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await getAllUsers();
      
      // Filter out users who already have member profiles
      const usersWithoutProfiles = await Promise.all(
        users.map(async (user) => {
          const hasMemberProfile = await checkUserHasMemberProfile(user.id);
          return hasMemberProfile ? null : user;
        })
      );
      
      const availableUsersList = usersWithoutProfiles.filter((user): user is FirebaseUser => user !== null);
      setAvailableUsers(availableUsersList);
      setFilteredUsers(availableUsersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchUsers = (query: string) => {
    setUserSearchQuery(query);
    const filtered = availableUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleProceedWithSelectedUser = () => {
    if (selectedUserId) {
      const selectedUser = availableUsers.find(u => u.id === selectedUserId);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          email: selectedUser.email,
        }));
      }
      setShowUserSelector(false);
    }
  };

  const handleSkipUserSelection = () => {
    setShowUserSelector(false);
    setSelectedUserId(null);
  };

  const handleOpenUserSelector = () => {
    setShowUserSelector(true);
    loadAvailableUsers();
  };

  // Submit Add Member Form
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add member to Firebase with optional userId link
      await addMember({
        ...formData,
        userId: selectedUserId || undefined, // Link to Firebase Auth user if selected
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
      // Normalize values: ensure non-negative numbers and keep 0 allowed for maxMembers
      const normalized: CreateFeePackageRequest = {
        name: packageFormData.name || '',
        description: packageFormData.description || '',
        price: Math.max(0, Number(packageFormData.price ?? 0)),
        duration: Math.max(1, Number(packageFormData.duration ?? 1)),
        category: (packageFormData.category || 'basic') as 'basic' | 'standard' | 'premium' | 'vip',
        features: (packageFormData.features || []).filter(Boolean) as string[],
        ...(packageFormData.maxMembers !== undefined
          ? { maxMembers: Math.max(0, Number(packageFormData.maxMembers)) }
          : {}),
      };

      await createFeePackage(normalized);
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
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create package. ${msg}`);
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
      const updates: Partial<CreateFeePackageRequest> = {
        ...(packageFormData.name !== undefined ? { name: packageFormData.name } : {}),
        ...(packageFormData.description !== undefined ? { description: packageFormData.description } : {}),
        ...(packageFormData.price !== undefined ? { price: Math.max(0, Number(packageFormData.price)) } : {}),
        ...(packageFormData.duration !== undefined ? { duration: Math.max(1, Number(packageFormData.duration)) } : {}),
        ...(packageFormData.category !== undefined ? { category: packageFormData.category as 'basic' | 'standard' | 'premium' | 'vip' } : {}),
        ...(packageFormData.features !== undefined ? { features: (packageFormData.features || []).filter(Boolean) as string[] } : {}),
        ...(packageFormData.maxMembers !== undefined ? { maxMembers: Math.max(0, Number(packageFormData.maxMembers)) } : {}),
      };

      await updateFeePackage(selectedPackage.id, updates);
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
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update package. ${msg}`);
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

  // Notification Management Handlers
  const openManageNotificationsModal = async () => {
    setIsManageNotificationsOpen(true);
    setNotificationsLoading(true);
    
    try {
      // Fetch members and scheduled notifications
      const [members, notifications] = await Promise.all([
        getMembers(),
        getScheduledNotifications()
      ]);
      
      setMembersList(members);
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading notification data:', error);
      alert('Failed to load notification data.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const closeManageNotificationsModal = () => {
    setIsManageNotificationsOpen(false);
    setSelectedMembers([]);
    setNotificationFrequency('monthly');
    setCustomDayOfMonth(1);
  };

  const handleToggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllMembers = () => {
    if (selectedMembers.length === membersList.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(membersList.map(m => m.id));
    }
  };

  const handleScheduleNotifications = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate the scheduled date based on frequency
      const scheduledDate = new Date();
      
      if (notificationFrequency === 'monthly') {
        scheduledDate.setDate(customDayOfMonth);
        if (scheduledDate < new Date()) {
          scheduledDate.setMonth(scheduledDate.getMonth() + 1);
        }
      } else if (notificationFrequency === 'weekly') {
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }

      // Create scheduled notifications for all selected members
      const promises = selectedMembers.map(async (memberId) => {
        const member = membersList.find(m => m.id === memberId);
        if (!member || !member.userId) return;

        const request: CreateScheduledNotificationRequest = {
          userId: member.userId,
          templateId: 'payment_due_monthly', // You might want to create this template
          type: 'payment_due',
          scheduledFor: scheduledDate,
          isRecurring: true,
          recurringPattern: notificationFrequency === 'monthly' ? 'monthly' : 'weekly',
          recurringInterval: 1,
          relatedEntityId: member.id,
          relatedEntityType: 'membership'
        };

        return createScheduledNotification(request);
      });

      await Promise.all(promises);
      
      alert(`Successfully scheduled ${notificationFrequency} payment reminders for ${selectedMembers.length} member(s)!`);
      
      // Refresh scheduled notifications list
      const notifications = await getScheduledNotifications();
      setScheduledNotifications(notifications);
      
      // Reset selection
      setSelectedMembers([]);
      
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      alert('Failed to schedule notifications. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelScheduledNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled notification?')) {
      return;
    }

    try {
      await cancelScheduledNotification(notificationId);
      alert('Scheduled notification cancelled successfully!');
      
      // Refresh list
      const notifications = await getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      alert('Failed to cancel notification.');
    }
  };

  // Supplement Store Handlers
  const openSupplementStoreModal = async () => {
    setIsSupplementStoreOpen(true);
    setSupplementsLoading(true);
    
    try {
      const [supplements, sales] = await Promise.all([
        getAllSupplements(),
        getAllSupplementSales(20)
      ]);
      
      setSupplementsList(supplements);
      setSupplementSales(sales);
    } catch (error) {
      console.error('Error loading supplement data:', error);
      alert('Failed to load supplement data.');
    } finally {
      setSupplementsLoading(false);
    }
  };

  const closeSupplementStoreModal = () => {
    setIsSupplementStoreOpen(false);
    setSelectedSupplement(null);
  };

  const openAddSupplementModal = () => {
    setSupplementFormData({
      name: '',
      brand: '',
      category: 'protein',
      description: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      unit: 'kg',
      reorderLevel: 10,
      sku: `SUP-${Date.now()}`
    });
    setIsAddSupplementOpen(true);
  };

  const handleCreateSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const request: CreateSupplementRequest = {
        name: supplementFormData.name || '',
        brand: supplementFormData.brand || '',
        category: (supplementFormData.category || 'protein') as 'protein' | 'pre-workout' | 'vitamins' | 'creatine' | 'bcaa' | 'fat-burner' | 'mass-gainer' | 'other',
        description: supplementFormData.description || '',
        price: Number(supplementFormData.price ?? 0),
        costPrice: Number(supplementFormData.costPrice ?? 0),
        stockQuantity: Number(supplementFormData.stockQuantity ?? 0),
        unit: (supplementFormData.unit || 'kg') as 'kg' | 'lbs' | 'pieces' | 'bottles' | 'sachets',
        reorderLevel: Number(supplementFormData.reorderLevel ?? 10),
        sku: supplementFormData.sku || `SUP-${Date.now()}`,
        ...(supplementFormData.expiryDate && { expiryDate: supplementFormData.expiryDate }),
        ...(supplementFormData.barcode && { barcode: supplementFormData.barcode }),
        ...(supplementFormData.imageUrl && { imageUrl: supplementFormData.imageUrl })
      };

      await createSupplement(request);
      alert('Supplement added successfully!');
      setIsAddSupplementOpen(false);
      
      // Refresh list
      const supplements = await getAllSupplements();
      setSupplementsList(supplements);
    } catch (error) {
      console.error('Error creating supplement:', error);
      alert('Failed to add supplement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplement = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    setSupplementFormData({
      name: supplement.name,
      brand: supplement.brand,
      category: supplement.category,
      description: supplement.description,
      price: supplement.price,
      costPrice: supplement.costPrice,
      stockQuantity: supplement.stockQuantity,
      unit: supplement.unit,
      reorderLevel: supplement.reorderLevel,
      sku: supplement.sku,
      expiryDate: supplement.expiryDate,
      barcode: supplement.barcode,
      imageUrl: supplement.imageUrl
    });
    setIsEditSupplementOpen(true);
  };

  const handleUpdateSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplement) return;

    setIsSubmitting(true);
    try {
      await updateSupplement(selectedSupplement.id, supplementFormData);
      alert('Supplement updated successfully!');
      setIsEditSupplementOpen(false);
      
      // Refresh list
      const supplements = await getAllSupplements();
      setSupplementsList(supplements);
    } catch (error) {
      console.error('Error updating supplement:', error);
      alert('Failed to update supplement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplement = async (supplementId: string) => {
    if (!confirm('Are you sure you want to delete this supplement? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSupplement(supplementId);
      alert('Supplement deleted successfully!');
      
      // Refresh list
      const supplements = await getAllSupplements();
      setSupplementsList(supplements);
    } catch (error) {
      console.error('Error deleting supplement:', error);
      alert('Failed to delete supplement.');
    }
  };

  const openSaleModal = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    setSaleFormData({
      supplementId: supplement.id,
      quantity: 1,
      unitPrice: supplement.price,
      discountApplied: 0,
      paymentMethod: 'cash',
      paymentStatus: 'completed'
    });
    setIsSaleSupplementOpen(true);
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplement || !user) return;

    setIsSubmitting(true);
    try {
      const request: CreateSupplementSaleRequest = {
        supplementId: saleFormData.supplementId || selectedSupplement.id,
        memberId: saleFormData.memberId,
        quantity: Number(saleFormData.quantity ?? 1),
        unitPrice: Number(saleFormData.unitPrice ?? selectedSupplement.price),
        discountApplied: Number(saleFormData.discountApplied ?? 0),
        paymentMethod: (saleFormData.paymentMethod || 'cash') as 'cash' | 'card' | 'upi' | 'online',
        paymentStatus: (saleFormData.paymentStatus || 'completed') as 'completed' | 'pending' | 'refunded',
        notes: saleFormData.notes
      };

      await createSupplementSale(request, user.uid, user.email || 'Admin');
      alert('Sale recorded successfully!');
      setIsSaleSupplementOpen(false);
      
      // Refresh lists
      const [supplements, sales] = await Promise.all([
        getAllSupplements(),
        getAllSupplementSales(20)
      ]);
      
      setSupplementsList(supplements);
      setSupplementSales(sales);
    } catch (error) {
      console.error('Error creating sale:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to record sale: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Diet Details Handlers
  const openDietDetailsModal = async () => {
    setIsDietDetailsOpen(true);
    setDietLoading(true);
    
    try {
      const plans = await getAllDietPlans();
      setDietPlansList(plans);
    } catch (error) {
      console.error('Error loading diet plans:', error);
      alert('Failed to load diet plans.');
    } finally {
      setDietLoading(false);
    }
  };

  const closeDietDetailsModal = () => {
    setIsDietDetailsOpen(false);
    setSelectedDietPlan(null);
  };

  const openAddDietPlanModal = () => {
    setIsAddDietPlanOpen(true);
  };

  const closeAddDietPlanModal = () => {
    setIsAddDietPlanOpen(false);
  };

  const openEditDietPlanModal = (plan: DietPlan) => {
    setSelectedDietPlan(plan);
    setIsEditDietPlanOpen(true);
  };

  const closeEditDietPlanModal = () => {
    setIsEditDietPlanOpen(false);
    setSelectedDietPlan(null);
  };

  const openViewDietPlanModal = (plan: DietPlan) => {
    setSelectedDietPlan(plan);
    setIsViewDietPlanOpen(true);
  };

  const closeViewDietPlanModal = () => {
    setIsViewDietPlanOpen(false);
    setSelectedDietPlan(null);
  };

  const handleCreateDietPlan = async (planData: CreateDietPlanRequest) => {
    setDietLoading(true);
    try {
      await createDietPlan(planData);
      alert('Diet plan created successfully!');
      
      // Refresh list
      const plans = await getAllDietPlans();
      setDietPlansList(plans);
      closeAddDietPlanModal();
    } catch (error) {
      console.error('Error creating diet plan:', error);
      alert('Failed to create diet plan.');
    } finally {
      setDietLoading(false);
    }
  };

  const handleUpdateDietPlan = async (planId: string, updates: Partial<DietPlan>) => {
    setDietLoading(true);
    try {
      await updateDietPlan(planId, updates);
      alert('Diet plan updated successfully!');
      
      // Refresh list
      const plans = await getAllDietPlans();
      setDietPlansList(plans);
      closeEditDietPlanModal();
    } catch (error) {
      console.error('Error updating diet plan:', error);
      alert('Failed to update diet plan.');
    } finally {
      setDietLoading(false);
    }
  };

  const handleDeleteDietPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      return;
    }

    setDietLoading(true);
    try {
      await deleteDietPlan(planId);
      alert('Diet plan deleted successfully!');
      
      // Refresh list
      const plans = await getAllDietPlans();
      setDietPlansList(plans);
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      alert('Failed to delete diet plan.');
    } finally {
      setDietLoading(false);
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
          {/* Info: Packages visibility */}
          {availablePackages.length === 0 && (
            <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
              No active packages found or insufficient permissions to read the packages collection. If you expect packages here, review Firestore security rules to allow reads.
            </div>
          )}
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
            {/* Always visible - Top 4 actions */}
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

            {/* Conditionally visible - Remaining 5 actions */}
            {showAllQuickActions && (
              <>
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
                <button 
                  onClick={openManageNotificationsModal}
                  className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-yellow-500 hover:bg-yellow-500/10 transition-all"
                >
                  <Bell className="w-8 h-8 mb-2 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-200">Monthly Notifications</span>
                </button>
                <button 
                  onClick={openSupplementStoreModal}
                  className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-pink-500 hover:bg-pink-500/10 transition-all"
                >
                  <ShoppingCart className="w-8 h-8 mb-2 text-pink-400" />
                  <span className="text-sm font-medium text-gray-200">Supplement Store</span>
                </button>
                <button 
                  onClick={openDietDetailsModal}
                  className="flex flex-col items-center justify-center p-6 border border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-500/10 transition-all"
                >
                  <Apple className="w-8 h-8 mb-2 text-green-400" />
                  <span className="text-sm font-medium text-gray-200">Diet Details</span>
                </button>
              </>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllQuickActions(!showAllQuickActions)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-gray-300 hover:text-white"
            >
              <span className="text-sm font-medium">
                {showAllQuickActions ? 'Show Less' : 'Show More Actions'}
              </span>
              {showAllQuickActions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
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
              {showUserSelector 
                ? 'Select an existing user or create a member without a user account.' 
                : 'Fill in the member details below to add them to the system.'}
            </DialogDescription>
          </DialogHeader>

          {/* User Selector View */}
          {showUserSelector ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <input
                  type="text"
                  placeholder="Search by email or user ID..."
                  value={userSearchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Loading State */}
              {loadingUsers && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
                  <span className="text-gray-300">Loading users...</span>
                </div>
              )}

              {/* Users List */}
              {!loadingUsers && filteredUsers.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedUserId === user.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-500/50 bg-gray-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg mb-1">
                            {user.displayName || user.email}
                          </p>
                          {user.displayName && user.email && (
                            <p className="text-sm text-gray-300 mb-1">{user.email}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            ID: {user.id.substring(0, 20)}... • Role: <span className="capitalize">{user.role}</span>
                          </p>
                        </div>
                        {selectedUserId === user.id && (
                          <div className="text-blue-400 text-2xl font-bold ml-4">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loadingUsers && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {userSearchQuery
                    ? 'No users found matching your search.'
                    : 'All users already have member profiles.'}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleProceedWithSelectedUser}
                  disabled={!selectedUserId}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Continue with Selected User
                </button>
                <button
                  type="button"
                  onClick={handleSkipUserSelection}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Create Without User
                </button>
                <button
                  type="button"
                  onClick={closeAddMemberModal}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Member Form View */
            <form onSubmit={handleAddMember} className="space-y-6">
              {/* User Link Indicator */}
              {selectedUserId && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-400">Linked User Account</p>
                  <p className="text-sm text-gray-300 mt-1">
                    This member profile will be linked to user: <span className="font-mono">{selectedUserId}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenUserSelector}
                    className="text-sm text-blue-400 hover:text-blue-300 underline mt-2"
                  >
                    Change User Selection
                  </button>
                </div>
              )}

              {/* Show "Select User" button if no user selected yet */}
              {!selectedUserId && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleOpenUserSelector}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 rounded-lg font-medium transition-colors text-sm"
                  >
                    Select Existing User
                  </button>
                </div>
              )}
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
                    {selectedUserId && <span className="text-xs text-gray-400 ml-2">(from user account)</span>}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={Boolean(selectedUserId)}
                    className={`w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${selectedUserId ? 'opacity-60 cursor-not-allowed' : ''}`}
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
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Membership ID is the gym member number (e.g., MEM-001). 
                  User ID is optional - leave blank if this member doesn't have a login account yet.
                </p>
              </div>

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
                  <p className="text-xs text-gray-400 mt-1">Gym membership number for identification</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.userId || ''}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Firebase Auth UID"
                  />
                  <p className="text-xs text-gray-400 mt-1">Links to user account for billing</p>
                </div>
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
          )}
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
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Select Member</h3>
              
              <MemberSelector 
                onSelect={(userId, membershipId) => {
                  setBillFormData(prev => ({
                    ...prev,
                    userId,
                    membershipId
                  }));
                }}
                selectedMembershipId={billFormData.membershipId}
              />

              {billFormData.userId && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-300">
                    <strong>Selected:</strong>
                    <br />
                    User ID: <code className="bg-gray-800/50 px-1 rounded">{billFormData.userId}</code>
                    <br />
                    Membership ID: <code className="bg-gray-800/50 px-1 rounded">{billFormData.membershipId}</code>
                  </p>
                </div>
              )}
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
                  min="0"
                  value={packageFormData.maxMembers ?? ''}
                  onChange={(e) => setPackageFormData({...packageFormData, maxMembers: e.target.value !== '' ? parseInt(e.target.value) : undefined})}
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
                  min="0"
                  value={packageFormData.maxMembers ?? ''}
                  onChange={(e) => setPackageFormData({...packageFormData, maxMembers: e.target.value !== '' ? parseInt(e.target.value) : undefined})}
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

      {/* Manage Monthly Notifications Modal */}
      <Dialog open={isManageNotificationsOpen} onOpenChange={closeManageNotificationsModal}>
        <DialogContent className="bg-gray-900/95 border-white/20 backdrop-blur-md max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-yellow-400" />
              Manage Monthly Payment Notifications
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Schedule automated monthly payment reminders for members
            </DialogDescription>
          </DialogHeader>

          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
              <p className="text-gray-300">Loading notification data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Schedule New Notifications Section */}
              <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  Schedule New Notifications
                </h3>

                {/* Notification Frequency Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Notification Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNotificationFrequency('monthly')}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        notificationFrequency === 'monthly'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="font-medium">Monthly</div>
                      <div className="text-xs mt-1 opacity-80">Every month on specific day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationFrequency('weekly')}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        notificationFrequency === 'weekly'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="font-medium">Weekly</div>
                      <div className="text-xs mt-1 opacity-80">Every 7 days</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationFrequency('custom')}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        notificationFrequency === 'custom'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="font-medium">Custom</div>
                      <div className="text-xs mt-1 opacity-80">Custom schedule</div>
                    </button>
                  </div>
                </div>

                {/* Day of Month Selection for Monthly */}
                {notificationFrequency === 'monthly' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Day of Month (1-28)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={customDayOfMonth}
                      onChange={(e) => setCustomDayOfMonth(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                    />
                    <p className="text-xs text-gray-400">
                      Notifications will be sent on day {customDayOfMonth} of each month
                    </p>
                  </div>
                )}

                {/* Member Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Select Members ({selectedMembers.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllMembers}
                      className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                    >
                      {selectedMembers.length === membersList.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/30">
                    {membersList.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No members found</p>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {membersList.map((member) => (
                          <label
                            key={member.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-700/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => handleToggleMemberSelection(member.id)}
                              className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-400 truncate">
                                {member.email} • {member.membershipId}
                              </div>
                            </div>
                            {!member.userId && (
                              <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                                No Account
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Button */}
                <Button
                  onClick={handleScheduleNotifications}
                  disabled={isSubmitting || selectedMembers.length === 0}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isSubmitting ? 'Scheduling...' : `Schedule Notifications for ${selectedMembers.length} Member(s)`}
                </Button>
              </div>

              {/* Existing Scheduled Notifications */}
              <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="text-lg font-semibold text-white">
                  Active Scheduled Notifications ({scheduledNotifications.filter(n => n.status === 'active').length})
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scheduledNotifications.filter(n => n.status === 'active').length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No active scheduled notifications</p>
                  ) : (
                    scheduledNotifications
                      .filter(n => n.status === 'active')
                      .map((notification) => {
                        const member = membersList.find(m => m.userId === notification.userId);
                        return (
                          <div
                            key={notification.id}
                            className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">
                                  {member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({member?.membershipId || 'N/A'})
                                </span>
                              </div>
                              <div className="text-sm text-gray-400">
                                {notification.isRecurring ? (
                                  <>
                                    <span className="capitalize">{notification.recurringPattern}</span> reminder
                                    {notification.nextSend && (
                                      <> • Next: {new Date(notification.nextSend).toLocaleDateString()}</>
                                    )}
                                  </>
                                ) : (
                                  <>One-time • {new Date(notification.scheduledFor).toLocaleDateString()}</>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCancelScheduledNotification(notification.id)}
                              className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={closeManageNotificationsModal}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplement Store Modals */}
      <SupplementStoreModals
        isOpen={isSupplementStoreOpen}
        onClose={closeSupplementStoreModal}
        supplements={supplementsList}
        sales={supplementSales}
        loading={supplementsLoading}
        onAdd={openAddSupplementModal}
        onEdit={handleEditSupplement}
        onDelete={handleDeleteSupplement}
        onSell={openSaleModal}
        isAddOpen={isAddSupplementOpen}
        setIsAddOpen={setIsAddSupplementOpen}
        addFormData={supplementFormData}
        setAddFormData={setSupplementFormData}
        onSubmitAdd={handleCreateSupplement}
        isEditOpen={isEditSupplementOpen}
        setIsEditOpen={setIsEditSupplementOpen}
        editFormData={supplementFormData}
        setEditFormData={setSupplementFormData}
        onSubmitEdit={handleUpdateSupplement}
        isSaleOpen={isSaleSupplementOpen}
        setIsSaleOpen={setIsSaleSupplementOpen}
        selectedSupplement={selectedSupplement}
        saleFormData={saleFormData}
        setSaleFormData={setSaleFormData}
        onSubmitSale={handleCreateSale}
        isSubmitting={isSubmitting}
      />

      <DietDetailsModals
        isOpen={isDietDetailsOpen}
        onClose={closeDietDetailsModal}
        dietPlans={dietPlansList}
        templates={dietTemplatesList}
        members={membersList.map((m: Member) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` }))}
        isAddPlanOpen={isAddDietPlanOpen}
        onOpenAddPlan={openAddDietPlanModal}
        onCloseAddPlan={closeAddDietPlanModal}
        onCreatePlan={handleCreateDietPlan}
        isEditPlanOpen={isEditDietPlanOpen}
        onOpenEditPlan={openEditDietPlanModal}
        onCloseEditPlan={closeEditDietPlanModal}
        onUpdatePlan={handleUpdateDietPlan}
        selectedPlan={selectedDietPlan}
        isViewPlanOpen={isViewDietPlanOpen}
        onOpenViewPlan={openViewDietPlanModal}
        onCloseViewPlan={closeViewDietPlanModal}
        onDeletePlan={handleDeleteDietPlan}
        isLoading={dietLoading}
      />

        </Layout>
      </div>
    </div>
  );
};

export default AdminDashboard;