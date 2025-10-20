import { getDashboardStats } from '../src/services/admin/analyticsService';

// Test the analytics service
async function testAnalytics() {
  console.log('Testing analytics service...');
  
  try {
    const stats = await getDashboardStats();
    console.log('Dashboard Stats:', stats);
  } catch (error) {
    console.error('Error testing analytics:', error);
  }
}

// Run the test
testAnalytics();