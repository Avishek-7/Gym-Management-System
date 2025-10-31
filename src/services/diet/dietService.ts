import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../core/firebase';
import type {
  DietPlan,
  CreateDietPlanRequest,
  UpdateDietPlanRequest,
  DietProgress,
  CreateDietProgressRequest,
  DietTemplate,
  CreateDietTemplateRequest,
  DietStats,
  Meal,
} from '../../types/diet';
import { logger } from '../../utils/logger';

const DIET_PLANS_COLLECTION = 'dietPlans';
const DIET_PROGRESS_COLLECTION = 'dietProgress';
const DIET_TEMPLATES_COLLECTION = 'dietTemplates';

// ============= Diet Plans =============

export const createDietPlan = async (
  planData: CreateDietPlanRequest
): Promise<string> => {
  logger.info('Creating diet plan', {
    service: 'dietService',
    action: 'createDietPlan',
    memberId: planData.memberId,
    goal: planData.goal
  });

  try {
    const user = auth.currentUser;
    if (!user) {
      logger.error('Diet plan creation failed - user not authenticated', new Error('Not authenticated'), {
        service: 'dietService',
        action: 'createDietPlan'
      });
      throw new Error('User not authenticated');
    }

    // Calculate end date
    const endDate = new Date(planData.startDate);
    endDate.setDate(endDate.getDate() + planData.duration);

    // Add IDs to meals
    const mealsWithIds: Meal[] = planData.meals.map((meal, index) => ({
      ...meal,
      id: `meal-${Date.now()}-${index}`,
    }));

    const dietPlanDoc = {
      memberId: planData.memberId,
      memberName: '', // Will be populated from member data
      title: planData.title,
      description: planData.description,
      goal: planData.goal,
      duration: planData.duration,
      startDate: Timestamp.fromDate(planData.startDate),
      endDate: Timestamp.fromDate(endDate),
      status: 'active',
      targetCalories: planData.targetCalories,
      targetProtein: planData.targetProtein,
      targetCarbs: planData.targetCarbs,
      targetFats: planData.targetFats,
      meals: mealsWithIds,
      restrictions: planData.restrictions || [],
      supplements: planData.supplements || [],
      waterIntake: planData.waterIntake,
      createdBy: user.uid,
      createdByName: user.displayName || 'Admin',
      notes: planData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    logger.logFirebaseOperation('create', 'dietPlans', {
      memberId: planData.memberId,
      mealCount: mealsWithIds.length
    });

    const docRef = await addDoc(
      collection(db, DIET_PLANS_COLLECTION),
      dietPlanDoc
    );

    logger.info('Diet plan created successfully', {
      service: 'dietService',
      planId: docRef.id,
      memberId: planData.memberId,
      mealCount: mealsWithIds.length
    });

    return docRef.id;
  } catch (error) {
    logger.error('Failed to create diet plan', error, {
      service: 'dietService',
      action: 'createDietPlan',
      memberId: planData.memberId
    });
    throw error;
  }
};

export const getAllDietPlans = async (): Promise<DietPlan[]> => {
  logger.debug('Fetching all diet plans', {
    service: 'dietService',
    action: 'getAllDietPlans'
  });

  try {
    logger.logFirebaseOperation('query', 'dietPlans');
    const q = query(
      collection(db, DIET_PLANS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const plans = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DietPlan;
    });

    logger.info('Diet plans fetched successfully', {
      service: 'dietService',
      count: plans.length
    });

    return plans;
  } catch (error) {
    logger.error('Failed to fetch diet plans', error, {
      service: 'dietService',
      action: 'getAllDietPlans'
    });
    throw error;
  }
};

export const getDietPlanById = async (planId: string): Promise<DietPlan | null> => {
  try {
    const docRef = doc(db, DIET_PLANS_COLLECTION, planId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DietPlan;
    }

    return null;
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    throw error;
  }
};

export const getMemberDietPlans = async (memberId: string): Promise<DietPlan[]> => {
  try {
    const q = query(
      collection(db, DIET_PLANS_COLLECTION),
      where('memberId', '==', memberId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DietPlan;
    });
  } catch (error) {
    console.error('Error fetching member diet plans:', error);
    throw error;
  }
};

export const getActiveDietPlans = async (): Promise<DietPlan[]> => {
  try {
    const q = query(
      collection(db, DIET_PLANS_COLLECTION),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DietPlan;
    });
  } catch (error) {
    console.error('Error fetching active diet plans:', error);
    throw error;
  }
};

export const updateDietPlan = async (
  planId: string,
  updates: UpdateDietPlanRequest
): Promise<void> => {
  try {
    const docRef = doc(db, DIET_PLANS_COLLECTION, planId);
    
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert dates if provided
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
      
      // Recalculate end date if duration is also updated or exists
      const planDoc = await getDoc(docRef);
      if (planDoc.exists()) {
        const duration = updates.duration || planDoc.data().duration;
        const endDate = new Date(updates.startDate);
        endDate.setDate(endDate.getDate() + duration);
        updateData.endDate = Timestamp.fromDate(endDate);
      }
    }

    // Add IDs to meals if provided
    if (updates.meals) {
      updateData.meals = updates.meals.map((meal, index) => ({
        ...meal,
        id: `meal-${Date.now()}-${index}`,
      }));
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating diet plan:', error);
    throw error;
  }
};

