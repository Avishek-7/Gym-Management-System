import { getMembers } from "../member/memberService";
import { getAllBills, getPendingBills } from "../billing/billService";
import { db } from "../core/firebase";
import { collection, getDocs } from "firebase/firestore";

interface FirestoreUser {
  id: string;
  role?: string;
  status?: string;
  email?: string;
  displayName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  revenue: number;
  pendingBills: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  members: number;
}

export interface MembershipDistribution {
  name: string;
  value: number;
  color: string;
}

export interface PaymentStatusData {
  status: string;
  count: number;
  color: string;
}

/**
 * Get users from the users collection (where your actual admin/member data is stored)
 */
const getUsersFromFirestore = async (): Promise<FirestoreUser[]> => {
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Fetch dashboard statistics from Firebase
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Try to fetch from users collection first (where your admin/member are)
    const users = await getUsersFromFirestore();
    console.log("Users from Firestore:", users); // Debug log
    console.log("User roles found:", users.map(u => ({ id: u.id, role: u.role, status: u.status }))); // Debug log
    
    // Count total members (exclude admin role)
    const totalMembers = users.filter(user => 
      user.role === 'member' || user.role === 'trainer'
    ).length;
    
    // Count active members (those with active status or no status field means active)
    const activeMembers = users.filter(user => 
      (user.role === 'member' || user.role === 'trainer') &&
      (!user.status || user.status === 'active')
    ).length;

    console.log(`Found ${totalMembers} total members, ${activeMembers} active members`); // Debug log

    // If no users found, try the members collection as fallback
    if (users.length === 0) {
      const members = await getMembers();
      console.log("Members from members collection:", members); // Debug log
      const totalMembersFromCol = members.length;
      const activeMembersFromCol = members.filter(member => 
        member.status === 'active'
      ).length;
      
      // Use members collection data if available
      if (members.length > 0) {
        const bills = await getAllBills();
        const pendingBills = await getPendingBills();
        
        const revenue = bills
          .filter(bill => bill.status === 'paid')
          .reduce((total, bill) => total + (bill.totalAmount || bill.amount || 0), 0);

        return {
          totalMembers: totalMembersFromCol,
          activeMembers: activeMembersFromCol,
          revenue,
          pendingBills: pendingBills.length,
        };
      }
    }

    // Fetch all bills to calculate revenue and pending bills
    const bills = await getAllBills();
    const pendingBills = await getPendingBills();
    
    // Calculate total revenue from paid bills
    const revenue = bills
      .filter(bill => bill.status === 'paid')
      .reduce((total, bill) => total + (bill.totalAmount || bill.amount || 0), 0);

    return {
      totalMembers,
      activeMembers,
      revenue,
      pendingBills: pendingBills.length,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return default values on error
    return {
      totalMembers: 0,
      activeMembers: 0,
      revenue: 0,
      pendingBills: 0,
    };
  }
};

/**
 * Get revenue data for the last 6 months
 */
export const getRevenueData = async (): Promise<RevenueData[]> => {
  try {
    const bills = await getAllBills();
    const members = await getMembers();
    
    // Get last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date,
        name: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }

    // Calculate revenue and member count for each month
    const revenueData = months.map(month => {
      const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
      const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

      // Filter paid bills for this month
      const monthBills = bills.filter(bill => {
        const billDate = bill.paidAt ? new Date(bill.paidAt) : new Date(bill.createdAt);        
        return bill.status === 'paid' && 
               billDate >= monthStart && 
               billDate <= monthEnd;
      });

      const monthRevenue = monthBills.reduce((total, bill) => 
        total + (bill.totalAmount || bill.amount || 0), 0
      );

      // Count members registered up to this month
      const membersUpToMonth = members.filter(member => {
        const memberDate = new Date(member.createdAt);
        return memberDate <= monthEnd;
      }).length;

      return {
        month: month.name,
        revenue: monthRevenue,
        members: membersUpToMonth
      };
    });

    return revenueData;
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return [];
  }
};

/**
 * Get membership type distribution
 */
export const getMembershipDistribution = async (): Promise<MembershipDistribution[]> => {
  try {
    const members = await getMembers();
    
    // Count members by membership type
    // For now, create a mock distribution since membershipType isn't in the Member interface
    // In a real app, you'd fetch membership details from a memberships collection
    const distribution = {
      'Basic': Math.floor(members.length * 0.4),
      'Premium': Math.floor(members.length * 0.35),
      'VIP': Math.floor(members.length * 0.25)
    };

    // Convert to array with colors
    const colors = {
      'Basic': '#3b82f6',
      'Premium': '#8b5cf6',
      'VIP': '#ec4899',
      'Standard': '#10b981',
      'Pro': '#f59e0b'
    };

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors] || '#6b7280'
    }));
  } catch (error) {
    console.error("Error fetching membership distribution:", error);
    return [];
  }
};

/**
 * Get payment status distribution
 */
export const getPaymentStatusData = async (): Promise<PaymentStatusData[]> => {
  try {
    const bills = await getAllBills();
    
    // Count bills by status
    const statusCount = bills.reduce((acc, bill) => {
      const status = bill.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array with colors
    const statusColors = {
      'paid': '#10b981',
      'pending': '#f59e0b',
      'overdue': '#ef4444',
      'cancelled': '#6b7280'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: statusColors[status as keyof typeof statusColors] || '#6b7280'
    }));
  } catch (error) {
    console.error("Error fetching payment status data:", error);
    return [];
  }
};

/**
 * Get weekly activity data (mock data for now - would need check-in collection)
 */
export const getWeeklyActivityData = async () => {
  // This would require a check-ins or activity collection in Firebase
  // For now, return mock data that could be replaced with real data later
  try {
    // In a real implementation, you might have:
    // const checkinsCol = collection(db, "checkins");
    // const thisWeekQuery = query(checkinsCol, where("date", ">=", weekStart));
    
    return [
      { day: 'Mon', checkins: 145 },
      { day: 'Tue', checkins: 168 },
      { day: 'Wed', checkins: 152 },
      { day: 'Thu', checkins: 178 },
      { day: 'Fri', checkins: 190 },
      { day: 'Sat', checkins: 210 },
      { day: 'Sun', checkins: 185 },
    ];
  } catch (error) {
    console.error("Error fetching weekly activity data:", error);
    return [];
  }
};

/**
 * Get recent activities/events for the dashboard
 */
export const getRecentActivities = async () => {
  try {
    const bills = await getAllBills();
    const members = await getMembers();
    
    // Get recent bills (last 10)
    const recentBills = bills
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);

    // Get recent members (last 5)
    const recentMembers = members
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    return {
      recentBills,
      recentMembers
    };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return {
      recentBills: [],
      recentMembers: []
    };
  }
};