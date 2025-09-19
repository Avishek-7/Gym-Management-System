import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../core/firebase';
import type { 
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsDataPoint
} from '../../types/reports';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper function to group data by time period
const groupDataByPeriod = (data: Record<string, unknown>[], dateField: string, groupBy: 'day' | 'week' | 'month'): Map<string, Record<string, unknown>[]> => {
  const grouped = new Map<string, Record<string, unknown>[]>();
  
  data.forEach(item => {
    const date = item[dateField] as Date;
    if (!date) return;
    
    let key: string;
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  return grouped;
};

// Core analytics query function
export const executeAnalyticsQuery = async (analyticsQuery: AnalyticsQuery): Promise<AnalyticsResult> => {
  try {
    const { metric, dateRange, groupBy = 'day', filters = {} } = analyticsQuery;
    
    let result: AnalyticsResult;
    
    switch (metric) {
      case 'revenue':
        result = await getRevenueAnalytics(dateRange, groupBy, filters);
        break;
      case 'member_growth':
        result = await getMemberGrowthAnalytics(dateRange, groupBy, filters);
        break;
      case 'attendance':
        result = await getAttendanceAnalytics(dateRange, groupBy);
        break;
      case 'class_popularity':
        result = await getClassPopularityAnalytics(dateRange, groupBy, filters);
        break;
      case 'membership_conversion':
        result = await getMembershipConversionAnalytics(dateRange, groupBy);
        break;
      case 'churn_rate':
        result = await getChurnRateAnalytics(dateRange, groupBy, filters);
        break;
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error executing analytics query:', error);
    throw new Error('Failed to execute analytics query');
  }
};

// Revenue Analytics
const getRevenueAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month',
  filters: Record<string, unknown>
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  // Build query with filters
  let q = query(
    collection(db, 'bills'),
    where('dueDate', '>=', start),
    where('dueDate', '<=', end),
    where('status', '==', 'paid')
  );
  
  // Apply additional filters if provided
  if (filters.membershipType) {
    q = query(q, where('membershipType', '==', filters.membershipType));
  }
  
  const querySnapshot = await getDocs(q);
  const bills = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    dueDate: convertTimestamp(doc.data().dueDate) || new Date(),
    totalAmount: doc.data().totalAmount || 0
  }));
  
  // Group by time period
  const groupedData = groupDataByPeriod(bills, 'dueDate', groupBy);
  
  // Calculate analytics
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodBills]) => ({
    date: new Date(dateKey),
    value: periodBills.reduce((sum: number, bill: Record<string, unknown>) => sum + (bill.totalAmount as number || 0), 0)
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'revenue',
    value: totalRevenue,
    data
  };
};

// Member Growth Analytics
const getMemberGrowthAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month',
  filters: Record<string, unknown>
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  let q = query(
    collection(db, 'members'),
    where('joinDate', '>=', start),
    where('joinDate', '<=', end)
  );
  
  if (filters.membershipType) {
    q = query(q, where('membershipType', '==', filters.membershipType));
  }
  
  const querySnapshot = await getDocs(q);
  const members = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    joinDate: convertTimestamp(doc.data().joinDate) || new Date()
  }));
  
  const groupedData = groupDataByPeriod(members, 'joinDate', groupBy);
  const totalNewMembers = members.length;
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodMembers]) => ({
    date: new Date(dateKey),
    value: periodMembers.length
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'member_growth',
    value: totalNewMembers,
    data
  };
};

// Attendance Analytics
const getAttendanceAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month'
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  const q = query(
    collection(db, 'attendance'),
    where('checkInTime', '>=', start),
    where('checkInTime', '<=', end)
  );
  
  const querySnapshot = await getDocs(q);
  const attendanceRecords = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    checkInTime: convertTimestamp(doc.data().checkInTime) || new Date()
  }));
  
  const groupedData = groupDataByPeriod(attendanceRecords, 'checkInTime', groupBy);
  const totalCheckIns = attendanceRecords.length;
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodRecords]) => ({
    date: new Date(dateKey),
    value: periodRecords.length
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'attendance',
    value: totalCheckIns,
    data
  };
};

// Class Popularity Analytics
const getClassPopularityAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month',
  filters: Record<string, unknown>
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  let q = query(
    collection(db, 'classBookings'),
    where('bookingDate', '>=', start),
    where('bookingDate', '<=', end)
  );
  
  if (filters.classType) {
    q = query(q, where('classType', '==', filters.classType));
  }
  
  const querySnapshot = await getDocs(q);
  const bookings = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    bookingDate: convertTimestamp(doc.data().bookingDate) || new Date()
  }));
  
  const groupedData = groupDataByPeriod(bookings, 'bookingDate', groupBy);
  const totalBookings = bookings.length;
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodBookings]) => ({
    date: new Date(dateKey),
    value: periodBookings.length
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'class_popularity',
    value: totalBookings,
    data
  };
};

