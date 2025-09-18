import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function getUserBills(userId: string)  {
    const q = query(collection(db, "bills"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserDietPlans(userId: string) {
    const q = query(collection(db, "dietPlans"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserWorkoutRoutines(userId: string) {
    const q = query(collection(db, "workoutRoutines"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

