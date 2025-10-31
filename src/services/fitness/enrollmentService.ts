import { collection, getDocs, query, where, Timestamp, doc, increment, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../core/firebase';
import type { GymClass, ClassEnrollment } from '../../types/class';

const ENROLLMENTS_COLLECTION = 'classEnrollments';
const CLASSES_COLLECTION = 'gymClasses';

export interface EnrollToClassParams {
  classId: string;
  userId?: string;
  memberId?: string;
}

// Enroll a user or member to a class and increment booking count
export const enrollToClass = async ({ classId, userId, memberId }: EnrollToClassParams): Promise<string> => {
  if (!userId && !memberId) {
    throw new Error('Either userId or memberId is required to enroll.');
  }
  const now = Timestamp.now();

  // Use a batch to ensure both writes happen atomically
  const batch = writeBatch(db);
  const enrollmentRef = doc(collection(db, ENROLLMENTS_COLLECTION));
  batch.set(enrollmentRef, {
    classId,
    ...(userId ? { userId } : {}),
    ...(memberId ? { memberId } : {}),
    enrolledAt: now,
    status: 'active' as const,
  });

  const classRef = doc(db, CLASSES_COLLECTION, classId);
  batch.update(classRef, { currentBookings: increment(1), updatedAt: now });

  await batch.commit();
  return enrollmentRef.id;
};

export const unenrollFromClass = async (enrollmentId: string, classId: string): Promise<void> => {
  const now = Timestamp.now();
  const batch = writeBatch(db);
  const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
  batch.update(enrollmentRef, { status: 'cancelled', updatedAt: now });

  const classRef = doc(db, CLASSES_COLLECTION, classId);
  batch.update(classRef, { currentBookings: increment(-1), updatedAt: now });

  await batch.commit();
};

export const getEnrolledClassesForUser = async (userId: string): Promise<GymClass[]> => {
  const q = query(
    collection(db, ENROLLMENTS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];

  // Fetch each class document
  const classes: GymClass[] = [];
  for (const docSnap of snap.docs) {
    const classId = docSnap.data().classId;
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      classes.push({ id: classDoc.id, ...(classDoc.data() as Omit<GymClass, 'id'>) });
    }
  }
  return classes;
};

export const getClassMembers = async (classId: string): Promise<ClassEnrollment[]> => {
  const q = query(
    collection(db, ENROLLMENTS_COLLECTION),
    where('classId', '==', classId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassEnrollment, 'id'>) }));
};
