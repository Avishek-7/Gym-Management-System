import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import type { Subscription } from "../../types/subscription";

const subscriptionsCol = collection(db, "subscriptions");

export const createSubscription = async (subscription: Omit<Subscription, "id">): Promise<string> => {
    try {
        const docRef = await addDoc(subscriptionsCol, subscription);
        return docRef.id;
    } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
    }
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
    try {
        const snapshot = await getDocs(subscriptionsCol);
        const subscriptions: Subscription[] = [];
        snapshot.forEach((doc) => {
            subscriptions.push({ ...doc.data() as Subscription, id: doc.id });
        });
        return subscriptions;
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        throw error;
    }
};

export const updateSubscription = async (subscriptionId: string, updateFields: Partial<Subscription>): Promise<void> => {
    try {
        await updateDoc(doc(db, "subscriptions", subscriptionId), updateFields);
    } catch (error) {
        console.error("Error updating subscription:", error);
        throw error;
    }
};

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "subscriptions", subscriptionId));
    } catch (error) {
        console.error("Error deleting subscription:", error);
        throw error;
    }
};


