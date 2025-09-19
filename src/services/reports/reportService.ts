import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../core/firebase';
import type { 
  Report,
  RevenueReport,
  MemberReport,
  AttendanceReport,
  CreateReportRequest,
  DashboardMetrics,
  ScheduledReportConfig,
  CreateScheduledReportRequest
} from '../../types/reports';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper function to get date range for period
const getDateRangeForPeriod = (period: string, customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarterly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'yearly':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      startDate = customStart || new Date(now.getFullYear(), 0, 1);
      endDate = customEnd || now;
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate };
};

// Revenue Report Generation
export const generateRevenueReport = async (request: CreateReportRequest): Promise<RevenueReport> => {
  try {
    const { startDate, endDate } = getDateRangeForPeriod(request.period, request.startDate, request.endDate);
    
    // Get billing data from the billing collection
    const billsQuery = query(
      collection(db, 'bills'),
      where('dueDate', '>=', startDate),
      where('dueDate', '<=', endDate),
      where('status', '==', 'paid')
    );
    
    const billsSnapshot = await getDocs(billsQuery);
    const bills = billsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      dueDate: convertTimestamp(doc.data().dueDate) || new Date(),
      totalAmount: doc.data().totalAmount || 0,
      type: doc.data().type || 'other'
    }));
    
    // Calculate revenue metrics
    let totalRevenue = 0;
    let membershipRevenue = 0;
    let supplementRevenue = 0;
    let classRevenue = 0;
    let otherRevenue = 0;
    
    const revenueByDate = new Map<string, {
      date: Date;
      membershipRevenue: number;
      supplementRevenue: number;
      classRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
      transactionCount: number;
    }>();
    
    bills.forEach((bill) => {
      const amount = bill.totalAmount;
      totalRevenue += amount;
      
      // Categorize revenue based on bill type or items
      switch (bill.type) {
        case 'membership':
          membershipRevenue += amount;
          break;
        case 'supplement':
          supplementRevenue += amount;
          break;
        case 'class':
          classRevenue += amount;
          break;
        default:
          otherRevenue += amount;
      }
      
      // Group by date for breakdown
      const dateKey = bill.dueDate.toDateString();
      if (!revenueByDate.has(dateKey)) {
        revenueByDate.set(dateKey, {
          date: bill.dueDate,
          membershipRevenue: 0,
          supplementRevenue: 0,
          classRevenue: 0,
          otherRevenue: 0,
          totalRevenue: 0,
          transactionCount: 0
        });
      }
      
      const dayData = revenueByDate.get(dateKey)!;
      dayData.totalRevenue += amount;
      dayData.transactionCount += 1;
      
      switch (bill.type) {
        case 'membership':
          dayData.membershipRevenue += amount;
          break;
        case 'supplement':
          dayData.supplementRevenue += amount;
          break;
        case 'class':
          dayData.classRevenue += amount;
          break;
        default:
          dayData.otherRevenue += amount;
      }
    });
    
    // Calculate growth rate (simplified - would need previous period data)
    const growthRate = 0; // Placeholder for growth calculation
    
    const report: RevenueReport = {
      id: '', // Will be set when saved
      reportType: 'revenue',
      period: request.period,
      startDate,
      endDate,
      totalRevenue,
      membershipRevenue,
      supplementRevenue,
      classRevenue,
      otherRevenue,
      breakdown: Array.from(revenueByDate.values()),
      growthRate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save report to database
    const docRef = await addDoc(collection(db, 'reports'), report);
    return { ...report, id: docRef.id };
    
  } catch (error) {
    console.error('Error generating revenue report:', error);
    throw new Error('Failed to generate revenue report');
  }
};

