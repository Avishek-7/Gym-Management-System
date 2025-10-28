// Diet Management Types

export interface Meal {
  id: string;
  name: string;
  time: string; // e.g., "08:00", "13:00"
  items: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface FoodItem {
  name: string;
  quantity: string; // e.g., "200g", "2 cups", "1 medium"
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}

export interface DietPlan {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health';
  duration: number; // in days
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: Meal[];
  restrictions?: string[]; // e.g., ["Vegetarian", "Gluten-free", "Dairy-free"]
  supplements?: string[]; // Recommended supplements
  waterIntake: number; // in liters
  createdBy: string; // Admin/Nutritionist user ID
  createdByName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDietPlanRequest {
  memberId: string;
  title: string;
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health';
  duration: number;
  startDate: Date;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: Omit<Meal, 'id'>[];
  restrictions?: string[];
  supplements?: string[];
  waterIntake: number;
  notes?: string;
}

export interface UpdateDietPlanRequest {
  title?: string;
  description?: string;
  goal?: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health';
  duration?: number;
  startDate?: Date;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  meals?: Omit<Meal, 'id'>[];
  restrictions?: string[];
  supplements?: string[];
  waterIntake?: number;
  notes?: string;
}

export interface DietProgress {
  id: string;
  dietPlanId: string;
  memberId: string;
  date: Date;
  actualCalories: number;
  actualProtein: number;
  actualCarbs: number;
  actualFats: number;
  waterIntake: number;
  weight?: number; // in kg
  mealsCompleted: string[]; // Array of meal IDs
  notes?: string;
  createdAt: Date;
}

export interface CreateDietProgressRequest {
  dietPlanId: string;
  memberId: string;
  date: Date;
  actualCalories: number;
  actualProtein: number;
  actualCarbs: number;
  actualFats: number;
  waterIntake: number;
  weight?: number;
  mealsCompleted: string[];
  notes?: string;
}

export interface DietTemplate {
  id: string;
  name: string;
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health';
  calorieRange: {
    min: number;
    max: number;
  };
  meals: Omit<Meal, 'id'>[];
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDietTemplateRequest {
  name: string;
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health';
  calorieRange: {
    min: number;
    max: number;
  };
  meals: Omit<Meal, 'id'>[];
  isPublic?: boolean;
}

export interface DietStats {
  totalActivePlans: number;
  totalCompletedPlans: number;
  membersByGoal: Array<{
    goal: string;
    count: number;
  }>;
  averageCalories: number;
  popularMeals: Array<{
    name: string;
    frequency: number;
  }>;
  complianceRate: number; // Percentage of members following their plans
}
