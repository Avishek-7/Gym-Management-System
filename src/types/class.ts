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