// Member Report Generation
export const generateMemberReport = async (request: CreateReportRequest): Promise<MemberReport> => {
  try {
    const { startDate, endDate } = getDateRangeForPeriod(request.period, request.startDate, request.endDate);
    
    // Get member data
    const membersQuery = query(collection(db, 'members'));
    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      joinDate: convertTimestamp(doc.data().joinDate),
      lastCheckIn: convertTimestamp(doc.data().lastCheckIn),
      status: doc.data().status || 'active',
      membershipType: doc.data().membershipType || 'basic',
      monthlyFee: doc.data().monthlyFee || 0
    }));
    
    // Calculate member metrics
    const totalMembers = members.length;
    const newMembers = members.filter(member => 
      member.joinDate && member.joinDate >= startDate && member.joinDate <= endDate
    ).length;
    
    const activeMembers = members.filter(member => 
      member.status === 'active' && 
      member.lastCheckIn && 
      member.lastCheckIn >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    ).length;
    
    const inactiveMembers = members.filter(member => member.status === 'inactive').length;
    const cancelledMembers = members.filter(member => member.status === 'cancelled').length;
    
    // Membership type statistics
    const membershipTypeCounts = new Map<string, { count: number; revenue: number }>();
    members.forEach(member => {
      const type = member.membershipType;
      if (!membershipTypeCounts.has(type)) {
        membershipTypeCounts.set(type, { count: 0, revenue: 0 });
      }
      const typeData = membershipTypeCounts.get(type)!;
      typeData.count += 1;
      typeData.revenue += member.monthlyFee;
    });
    
    const membershipTypes = Array.from(membershipTypeCounts.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      revenue: data.revenue,
      percentage: (data.count / totalMembers) * 100
    }));
    
    // Calculate rates (simplified)
    const growthRate = totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0;
    const churnRate = totalMembers > 0 ? (cancelledMembers / totalMembers) * 100 : 0;
    const retentionRate = 100 - churnRate;
    
    const report: MemberReport = {
      id: '',
      reportType: 'member',
      period: request.period,
      startDate,
      endDate,
      totalMembers,
      newMembers,
      activeMembers,
      inactiveMembers,
      cancelledMembers,
      membershipTypes,
      growthRate,
      churnRate,
      retentionRate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'reports'), report);
    return { ...report, id: docRef.id };
    
  } catch (error) {
    console.error('Error generating member report:', error);
    throw new Error('Failed to generate member report');
  }
};

// Attendance Report Generation
export const generateAttendanceReport = async (request: CreateReportRequest): Promise<AttendanceReport> => {
  try {
    const { startDate, endDate } = getDateRangeForPeriod(request.period, request.startDate, request.endDate);
    
    // Get attendance data (assuming we have an attendance collection)
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('checkInTime', '>=', startDate),
      where('checkInTime', '<=', endDate)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceRecords = attendanceSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      checkInTime: convertTimestamp(doc.data().checkInTime),
      memberId: doc.data().memberId || ''
    }));
    
    const totalCheckIns = attendanceRecords.length;
    const uniqueVisitors = new Set(attendanceRecords.map(record => record.memberId)).size;
    const averageVisitsPerMember = uniqueVisitors > 0 ? totalCheckIns / uniqueVisitors : 0;
    
    // Calculate peak hours
    const hourCounts = new Map<number, number>();
    attendanceRecords.forEach(record => {
      if (record.checkInTime) {
        const hour = record.checkInTime.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });
    
    const peakHours = Array.from(hourCounts.entries()).map(([hour, count]) => ({
      hour,
      checkInCount: count,
      percentage: (count / totalCheckIns) * 100
    })).sort((a, b) => b.checkInCount - a.checkInCount);
    
    // Placeholder for popular classes and daily attendance - properly typed
    const popularClasses: import('../../types/reports').PopularClassData[] = [];
    const attendanceByDay: import('../../types/reports').DailyAttendanceData[] = [];
    
    const report: AttendanceReport = {
      id: '',
      reportType: 'attendance',
      period: request.period,
      startDate,
      endDate,
      totalCheckIns,
      uniqueVisitors,
      averageVisitsPerMember,
      peakHours,
      popularClasses,
      attendanceByDay,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'reports'), report);
    return { ...report, id: docRef.id };
    
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw new Error('Failed to generate attendance report');
  }
};

// Get all reports
export const getReports = async (
  reportType?: string,
  limitCount: number = 20
): Promise<Report[]> => {
  try {
    let q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (reportType) {
      q = query(
        collection(db, 'reports'),
        where('reportType', '==', reportType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: convertTimestamp(data.startDate) || new Date(),
        endDate: convertTimestamp(data.endDate) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Report;
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    throw new Error('Failed to get reports');
  }
};

// Get single report
export const getReport = async (id: string): Promise<Report | null> => {
  try {
    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: convertTimestamp(data.startDate) || new Date(),
        endDate: convertTimestamp(data.endDate) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as Report;
    }
    return null;
  } catch (error) {
    console.error('Error getting report:', error);
    throw new Error('Failed to get report');
  }
};

// Delete report
export const deleteReport = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'reports', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw new Error('Failed to delete report');
  }
};