// Membership Conversion Analytics
const getMembershipConversionAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month'
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  // Get trial members who converted to paid memberships
  // Get trial members who converted to paid memberships
  const membersQuery = query(
    collection(db, 'members'),
    where('joinDate', '>=', start),
    where('joinDate', '<=', end)
  );
  const membersSnapshot = await getDocs(membersQuery);
  const members = membersSnapshot.docs.map(doc => ({
    ...doc.data(),
    joinDate: convertTimestamp(doc.data().joinDate) || new Date(),
    membershipType: doc.data().membershipType || 'trial'
  }));
  
  // Filter for converted members (assuming 'paid' membership types indicate conversion)
  const convertedMembers = members.filter(member => 
    member.membershipType !== 'trial' && member.membershipType !== 'guest'
  );
  
  const groupedData = groupDataByPeriod(convertedMembers, 'joinDate', groupBy);
  const totalConversions = convertedMembers.length;
  const conversionRate = members.length > 0 ? (totalConversions / members.length) * 100 : 0;
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodMembers]) => ({
    date: new Date(dateKey),
    value: periodMembers.length
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'membership_conversion',
    value: conversionRate,
    data
  };
};

// Churn Rate Analytics
const getChurnRateAnalytics = async (
  dateRange: { start: Date; end: Date },
  groupBy: 'day' | 'week' | 'month',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: Record<string, unknown>
): Promise<AnalyticsResult> => {
  const { start, end } = dateRange;
  
  // Get cancelled memberships
  const membersQuery = query(
    collection(db, 'members'),
    where('status', '==', 'cancelled')
  );
  
  const membersSnapshot = await getDocs(membersQuery);
  const cancelledMembers = membersSnapshot.docs.map(doc => ({
    ...doc.data(),
    cancelledDate: convertTimestamp(doc.data().cancelledDate) || convertTimestamp(doc.data().updatedAt) || new Date()
  })).filter(member => {
    const cancelDate = member.cancelledDate;
    return cancelDate >= start && cancelDate <= end;
  });
  
  // Get total active members for churn rate calculation
  const allMembersQuery = query(collection(db, 'members'));
  const allMembersSnapshot = await getDocs(allMembersQuery);
  const totalMembers = allMembersSnapshot.size;
  
  const groupedData = groupDataByPeriod(cancelledMembers, 'cancelledDate', groupBy);
  const totalChurned = cancelledMembers.length;
  const churnRate = totalMembers > 0 ? (totalChurned / totalMembers) * 100 : 0;
  
  const data: AnalyticsDataPoint[] = Array.from(groupedData.entries()).map(([dateKey, periodMembers]) => ({
    date: new Date(dateKey),
    value: periodMembers.length
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    metric: 'churn_rate',
    value: churnRate,
    data
  };
};

// Predefined analytics queries for common use cases
export const getPopularAnalyticsQueries = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: 'monthly_revenue',
      name: 'Monthly Revenue Trend',
      query: {
        metric: 'revenue',
        dateRange: { start: ninetyDaysAgo, end: now },
        groupBy: 'month' as const
      }
    },
    {
      id: 'daily_attendance',
      name: 'Daily Attendance',
      query: {
        metric: 'attendance',
        dateRange: { start: thirtyDaysAgo, end: now },
        groupBy: 'day' as const
      }
    },
    {
      id: 'member_growth',
      name: 'Member Growth',
      query: {
        metric: 'member_growth',
        dateRange: { start: ninetyDaysAgo, end: now },
        groupBy: 'week' as const
      }
    },
    {
      id: 'class_popularity',
      name: 'Class Popularity',
      query: {
        metric: 'class_popularity',
        dateRange: { start: thirtyDaysAgo, end: now },
        groupBy: 'week' as const
      }
    }
  ];
};

// Compare metrics between two time periods
export const compareMetrics = async (
  metric: string,
  currentPeriod: { start: Date; end: Date },
  previousPeriod: { start: Date; end: Date },
  filters: Record<string, unknown> = {}
): Promise<{
  current: AnalyticsResult;
  previous: AnalyticsResult;
  changePercentage: number;
}> => {
  try {
    const currentQuery: AnalyticsQuery = {
      metric,
      dateRange: currentPeriod,
      filters
    };
    
    const previousQuery: AnalyticsQuery = {
      metric,
      dateRange: previousPeriod,
      filters
    };
    
    const [current, previous] = await Promise.all([
      executeAnalyticsQuery(currentQuery),
      executeAnalyticsQuery(previousQuery)
    ]);
    
    const changePercentage = previous.value > 0 
      ? ((current.value - previous.value) / previous.value) * 100 
      : 0;
    
    return {
      current,
      previous,
      changePercentage
    };
    
  } catch (error) {
    console.error('Error comparing metrics:', error);
    throw new Error('Failed to compare metrics');
  }
};

// Get real-time analytics dashboard data
export const getRealTimeAnalytics = async () => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Today's metrics
    const todayRevenue = await executeAnalyticsQuery({
      metric: 'revenue',
      dateRange: { start: today, end: now }
    });
    
    const todayAttendance = await executeAnalyticsQuery({
      metric: 'attendance',
      dateRange: { start: today, end: now }
    });
    
    const todayNewMembers = await executeAnalyticsQuery({
      metric: 'member_growth',
      dateRange: { start: today, end: now }
    });
    
    return {
      revenue: {
        today: todayRevenue.value,
        trend: 'up' // Would calculate from comparison with yesterday
      },
      attendance: {
        today: todayAttendance.value,
        trend: 'stable'
      },
      newMembers: {
        today: todayNewMembers.value,
        trend: 'up'
      },
      lastUpdated: now
    };
    
  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    throw new Error('Failed to get real-time analytics');
  }
};