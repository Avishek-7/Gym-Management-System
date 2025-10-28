import React, { useState } from 'react';
import { X, Plus, Trash2, TrendingUp, Apple, Droplet, Pill, FileText, Users } from 'lucide-react';
import type { DietPlan, Meal, FoodItem, CreateDietPlanRequest, DietTemplate } from '../../types';

interface DietDetailsModalsProps {
  // Main Modal
  isOpen: boolean;
  onClose: () => void;
  
  // Data
  dietPlans: DietPlan[];
  templates: DietTemplate[];
  members: Array<{ id: string; name: string }>;
  
  // Add Plan Modal
  isAddPlanOpen: boolean;
  onOpenAddPlan: () => void;
  onCloseAddPlan: () => void;
  onCreatePlan: (plan: CreateDietPlanRequest) => Promise<void>;
  
  // Edit Plan Modal
  isEditPlanOpen: boolean;
  onOpenEditPlan: (plan: DietPlan) => void;
  onCloseEditPlan: () => void;
  onUpdatePlan: (planId: string, updates: Partial<DietPlan>) => Promise<void>;
  selectedPlan: DietPlan | null;
  
  // View Plan Details
  isViewPlanOpen: boolean;
  onOpenViewPlan: (plan: DietPlan) => void;
  onCloseViewPlan: () => void;
  
  // Delete Plan
  onDeletePlan: (planId: string) => Promise<void>;
  
  // Loading
  isLoading?: boolean;
}