export const deleteDietPlan = async (planId: string): Promise<void> => {
  try {
    const docRef = doc(db, DIET_PLANS_COLLECTION, planId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    throw error;
  }
};

// ============= Diet Progress =============

export const createDietProgress = async (
  progressData: CreateDietProgressRequest
): Promise<string> => {
  try {
    const progressDoc = {
      dietPlanId: progressData.dietPlanId,
      memberId: progressData.memberId,
      date: Timestamp.fromDate(progressData.date),
      actualCalories: progressData.actualCalories,
      actualProtein: progressData.actualProtein,
      actualCarbs: progressData.actualCarbs,
      actualFats: progressData.actualFats,
      waterIntake: progressData.waterIntake,
      weight: progressData.weight,
      mealsCompleted: progressData.mealsCompleted,
      notes: progressData.notes || '',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, DIET_PROGRESS_COLLECTION),
      progressDoc
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating diet progress:', error);
    throw error;
  }
};

export const getMemberDietProgress = async (
  memberId: string,
  dietPlanId?: string
): Promise<DietProgress[]> => {
  try {
    let q;
    if (dietPlanId) {
      q = query(
        collection(db, DIET_PROGRESS_COLLECTION),
        where('memberId', '==', memberId),
        where('dietPlanId', '==', dietPlanId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(db, DIET_PROGRESS_COLLECTION),
        where('memberId', '==', memberId),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate(),
        createdAt: data.createdAt?.toDate(),
      } as DietProgress;
    });
  } catch (error) {
    console.error('Error fetching diet progress:', error);
    throw error;
  }
};

// ============= Diet Templates =============

export const createDietTemplate = async (
  templateData: CreateDietTemplateRequest
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add IDs to meals
    const mealsWithIds: Meal[] = templateData.meals.map((meal, index) => ({
      ...meal,
      id: `meal-${Date.now()}-${index}`,
    }));

    const templateDoc = {
      name: templateData.name,
      description: templateData.description,
      goal: templateData.goal,
      calorieRange: templateData.calorieRange,
      meals: mealsWithIds,
      isPublic: templateData.isPublic || false,
      createdBy: user.uid,
      createdByName: user.displayName || 'Admin',
      timesUsed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, DIET_TEMPLATES_COLLECTION),
      templateDoc
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating diet template:', error);
    throw error;
  }
};

export const getAllDietTemplates = async (): Promise<DietTemplate[]> => {
  try {
    const q = query(
      collection(db, DIET_TEMPLATES_COLLECTION),
      orderBy('timesUsed', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DietTemplate;
    });
  } catch (error) {
    console.error('Error fetching diet templates:', error);
    throw error;
  }
};

export const incrementTemplateUsage = async (templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, DIET_TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentUsage = docSnap.data().timesUsed || 0;
      await updateDoc(docRef, {
        timesUsed: currentUsage + 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    throw error;
  }
};

export const deleteDietTemplate = async (templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, DIET_TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting diet template:', error);
    throw error;
  }
};

// ============= Diet Stats =============

export const getDietStats = async (): Promise<DietStats> => {
  try {
    const plansSnapshot = await getDocs(collection(db, DIET_PLANS_COLLECTION));
    const plans = plansSnapshot.docs.map((doc) => doc.data());

    const totalActivePlans = plans.filter(
      (plan) => plan.status === 'active'
    ).length;

    const totalCompletedPlans = plans.filter(
      (plan) => plan.status === 'completed'
    ).length;

    // Group by goal
    const goalCounts: { [key: string]: number } = {};
    plans.forEach((plan) => {
      goalCounts[plan.goal] = (goalCounts[plan.goal] || 0) + 1;
    });

    const membersByGoal = Object.entries(goalCounts).map(([goal, count]) => ({
      goal,
      count,
    }));

    // Calculate average calories
    const totalCalories = plans.reduce(
      (sum, plan) => sum + (plan.targetCalories || 0),
      0
    );
    const averageCalories = plans.length > 0 ? totalCalories / plans.length : 0;

    // Get popular meals
    const mealCounts: { [key: string]: number } = {};
    plans.forEach((plan) => {
      plan.meals?.forEach((meal: Meal) => {
        mealCounts[meal.name] = (mealCounts[meal.name] || 0) + 1;
      });
    });

    const popularMeals = Object.entries(mealCounts)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Calculate compliance rate (simplified)
    const complianceRate = plans.length > 0 
      ? (totalActivePlans / plans.length) * 100 
      : 0;

    return {
      totalActivePlans,
      totalCompletedPlans,
      membersByGoal,
      averageCalories: Math.round(averageCalories),
      popularMeals,
      complianceRate: Math.round(complianceRate),
    };
  } catch (error) {
    console.error('Error fetching diet stats:', error);
    throw error;
  }
};
