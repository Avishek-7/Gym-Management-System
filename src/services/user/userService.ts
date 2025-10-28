import { db } from '../core/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc 
} from 'firebase/firestore';

export interface FirebaseUser {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member' | 'trainer';
  createdAt?: Date;
}

/**
 * Fetch all users from userRoles collection and get their emails from userProfiles
 */
export async function getAllUsers(): Promise<FirebaseUser[]> {
  try {
    const usersRef = collection(db, 'userRoles');
    const snapshot = await getDocs(usersRef);
    
    // Fetch user profiles in parallel to get emails
    const usersPromises = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const userId = docSnapshot.id;
      
      // Try to get email from userProfiles collection if not in userRoles
      let email = data.email || '';
      let displayName = data.displayName || '';
      
      if (!email) {
        try {
          const profileRef = doc(db, 'userProfiles', userId);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            email = profileData.email || '';
            displayName = profileData.firstName && profileData.lastName 
              ? `${profileData.firstName} ${profileData.lastName}`
              : profileData.firstName || profileData.lastName || '';
          }
        } catch {
          console.log(`Could not fetch profile for user ${userId}`);
        }
      }
      
      return {
        id: userId,
        email: email || `User ${userId.substring(0, 8)}`,
        displayName: displayName || email || `User ${userId.substring(0, 8)}`,
        role: data.role || 'member',
        createdAt: data.createdAt?.toDate(),
      };
    });
    
    const users = await Promise.all(usersPromises);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: 'admin' | 'member' | 'trainer'): Promise<FirebaseUser[]> {
  try {
    const usersRef = collection(db, 'userRoles');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email || '',
      role: doc.data().role || 'member',
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<FirebaseUser | null> {
  try {
    const userRef = doc(db, 'userRoles', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      id: userDoc.id,
      email: userDoc.data().email || '',
      role: userDoc.data().role || 'member',
      createdAt: userDoc.data().createdAt?.toDate(),
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if a user already has a member profile
 */
export async function checkUserHasMemberProfile(userId: string): Promise<boolean> {
  try {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking member profile:', error);
    throw error;
  }
}
