// Reports and Analytics Types

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  membershipType?: string;
  status?: string;
  location?: string;
  category?: string;
}

export interface RevenueReport {
  id: string;
  reportType: 'revenue';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  membershipRevenue: number;
  supplementRevenue: number;
  classRevenue: number;
  otherRevenue: number;
  breakdown: RevenueBreakdown[];
  growthRate: number; // Percentage growth from previous period
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueBreakdown {
  date: Date;
  membershipRevenue: number;
  supplementRevenue: number;
  classRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  transactionCount: number;
}

export interface MemberReport {
  id: string;
  reportType: 'member';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  cancelledMembers: number;
  membershipTypes: MembershipTypeStats[];
  growthRate: number;
  churnRate: number;
  retentionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipTypeStats {
  type: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface AttendanceReport {
  id: string;
  reportType: 'attendance';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalCheckIns: number;
  uniqueVisitors: number;
  averageVisitsPerMember: number;
  peakHours: PeakHoursData[];
  popularClasses: PopularClassData[];
  attendanceByDay: DailyAttendanceData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PeakHoursData {
  hour: number;
  checkInCount: number;
  percentage: number;
}

export interface PopularClassData {
  classId: string;
  className: string;
  attendanceCount: number;
  averageRating: number;
  instructorName: string;
}

export interface DailyAttendanceData {
  date: Date;
  checkInCount: number;
  uniqueVisitors: number;
  classAttendance: number;
}

export interface FinancialReport {
  id: string;
  reportType: 'financial';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  incomeBreakdown: IncomeBreakdown;
  expenseBreakdown: ExpenseBreakdown;
  monthlyTrend: MonthlyTrendData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeBreakdown {
  memberships: number;
  supplements: number;
  classes: number;
  personalTraining: number;
  other: number;
}

export interface ExpenseBreakdown {
  salaries: number;
  rent: number;
  utilities: number;
  equipment: number;
  maintenance: number;
  marketing: number;
  other: number;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface ClassReport {
  id: string;
  reportType: 'class';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalClasses: number;
  totalAttendance: number;
  averageAttendancePerClass: number;
  mostPopularClasses: PopularClassData[];
  instructorPerformance: InstructorPerformanceData[];
  classUtilization: ClassUtilizationData[];
  revenueByClass: ClassRevenueData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorPerformanceData {
  instructorId: string;
  instructorName: string;
  classesHeld: number;
  totalAttendance: number;
  averageRating: number;
  revenue: number;
}

export interface ClassUtilizationData {
  classId: string;
  className: string;
  capacity: number;
  averageAttendance: number;
  utilizationRate: number;
}

export interface ClassRevenueData {
  classId: string;
  className: string;
  revenue: number;
  attendanceCount: number;
  revenuePerAttendee: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalMembers: number;
  activeMembers: number;
  memberGrowth: number;
  totalCheckIns: number;
  todayCheckIns: number;
  attendanceGrowth: number;
  overduePayments: number;
  totalOverdueAmount: number;
  upcomingRenewals: number;
  popularClasses: PopularClassData[];
  recentTransactions: RecentTransactionData[];
  membershipDistribution: MembershipTypeStats[];
  revenueChart: RevenueChartData[];
  attendanceChart: AttendanceChartData[];
}

export interface RecentTransactionData {
  id: string;
  memberName: string;
  type: 'membership' | 'supplement' | 'class' | 'other';
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  membershipRevenue: number;
  supplementRevenue: number;
  classRevenue: number;
}

export interface AttendanceChartData {
  date: string;
  checkIns: number;
  uniqueVisitors: number;
  classAttendance: number;
}

// Export Data Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeDetails: boolean;
  email?: string; // Email address to send report
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

// Report Generation Requests
export interface CreateReportRequest {
  reportType: 'revenue' | 'member' | 'attendance' | 'financial' | 'class';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  filters?: ReportFilter;
}

export interface ScheduledReportConfig {
  id: string;
  reportType: 'revenue' | 'member' | 'attendance' | 'financial' | 'class';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[]; // Email addresses
  isActive: boolean;
  lastSent?: Date;
  nextSend: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledReportRequest {
  reportType: 'revenue' | 'member' | 'attendance' | 'financial' | 'class';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
}

// Analytics Types
export interface AnalyticsQuery {
  metric: string;
  dimensions?: string[];
  filters?: Record<string, unknown>;
  dateRange: {
    start: Date;
    end: Date;
  };
  groupBy?: 'day' | 'week' | 'month';
}

export interface AnalyticsResult {
  metric: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  data: AnalyticsDataPoint[];
}

export interface AnalyticsDataPoint {
  date: Date;
  value: number;
  dimensions?: Record<string, string>;
}

// Report Types Union
export type Report = RevenueReport | MemberReport | AttendanceReport | FinancialReport | ClassReport;
