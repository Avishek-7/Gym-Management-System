// Reports and Analytics Module Exports

// Types
export type {
  Report,
  RevenueReport,
  MemberReport,
  AttendanceReport,
  FinancialReport,
  ClassReport,
  CreateReportRequest,
  DashboardMetrics,
  ScheduledReportConfig,
  CreateScheduledReportRequest,
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsDataPoint,
  ExportOptions,
  ExportResult,
  ReportFilter,
  RevenueBreakdown,
  MembershipTypeStats,
  PeakHoursData,
  PopularClassData,
  DailyAttendanceData,
  InstructorPerformanceData,
  ClassUtilizationData,
  ClassRevenueData,
  RecentTransactionData,
  RevenueChartData,
  AttendanceChartData
} from '../../types/reports';

// Report Service
export {
  generateRevenueReport,
  generateMemberReport,
  generateAttendanceReport,
  getReports,
  getReport,
  deleteReport,
  getDashboardMetrics,
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  cancelScheduledReport
} from './reportService';

// Analytics Service
export {
  executeAnalyticsQuery,
  getPopularAnalyticsQueries,
  compareMetrics,
  getRealTimeAnalytics
} from './analyticsService';

// Export Service
export {
  ExportService
} from './exportService';