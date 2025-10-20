import { db } from "../core/firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * User Profile Service
 * Handles user profile creation and management in Firestore
 */

export interface CreateUserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Create a user profile document in Firestore
 * This is called after successful registration
 */
export const createUserProfile = async (
  userId: string,
  profileData: CreateUserProfileData
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    
    // Check if profile already exists
    const existingDoc = await getDoc(userDocRef);
    if (existingDoc.exists()) {
      console.log("User profile already exists");
      return;
    }

    // Create user profile document
    await setDoc(userDocRef, {
      id: userId,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
      status: 'active',
      joinDate: new Date(),
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("User profile created successfully:", userId);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<CreateUserProfileData>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update user profile");
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
};
