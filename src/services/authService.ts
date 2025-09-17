import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";


// Register a new User
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    // update display name 
    await updateProfile(auth.currentUser, { displayName });
  }
  return userCredential.user;
}

// Login existing user 
export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Logout current user 
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Send password reset email 
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Get current logged-in user 
export async function getCurrentUser(): Promise<User | null> {
  return auth.currentUser;
}

