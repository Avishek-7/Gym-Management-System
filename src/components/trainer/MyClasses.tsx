import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import type { TrainerClass, CreateClassRequest } from '../../types/class';
import { getTrainerClasses, createClass, updateClass, deleteClass } from '../../services/fitness/classService';

interface MyClassesProps {
  trainerId: string;
  trainerName: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MyClasses: React.FC<MyClassesProps> = ({ trainerId, trainerName }) => {
  const [classes, setClasses] = useState<TrainerClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TrainerClass | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: '',
    instructor: trainerName,
    description: '',
    duration: 60,
    capacity: 20,
    schedule: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
  });

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrainerClasses(trainerId);
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateClass = async () => {
    try {
      await createClass({
        ...formData,
        trainerId,
        trainerName,
      });
      setIsCreateModalOpen(false);
      resetForm();
      loadClasses();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;
    
    try {
      await updateClass(selectedClass.id, formData);
      setIsEditModalOpen(false);
      setSelectedClass(null);
      resetForm();
      loadClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await deleteClass(classId);
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  };

  const openEditModal = (gymClass: TrainerClass) => {
    setSelectedClass(gymClass);
    setFormData({
      name: gymClass.name,
      instructor: gymClass.instructor,
      description: gymClass.description,
      duration: gymClass.duration,
      capacity: gymClass.capacity,
      schedule: gymClass.schedule,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      instructor: trainerName,
      description: '',
      duration: 60,
      capacity: 20,
      schedule: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
    });
  };

  const addScheduleSlot = () => {
    setFormData({
      ...formData,
      schedule: [...formData.schedule, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
    });
  };

  const removeScheduleSlot = (index: number) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index),
    });
  };

  const updateScheduleSlot = (index: number, field: string, value: string | number) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: newSchedule });
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-400">Loading classes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">My Classes</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your classes and schedules
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">No classes yet</p>
              <p className="text-gray-500 text-sm">Create your first class to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((gymClass) => (
                <div
                  key={gymClass.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">{gymClass.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(gymClass)}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Edit class"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(gymClass.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Delete class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {gymClass.description && (
                    <p className="text-gray-400 text-sm mb-3">{gymClass.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span>{gymClass.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4 text-green-400" />
                      <span>
                        {gymClass.currentBookings}/{gymClass.capacity} enrolled
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-gray-400 text-xs font-medium mb-2">Schedule:</p>
                    <div className="space-y-1">
                      {gymClass.schedule.map((slot, idx) => (
                        <div key={idx} className="text-gray-300 text-xs">
                          {DAYS_OF_WEEK[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedClass(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isCreateModalOpen ? 'Create New Class' : 'Edit Class'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isCreateModalOpen ? 'Add a new class to your schedule' : 'Update class details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Class Name</label>
              <input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Yoga, HIIT, Pilates"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Class description..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Schedule</label>
                <Button
                  onClick={addScheduleSlot}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slot
                </Button>
              </div>

              <div className="space-y-3">
                {formData.schedule.map((slot, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => updateScheduleSlot(index, 'dayOfWeek', parseInt(e.target.value))}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {DAYS_OF_WEEK.map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScheduleSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />

                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScheduleSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {formData.schedule.length > 1 && (
                      <button
                        onClick={() => removeScheduleSlot(index)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={isCreateModalOpen ? handleCreateClass : handleUpdateClass}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!formData.name || formData.schedule.length === 0}
              >
                {isCreateModalOpen ? 'Create Class' : 'Update Class'}
              </Button>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyClasses;