// Generate Dashboard Metrics
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Revenue calculations
    const revenueQuery = query(
      collection(db, 'bills'),
      where('status', '==', 'paid')
    );
    const revenueSnapshot = await getDocs(revenueQuery);
    const paidBills = revenueSnapshot.docs.map(doc => ({
      ...doc.data(),
      dueDate: convertTimestamp(doc.data().dueDate),
      totalAmount: doc.data().totalAmount || 0
    }));
    
    const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const monthlyRevenue = paidBills
      .filter(bill => bill.dueDate && bill.dueDate >= thisMonth)
      .reduce((sum, bill) => sum + bill.totalAmount, 0);
    
    // Member calculations
    const membersSnapshot = await getDocs(collection(db, 'members'));
    const members = membersSnapshot.docs.map(doc => ({
      ...doc.data(),
      joinDate: convertTimestamp(doc.data().joinDate),
      lastCheckIn: convertTimestamp(doc.data().lastCheckIn),
      status: doc.data().status || 'active'
    }));
    
    const totalMembers = members.length;
    const activeMembers = members.filter(member => member.status === 'active').length;
    const newMembersThisMonth = members.filter(member => 
      member.joinDate && member.joinDate >= thisMonth
    ).length;
    
    // Placeholder values for other metrics
    const dashboardMetrics: DashboardMetrics = {
      totalRevenue,
      monthlyRevenue,
      revenueGrowth: 0, // Calculate from previous month data
      totalMembers,
      activeMembers,
      memberGrowth: newMembersThisMonth,
      totalCheckIns: 0, // From attendance data
      todayCheckIns: 0, // From today's attendance
      attendanceGrowth: 0,
      overduePayments: 0, // Count of overdue bills
      totalOverdueAmount: 0, // Sum of overdue amounts
      upcomingRenewals: 0, // Count of memberships expiring soon
      popularClasses: [],
      recentTransactions: [],
      membershipDistribution: [],
      revenueChart: [],
      attendanceChart: []
    };
    
    return dashboardMetrics;
    
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw new Error('Failed to get dashboard metrics');
  }
};

// Scheduled Reports
export const createScheduledReport = async (request: CreateScheduledReportRequest): Promise<string> => {
  try {
    const nextSend = new Date();
    switch (request.frequency) {
      case 'daily':
        nextSend.setDate(nextSend.getDate() + 1);
        break;
      case 'weekly':
        nextSend.setDate(nextSend.getDate() + 7);
        break;
      case 'monthly':
        nextSend.setMonth(nextSend.getMonth() + 1);
        break;
    }
    
    const scheduledReport: Omit<ScheduledReportConfig, 'id'> = {
      reportType: request.reportType,
      frequency: request.frequency,
      recipients: request.recipients,
      isActive: true,
      nextSend,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'scheduledReports'), scheduledReport);
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    throw new Error('Failed to create scheduled report');
  }
};

// Get scheduled reports
export const getScheduledReports = async (): Promise<ScheduledReportConfig[]> => {
  try {
    const q = query(
      collection(db, 'scheduledReports'),
      where('isActive', '==', true),
      orderBy('nextSend')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastSent: convertTimestamp(data.lastSent),
        nextSend: convertTimestamp(data.nextSend) || new Date(),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
      } as ScheduledReportConfig;
    });
  } catch (error) {
    console.error('Error getting scheduled reports:', error);
    throw new Error('Failed to get scheduled reports');
  }
};

// Update scheduled report
export const updateScheduledReport = async (id: string, updates: Partial<ScheduledReportConfig>): Promise<void> => {
  try {
    const docRef = doc(db, 'scheduledReports', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    throw new Error('Failed to update scheduled report');
  }
};

// Cancel scheduled report
export const cancelScheduledReport = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'scheduledReports', id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error cancelling scheduled report:', error);
    throw new Error('Failed to cancel scheduled report');
  }
};