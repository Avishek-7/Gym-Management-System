import { auth } from "../core/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { logger } from "../../utils/logger";


// Register a new User
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  logger.info('User registration started', { 
    service: 'authService',
    action: 'registerUser',
    email,
    displayName 
  });

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (auth.currentUser) {
      // update display name 
      await updateProfile(auth.currentUser, { displayName });
      logger.info('User profile updated', { 
        userId: auth.currentUser.uid,
        displayName 
      });
    }
    
    logger.logAuth('register', userCredential.user.uid, { 
      email,
      displayName 
    });
    
    return userCredential.user;
  } catch (error) {
    logger.error('User registration failed', error, { 
      service: 'authService',
      action: 'registerUser',
      email 
    });
    throw error;
  }
}

// Login existing user 
export async function loginUser(email: string, password: string): Promise<User> {
  logger.info('User login attempt', { 
    service: 'authService',
    action: 'loginUser',
    email 
  });

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    logger.logAuth('login', userCredential.user.uid, { 
      email,
      userEmail: userCredential.user.email || undefined
    });
    
    return userCredential.user;
  } catch (error) {
    logger.logAuth('failed', undefined, { 
      email,
      reason: 'Invalid credentials'
    });
    logger.error('User login failed', error, { 
      service: 'authService',
      action: 'loginUser',
      email 
    });
    throw error;
  }
}

// Logout current user 
export async function logoutUser(): Promise<void> {
  const userId = auth.currentUser?.uid;
  const email = auth.currentUser?.email;
  
  logger.info('User logout started', { 
    service: 'authService',
    action: 'logoutUser',
    userId,
    email: email || undefined
  });

  try {
    await signOut(auth);
    
    logger.logAuth('logout', userId, { 
      email: email || undefined
    });
  } catch (error) {
    logger.error('User logout failed', error, { 
      service: 'authService',
      action: 'logoutUser',
      userId 
    });
    throw error;
  }
}

// Send password reset email 
export async function resetPassword(email: string): Promise<void> {
  logger.info('Password reset requested', { 
    service: 'authService',
    action: 'resetPassword',
    email 
  });

  try {
    await sendPasswordResetEmail(auth, email);
    
    logger.info('Password reset email sent', { 
      service: 'authService',
      email 
    });
  } catch (error) {
    logger.error('Password reset failed', error, { 
      service: 'authService',
      action: 'resetPassword',
      email 
    });
    throw error;
  }
}

// Get current logged-in user 
export async function getCurrentUser(): Promise<User | null> {
  const user = auth.currentUser;
  
  if (user) {
    logger.debug('Current user retrieved', { 
      service: 'authService',
      action: 'getCurrentUser',
      userId: user.uid,
      email: user.email || undefined
    });
  }
  
  return user;
}

