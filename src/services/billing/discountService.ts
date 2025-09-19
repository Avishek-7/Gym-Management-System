import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import type { Discount, CreateDiscountRequest } from "../../types/billing";

const discountsCol = collection(db, "discounts");

// CREATE
export const createDiscount = async (discount: CreateDiscountRequest): Promise<string> => {
    try {
        const discountData = {
            ...discount,
            currentUsage: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const docRef = await addDoc(discountsCol, discountData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating discount:", error);
        throw error;
    }
};

// READ ALL
export const getDiscounts = async (): Promise<Discount[]> => {
    try {
        const q = query(discountsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Discount, id: doc.id }));
    } catch (error) {
        console.error("Error fetching discounts:", error);
        throw error;
    }
};

// READ ACTIVE DISCOUNTS
export const getActiveDiscounts = async (): Promise<Discount[]> => {
    try {
        const currentDate = new Date();
        const q = query(
            discountsCol,
            where("isActive", "==", true),
            where("validFrom", "<=", currentDate),
            where("validUntil", ">=", currentDate)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Discount, id: doc.id }));
    } catch (error) {
        console.error("Error fetching active discounts:", error);
        throw error;
    }
};

// READ BY CODE
export const getDiscountByCode = async (code: string): Promise<Discount | null> => {
    try {
        const q = query(discountsCol, where("code", "==", code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docData = snapshot.docs[0];
        return { ...docData.data() as Discount, id: docData.id };
    } catch (error) {
        console.error("Error fetching discount by code:", error);
        throw error;
    }
};

// UPDATE
export const updateDiscount = async (discountId: string, updateFields: Partial<Discount>): Promise<void> => {
    try {
        await updateDoc(doc(db, "discounts", discountId), {
            ...updateFields,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating discount:", error);
        throw error;
    }
};

// DELETE
export const deleteDiscount = async (discountId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "discounts", discountId));
    } catch (error) {
        console.error("Error deleting discount:", error);
        throw error;
    }
};

// BUSINESS LOGIC FUNCTIONS

// Validate coupon/discount code
export const validateCoupon = async (code: string, membershipId: string): Promise<{
    valid: boolean;
    discount?: Discount;
    reason?: string;
}> => {
    try {
        const discount = await getDiscountByCode(code);
        
        if (!discount) {
            return { valid: false, reason: "Invalid coupon code" };
        }
        
        if (!discount.isActive) {
            return { valid: false, reason: "Coupon is inactive" };
        }
        
        const currentDate = new Date();
        if (currentDate < discount.validFrom || currentDate > discount.validUntil) {
            return { valid: false, reason: "Coupon has expired or not yet valid" };
        }
        
        if (discount.maxUsage && discount.currentUsage >= discount.maxUsage) {
            return { valid: false, reason: "Coupon usage limit exceeded" };
        }
        
        if (discount.applicableToMemberships.length > 0 && 
            !discount.applicableToMemberships.includes(membershipId)) {
            return { valid: false, reason: "Coupon not applicable to this membership" };
        }
        
        return { valid: true, discount };
    } catch (error) {
        console.error("Error validating coupon:", error);
        return { valid: false, reason: "Error validating coupon" };
    }
};

// Apply discount (increment usage)
export const applyDiscount = async (discountId: string): Promise<void> => {
    try {
        const discounts = await getDocs(query(discountsCol, where("id", "==", discountId)));
        if (!discounts.empty) {
            const discountData = discounts.docs[0].data() as Discount;
            await updateDiscount(discountId, {
                currentUsage: discountData.currentUsage + 1
            });
        }
    } catch (error) {
        console.error("Error applying discount:", error);
        throw error;
    }
};

// Calculate discount amount
export const calculateDiscountAmount = (discount: Discount, originalAmount: number): number => {
    if (discount.type === 'percentage') {
        return (originalAmount * discount.value) / 100;
    } else {
        return Math.min(discount.value, originalAmount); // Don't exceed original amount
    }
};

// Deactivate discount
export const deactivateDiscount = async (discountId: string): Promise<void> => {
    await updateDiscount(discountId, { isActive: false });
};

// Activate discount
export const activateDiscount = async (discountId: string): Promise<void> => {
    await updateDiscount(discountId, { isActive: true });
};

// Expire discount
export const expireDiscount = async (discountId: string): Promise<void> => {
    await updateDiscount(discountId, { 
        validUntil: new Date(), 
        isActive: false 
    });
};

// Get expired discounts
export const getExpiredDiscounts = async (): Promise<Discount[]> => {
    try {
        const currentDate = new Date();
        const q = query(
            discountsCol,
            where("validUntil", "<", currentDate)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Discount, id: doc.id }));
    } catch (error) {
        console.error("Error fetching expired discounts:", error);
        throw error;
    }
};

// Get discounts by membership
export const getDiscountsForMembership = async (membershipId: string): Promise<Discount[]> => {
    try {
        const q = query(
            discountsCol,
            where("applicableToMemberships", "array-contains", membershipId),
            where("isActive", "==", true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Discount, id: doc.id }));
    } catch (error) {
        console.error("Error fetching discounts for membership:", error);
        throw error;
    }
};

// Cleanup expired discounts (mark as inactive)
export const cleanupExpiredDiscounts = async (): Promise<number> => {
    try {
        const expiredDiscounts = await getExpiredDiscounts();
        let cleaned = 0;
        
        for (const discount of expiredDiscounts) {
            if (discount.isActive) {
                await deactivateDiscount(discount.id);
                cleaned++;
            }
        }
        
        return cleaned;
    } catch (error) {
        console.error("Error cleaning up expired discounts:", error);
        throw error;
    }
};