export const DietDetailsModals: React.FC<DietDetailsModalsProps> = ({
  isOpen,
  onClose,
  dietPlans,
  members,
  isAddPlanOpen,
  onOpenAddPlan,
  onCloseAddPlan,
  onCreatePlan,
  isEditPlanOpen,
  onOpenEditPlan,
  onCloseEditPlan,
  selectedPlan,
  isViewPlanOpen,
  onOpenViewPlan,
  onCloseViewPlan,
  onDeletePlan,
  isLoading = false,
}) => {
  // Form state for new plan
  const [formData, setFormData] = useState<CreateDietPlanRequest>({
    memberId: '',
    title: '',
    description: '',
    goal: 'maintenance',
    duration: 30,
    startDate: new Date(),
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFats: 65,
    meals: [],
    restrictions: [],
    supplements: [],
    waterIntake: 3,
    notes: '',
  });

  const [currentMeal, setCurrentMeal] = useState<Omit<Meal, 'id'>>({
    name: '',
    time: '08:00',
    items: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    notes: '',
  });

  const [currentFoodItem, setCurrentFoodItem] = useState<FoodItem>({
    name: '',
    quantity: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [newRestriction, setNewRestriction] = useState('');
  const [newSupplement, setNewSupplement] = useState('');

  const goalOptions = [
    { value: 'weight-loss', label: 'Weight Loss', icon: TrendingUp },
    { value: 'muscle-gain', label: 'Muscle Gain', icon: TrendingUp },
    { value: 'maintenance', label: 'Maintenance', icon: Apple },
    { value: 'athletic-performance', label: 'Athletic Performance', icon: TrendingUp },
    { value: 'health', label: 'General Health', icon: Apple },
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleAddFoodItem = () => {
    if (currentFoodItem.name && currentFoodItem.quantity) {
      setCurrentMeal({
        ...currentMeal,
        items: [...currentMeal.items, { ...currentFoodItem }],
        calories: currentMeal.calories + currentFoodItem.calories,
        protein: currentMeal.protein + currentFoodItem.protein,
        carbs: currentMeal.carbs + currentFoodItem.carbs,
        fats: currentMeal.fats + currentFoodItem.fats,
      });
      setCurrentFoodItem({
        name: '',
        quantity: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      });
    }
  };

  const handleRemoveFoodItem = (index: number) => {
    const item = currentMeal.items[index];
    setCurrentMeal({
      ...currentMeal,
      items: currentMeal.items.filter((_, i) => i !== index),
      calories: currentMeal.calories - item.calories,
      protein: currentMeal.protein - item.protein,
      carbs: currentMeal.carbs - item.carbs,
      fats: currentMeal.fats - item.fats,
    });
  };

  const handleAddMeal = () => {
    if (currentMeal.name && currentMeal.items.length > 0) {
      setFormData({
        ...formData,
        meals: [...formData.meals, { ...currentMeal }],
      });
      setCurrentMeal({
        name: '',
        time: '08:00',
        items: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        notes: '',
      });
    }
  };

  const handleRemoveMeal = (index: number) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  const handleAddRestriction = () => {
    if (newRestriction && !formData.restrictions?.includes(newRestriction)) {
      setFormData({
        ...formData,
        restrictions: [...(formData.restrictions || []), newRestriction],
      });
      setNewRestriction('');
    }
  };

  const handleRemoveRestriction = (restriction: string) => {
    setFormData({
      ...formData,
      restrictions: formData.restrictions?.filter((r) => r !== restriction),
    });
  };

  const handleAddSupplement = () => {
    if (newSupplement && !formData.supplements?.includes(newSupplement)) {
      setFormData({
        ...formData,
        supplements: [...(formData.supplements || []), newSupplement],
      });
      setNewSupplement('');
    }
  };

  const handleRemoveSupplement = (supplement: string) => {
    setFormData({
      ...formData,
      supplements: formData.supplements?.filter((s) => s !== supplement),
    });
  };

  const handleSubmitPlan = async () => {
    try {
      await onCreatePlan(formData);
      // Reset form
      setFormData({
        memberId: '',
        title: '',
        description: '',
        goal: 'maintenance',
        duration: 30,
        startDate: new Date(),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFats: 65,
        meals: [],
        restrictions: [],
        supplements: [],
        waterIntake: 3,
        notes: '',
      });
      onCloseAddPlan();
    } catch (error) {
      console.error('Error creating diet plan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Diet Plans Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Apple className="w-8 h-8" />
                Diet Plans Management
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Create and manage personalized nutrition plans
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <button
                  onClick={onOpenAddPlan}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Plan
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{dietPlans.length}</span> Total Plans •{' '}
                <span className="font-semibold text-green-600">
                  {dietPlans.filter((p) => p.status === 'active').length}
                </span>{' '}
                Active
              </div>
            </div>

            {/* Diet Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dietPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onOpenViewPlan(plan)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{plan.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.memberName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[plan.status]
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Goal:</span>
                      <span className="font-medium capitalize">
                        {plan.goal.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Calories:</span>
                      <span className="font-medium">{plan.targetCalories} kcal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{plan.duration} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meals:</span>
                      <span className="font-medium">{plan.meals.length} meals/day</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditPlan(plan);
                      }}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this diet plan?')) {
                          onDeletePlan(plan.id);
                        }
                      }}
                      className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {dietPlans.length === 0 && (
              <div className="text-center py-12">
                <Apple className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No diet plans created yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your first personalized nutrition plan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Plan Modal */}
      {(isAddPlanOpen || isEditPlanOpen) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {isEditPlanOpen ? 'Edit Diet Plan' : 'Create New Diet Plan'}
              </h3>
              <button
                onClick={isEditPlanOpen ? onCloseEditPlan : onCloseAddPlan}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member *
                    </label>
                    <select
                      value={formData.memberId}
                      onChange={(e) =>
                        setFormData({ ...formData, memberId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Summer Shred 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of the diet plan..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal *
                    </label>
                    <select
                      value={formData.goal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          goal: e.target.value as 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance' | 'health',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {goalOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate.toISOString().split('T')[0]}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: new Date(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      Water Intake (liters/day) *
                    </label>
                    <input
                      type="number"
                      value={formData.waterIntake}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          waterIntake: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.5"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Macros */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Target Macros
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calories (kcal) *
                      </label>
                      <input
                        type="number"
                        value={formData.targetCalories}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetCalories: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protein (g) *
                      </label>
                      <input
                        type="number"
                        value={formData.targetProtein}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetProtein: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carbs (g) *
                      </label>
                      <input
                        type="number"
                        value={formData.targetCarbs}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetCarbs: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fats (g) *
                      </label>
                      <input
                        type="number"
                        value={formData.targetFats}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetFats: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Meals Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Apple className="w-5 h-5 text-green-600" />
                    Meals ({formData.meals.length})
                  </h4>
                  
                  {/* Current Meal Builder */}
                  <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={currentMeal.name}
                        onChange={(e) =>
                          setCurrentMeal({ ...currentMeal, name: e.target.value })
                        }
                        placeholder="Meal name (e.g., Breakfast)"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="time"
                        value={currentMeal.time}
                        onChange={(e) =>
                          setCurrentMeal({ ...currentMeal, time: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Food Items */}
                    <div className="space-y-2 mb-3">
                      {currentMeal.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200"
                        >
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{item.name}</span> ({item.quantity}) -{' '}
                            {item.calories} kcal, P: {item.protein}g, C: {item.carbs}g, F:{' '}
                            {item.fats}g
                          </div>
                          <button
                            onClick={() => handleRemoveFoodItem(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Food Item Form */}
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      <input
                        type="text"
                        value={currentFoodItem.name}
                        onChange={(e) =>
                          setCurrentFoodItem({ ...currentFoodItem, name: e.target.value })
                        }
                        placeholder="Food name"
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={currentFoodItem.quantity}
                        onChange={(e) =>
                          setCurrentFoodItem({ ...currentFoodItem, quantity: e.target.value })
                        }
                        placeholder="Quantity"
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        value={currentFoodItem.calories}
                        onChange={(e) =>
                          setCurrentFoodItem({
                            ...currentFoodItem,
                            calories: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Cal"
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        value={currentFoodItem.protein}
                        onChange={(e) =>
                          setCurrentFoodItem({
                            ...currentFoodItem,
                            protein: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="P"
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={handleAddFoodItem}
                        className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Total: {currentMeal.calories} kcal | P: {currentMeal.protein}g | C:{' '}
                        {currentMeal.carbs}g | F: {currentMeal.fats}g
                      </div>
                      <button
                        onClick={handleAddMeal}
                        disabled={!currentMeal.name || currentMeal.items.length === 0}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add Meal
                      </button>
                    </div>
                  </div>

                  {/* Added Meals List */}
                  <div className="space-y-2">
                    {formData.meals.map((meal, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {meal.name} - {meal.time}
                          </div>
                          <div className="text-sm text-gray-600">
                            {meal.items.length} items • {meal.calories} kcal • P: {meal.protein}g •
                            C: {meal.carbs}g • F: {meal.fats}g
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMeal(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restrictions & Supplements */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Restrictions
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newRestriction}
                        onChange={(e) => setNewRestriction(e.target.value)}
                        placeholder="e.g., Vegetarian"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddRestriction()}
                      />
                      <button
                        onClick={handleAddRestriction}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.restrictions?.map((restriction, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {restriction}
                          <button
                            onClick={() => handleRemoveRestriction(restriction)}
                            className="hover:text-orange-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Pill className="w-4 h-4 text-purple-500" />
                      Recommended Supplements
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSupplement}
                        onChange={(e) => setNewSupplement(e.target.value)}
                        placeholder="e.g., Whey Protein"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSupplement()}
                      />
                      <button
                        onClick={handleAddSupplement}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.supplements?.map((supplement, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {supplement}
                          <button
                            onClick={() => handleRemoveSupplement(supplement)}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional instructions or notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={isEditPlanOpen ? onCloseEditPlan : onCloseAddPlan}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPlan}
                disabled={
                  !formData.memberId ||
                  !formData.title ||
                  formData.meals.length === 0 ||
                  isLoading
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Create Diet Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Plan Details Modal */}
      {isViewPlanOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedPlan.title}</h3>
              <button onClick={onCloseViewPlan} className="p-1 hover:bg-white/20 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Plan Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Member</label>
                    <p className="font-semibold">{selectedPlan.memberName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Goal</label>
                    <p className="font-semibold capitalize">
                      {selectedPlan.goal.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Duration</label>
                    <p className="font-semibold">{selectedPlan.duration} days</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[selectedPlan.status]
                      }`}
                    >
                      {selectedPlan.status}
                    </span>
                  </div>
                </div>

                {/* Macros */}
                <div>
                  <h4 className="font-semibold mb-2">Target Macros</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Calories</div>
                      <div className="text-xl font-bold text-blue-600">
                        {selectedPlan.targetCalories}
                      </div>
                      <div className="text-xs text-gray-500">kcal</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Protein</div>
                      <div className="text-xl font-bold text-red-600">
                        {selectedPlan.targetProtein}
                      </div>
                      <div className="text-xs text-gray-500">grams</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Carbs</div>
                      <div className="text-xl font-bold text-yellow-600">
                        {selectedPlan.targetCarbs}
                      </div>
                      <div className="text-xs text-gray-500">grams</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Fats</div>
                      <div className="text-xl font-bold text-purple-600">
                        {selectedPlan.targetFats}
                      </div>
                      <div className="text-xs text-gray-500">grams</div>
                    </div>
                  </div>
                </div>

                {/* Meals */}
                <div>
                  <h4 className="font-semibold mb-3">Daily Meals</h4>
                  <div className="space-y-3">
                    {selectedPlan.meals.map((meal) => (
                      <div key={meal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900">{meal.name}</h5>
                            <p className="text-sm text-gray-600">Time: {meal.time}</p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">{meal.calories} kcal</div>
                            <div className="text-gray-600">
                              P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {meal.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-600 pl-4">
                              • {item.name} - {item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restrictions & Supplements */}
                {(selectedPlan.restrictions && selectedPlan.restrictions.length > 0) ||
                (selectedPlan.supplements && selectedPlan.supplements.length > 0) ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPlan.restrictions && selectedPlan.restrictions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Dietary Restrictions</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlan.restrictions.map((restriction, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                            >
                              {restriction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPlan.supplements && selectedPlan.supplements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommended Supplements</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlan.supplements.map((supplement, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                            >
                              {supplement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {selectedPlan.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Notes</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPlan.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
