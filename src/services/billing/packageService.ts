import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../core/firebase';
import type { FeePackage, CreateFeePackageRequest, UpdateFeePackageRequest } from '../../types/package';

const PACKAGES_COLLECTION = 'packages';

// Utility to strip undefined values so Firestore doesn't reject the write
const omitUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned as T;
};

/**
 * Create a new fee package
 */
export const createFeePackage = async (packageData: CreateFeePackageRequest): Promise<string> => {
  try {
    const packagesRef = collection(db, PACKAGES_COLLECTION);
    // Ensure we don't send undefined fields (e.g., maxMembers)
    const payload = omitUndefined({
      ...packageData,
      features: packageData.features ?? [],
      isActive: true,
      currentMembers: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docRef = await addDoc(packagesRef, payload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating fee package:', error);
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      throw new Error('Permission denied: your account cannot create packages. Ensure your user has role "admin" and Firestore rules allow admins to write to packages.');
    }
    throw new Error('Failed to create fee package');
  }
};

/**
 * Get all fee packages
 */
export const getFeePackages = async (activeOnly: boolean = false): Promise<FeePackage[]> => {
  try {
    const packagesRef = collection(db, PACKAGES_COLLECTION);
    let q = query(packagesRef);
    
    if (activeOnly) {
      q = query(packagesRef, where('isActive', '==', true));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        features: data.features || [],
        isActive: data.isActive ?? true,
        category: data.category || 'basic',
        maxMembers: data.maxMembers,
        currentMembers: data.currentMembers || 0,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as FeePackage;
    });
  } catch (error) {
    // Be resilient in UI: return empty list on permission or transient errors.
    // If permission denied, downgrade to a one-time warning to avoid noisy logs.
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      if (!(globalThis as unknown as { __pkgPermWarnLogged?: boolean }).__pkgPermWarnLogged) {
        console.warn('Fee packages read denied by Firestore rules. Returning empty list to keep UI responsive.');
        (globalThis as unknown as { __pkgPermWarnLogged?: boolean }).__pkgPermWarnLogged = true;
      }
    } else {
      console.error('Error fetching fee packages:', error);
    }
    return [] as FeePackage[];
  }
};

/**
 * Get a single fee package by ID
 */
export const getFeePackageById = async (packageId: string): Promise<FeePackage | null> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageSnap = await getDoc(packageRef);
    
    if (!packageSnap.exists()) {
      return null;
    }
    
    const data = packageSnap.data();
    return {
      id: packageSnap.id,
      name: data.name,
      description: data.description,
      duration: data.duration,
      price: data.price,
      features: data.features || [],
      isActive: data.isActive ?? true,
      category: data.category || 'basic',
      maxMembers: data.maxMembers,
      currentMembers: data.currentMembers || 0,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as FeePackage;
  } catch (error) {
    console.error('Error fetching fee package:', error);
    throw new Error('Failed to fetch fee package');
  }
};

/**
 * Update a fee package
 */
export const updateFeePackage = async (
  packageId: string,
  updates: UpdateFeePackageRequest
): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    // Remove undefined fields to avoid Firestore errors
    const payload = omitUndefined({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(packageRef, payload);
  } catch (error) {
    console.error('Error updating fee package:', error);
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      throw new Error('Permission denied: your account cannot update packages. Ensure your user has role "admin" and Firestore rules allow admins to write to packages.');
    }
    throw new Error('Failed to update fee package');
  }
};

/**
 * Delete a fee package
 */
export const deleteFeePackage = async (packageId: string): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    await deleteDoc(packageRef);
  } catch (error) {
    console.error('Error deleting fee package:', error);
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      throw new Error('Permission denied: your account cannot delete packages. Ensure your user has role "admin" and Firestore rules allow admins to write to packages.');
    }
    throw new Error('Failed to delete fee package');
  }
};

/**
 * Increment current members count for a package
 */
export const incrementPackageMembers = async (packageId: string): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageSnap = await getDoc(packageRef);
    
    if (packageSnap.exists()) {
      const currentMembers = packageSnap.data().currentMembers || 0;
      await updateDoc(packageRef, {
        currentMembers: currentMembers + 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error incrementing package members:', error);
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      throw new Error('Permission denied: cannot update package member count. Ensure admin write access to packages in Firestore rules.');
    }
    throw new Error('Failed to increment package members');
  }
};

/**
 * Decrement current members count for a package
 */
export const decrementPackageMembers = async (packageId: string): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageSnap = await getDoc(packageRef);
    
    if (packageSnap.exists()) {
      const currentMembers = packageSnap.data().currentMembers || 0;
      await updateDoc(packageRef, {
        currentMembers: Math.max(0, currentMembers - 1),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error decrementing package members:', error);
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'permission-denied') {
      throw new Error('Permission denied: cannot update package member count. Ensure admin write access to packages in Firestore rules.');
    }
    throw new Error('Failed to decrement package members');
  }
};

/**
 * Check if a package has reached its member limit
 */
export const isPackageFull = async (packageId: string): Promise<boolean> => {
  try {
    const feePackage = await getFeePackageById(packageId);
    if (!feePackage) return true;
    
    if (feePackage.maxMembers === undefined) return false;
    
    return feePackage.currentMembers >= feePackage.maxMembers;
  } catch (error) {
    console.error('Error checking package capacity:', error);
    return true; // Fail safe - assume full if error
  }
};
