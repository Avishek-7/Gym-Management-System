export interface GymClass {
  id: string;
  name: string;
  instructor: string;
  description?: string;
  duration: number; // in minutes
  capacity: number;
  currentBookings: number;
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }[];
  isActive: boolean;
}

export interface CreateClassRequest {
  name: string;
  instructor: string;
  description?: string;
  duration: number;
  capacity: number;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface ClassBooking {
  id: string;
  classId: string;
  memberId: string;
  bookingDate: string;
  status: 'booked' | 'attended' | 'cancelled';
}

export interface ClassSession {
  id: string;
  classId: string;
  trainerId: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  attendees: string[]; // member IDs who attended
  maxCapacity: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ClassAttendance {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  status: 'present' | 'absent' | 'late';
  checkedInAt?: Date | string;
  notes?: string;
}

export interface TrainerClass extends GymClass {
  trainerId: string;
  trainerName: string;
  upcomingSessions?: ClassSession[];
  totalSessions?: number;
  averageAttendance?: number;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  userId?: string; // Firebase Auth UID when available
  memberId?: string; // Fallback to member doc id if no user account
  enrolledAt: Date | string;
  status: 'active' | 'cancelled';
}