import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../core/firebase';
import type { GymClass, TrainerClass, ClassSession, ClassAttendance, CreateClassRequest } from '../../types/class';
import { logger } from '../../utils/logger';

const CLASSES_COLLECTION = 'gymClasses';
const SESSIONS_COLLECTION = 'classSessions';
const ATTENDANCE_COLLECTION = 'classAttendance';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
};

// ==================== CLASS MANAGEMENT ====================

/**
 * Get all classes assigned to a specific trainer
 */
export const getTrainerClasses = async (trainerId: string): Promise<TrainerClass[]> => {
  logger.debug('Fetching trainer classes', {
    service: 'classService',
    action: 'getTrainerClasses',
    trainerId
  });

  try {
    logger.logFirebaseOperation('query', 'gymClasses', { trainerId });
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('trainerId', '==', trainerId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const classes: TrainerClass[] = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      classes.push({
        id: docSnap.id,
        ...data,
      } as TrainerClass);
    }
    
    // Sort by name client-side to avoid requiring a composite index
    const sortedClasses = classes.sort((a, b) => a.name.localeCompare(b.name));
    
    logger.info('Trainer classes fetched successfully', {
      service: 'classService',
      trainerId,
      count: sortedClasses.length
    });
    
    return sortedClasses;
  } catch (error) {
    logger.error('Failed to fetch trainer classes', error, {
      service: 'classService',
      action: 'getTrainerClasses',
      trainerId
    });
    throw new Error('Failed to fetch classes');
  }
};

/**
 * Get a single class by ID
 */
export const getClassById = async (classId: string): Promise<GymClass | null> => {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as GymClass;
  } catch (error) {
    console.error('Error fetching class:', error);
    throw new Error('Failed to fetch class');
  }
};

/**
 * Get all active classes for members to browse/book
 */
export const getActiveClasses = async (): Promise<GymClass[]> => {
  try {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const classes = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as GymClass[];
    
    // Sort by name client-side to avoid requiring a composite index
    return classes.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching active classes:', error);
    throw new Error('Failed to fetch classes');
  }
};

/**
 * Create a new class
 */
export const createClass = async (classData: CreateClassRequest & { trainerId: string, trainerName: string }): Promise<string> => {
  logger.info('Creating new class', {
    service: 'classService',
    action: 'createClass',
    className: classData.name,
    trainerId: classData.trainerId
  });

  try {
    const newClass = {
      ...classData,
      currentBookings: 0,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    logger.logFirebaseOperation('create', 'gymClasses', {
      className: classData.name,
      trainerId: classData.trainerId
    });
    
    const docRef = await addDoc(collection(db, CLASSES_COLLECTION), newClass);
    
    logger.info('Class created successfully', {
      service: 'classService',
      classId: docRef.id,
      className: classData.name
    });
    
    return docRef.id;
  } catch (error) {
    logger.error('Failed to create class', error, {
      service: 'classService',
      action: 'createClass',
      className: classData.name
    });
    throw new Error('Failed to create class');
  }
};

/**
 * Update an existing class
 */
export const updateClass = async (classId: string, updates: Partial<GymClass>): Promise<void> => {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating class:', error);
    throw new Error('Failed to update class');
  }
};

/**
 * Delete a class (soft delete - mark as inactive)
 */
export const deleteClass = async (classId: string): Promise<void> => {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    throw new Error('Failed to delete class');
  }
};

// ==================== CLASS SESSIONS ====================

/**
 * Create a new class session
 */
export const createClassSession = async (sessionData: Omit<ClassSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const newSession = {
      ...sessionData,
      date: typeof sessionData.date === 'string' ? Timestamp.fromDate(new Date(sessionData.date)) : Timestamp.fromDate(sessionData.date),
      attendees: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), newSession);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Get upcoming sessions for a trainer
 */
export const getTrainerUpcomingSessions = async (trainerId: string): Promise<ClassSession[]> => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('trainerId', '==', trainerId),
      where('date', '>=', now),
      where('status', 'in', ['scheduled', 'in-progress']),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: convertTimestamp(doc.data().date),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    } as ClassSession));
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    throw new Error('Failed to fetch upcoming sessions');
  }
};

/**
 * Get sessions for a specific class
 */
export const getClassSessions = async (classId: string): Promise<ClassSession[]> => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('classId', '==', classId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: convertTimestamp(doc.data().date),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    } as ClassSession));
  } catch (error) {
    console.error('Error fetching class sessions:', error);
    throw new Error('Failed to fetch class sessions');
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (sessionId: string, status: ClassSession['status']): Promise<void> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    throw new Error('Failed to update session status');
  }
};

// ==================== ATTENDANCE ====================

/**
 * Mark attendance for a member in a session
 */
export const markAttendance = async (attendanceData: Omit<ClassAttendance, 'id'>): Promise<string> => {
  try {
    const newAttendance = {
      ...attendanceData,
      checkedInAt: attendanceData.checkedInAt ? Timestamp.fromDate(new Date(attendanceData.checkedInAt)) : Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), newAttendance);
    
    // Update session attendees list
    if (attendanceData.status === 'present') {
      const sessionRef = doc(db, SESSIONS_COLLECTION, attendanceData.sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const currentAttendees = sessionSnap.data().attendees || [];
        if (!currentAttendees.includes(attendanceData.memberId)) {
          await updateDoc(sessionRef, {
            attendees: [...currentAttendees, attendanceData.memberId],
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw new Error('Failed to mark attendance');
  }
};

/**
 * Get attendance for a specific session
 */
export const getSessionAttendance = async (sessionId: string): Promise<ClassAttendance[]> => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      checkedInAt: doc.data().checkedInAt ? convertTimestamp(doc.data().checkedInAt) : undefined,
    } as ClassAttendance));
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    throw new Error('Failed to fetch session attendance');
  }
};

/**
 * Update attendance status
 */
export const updateAttendance = async (attendanceId: string, updates: Partial<ClassAttendance>): Promise<void> => {
  try {
    const docRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw new Error('Failed to update attendance');
  }
};

/**
 * Bulk mark attendance for multiple members
 */
export const bulkMarkAttendance = async (sessionId: string, attendanceList: Omit<ClassAttendance, 'id' | 'sessionId'>[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const presentMembers: string[] = [];
    
    attendanceList.forEach((attendance) => {
      const attendanceRef = doc(collection(db, ATTENDANCE_COLLECTION));
      batch.set(attendanceRef, {
        ...attendance,
        sessionId,
        checkedInAt: Timestamp.now(),
      });
      
      if (attendance.status === 'present') {
        presentMembers.push(attendance.memberId);
      }
    });
    
    // Update session attendees
    batch.update(sessionRef, {
      attendees: presentMembers,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    throw new Error('Failed to bulk mark attendance');
  }
};
