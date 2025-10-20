import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Award, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

interface TrainerProfileProps {
  trainerId: string;
}

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  certifications: string[];
  bio: string;
  availability: string[];
}

const TrainerProfile: React.FC<TrainerProfileProps> = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    specialization: '',
    experience: '',
    certifications: [],
    bio: '',
    availability: [],
  });
  const [editedData, setEditedData] = useState<ProfileData>(profileData);
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    // In a real app, this would fetch profile data from Firestore
    // For now, we'll use mock data
    setProfileData({
      displayName: user?.displayName || 'Trainer Name',
      email: user?.email || 'trainer@gym.com',
      phone: '+1 (555) 123-4567',
      specialization: 'Strength Training & Cardio',
      experience: '5 years',
      certifications: ['Certified Personal Trainer', 'Sports Nutrition Specialist'],
      bio: 'Passionate fitness trainer dedicated to helping members achieve their health and fitness goals.',
      availability: ['Monday', 'Wednesday', 'Friday'],
    });
  }, [user]);

  const handleEdit = () => {
    setEditedData(profileData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
  };

  const handleSave = () => {
    // In a real app, this would save to Firestore
    setProfileData(editedData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setEditedData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const toggleAvailability = (day: string) => {
    setEditedData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day],
    }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const displayData = isEditing ? editedData : profileData;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <User className="w-5 h-5" />
              My Profile
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your trainer profile and settings
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="bg-gray-700/50 border-gray-600 hover:bg-gray-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {displayData.displayName.split(' ').map(n => n.charAt(0)).join('')}
              </span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-green-500"
                />
              ) : (
                <h2 className="text-2xl font-bold text-white">{displayData.displayName}</h2>
              )}
              <p className="text-gray-300 mt-1">{displayData.specialization}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-400" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              ) : (
                <p className="text-white">{displayData.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              ) : (
                <p className="text-white">{displayData.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-400" />
            Professional Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.specialization}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('specialization', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              ) : (
                <p className="text-white">{displayData.specialization}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Experience</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.experience}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('experience', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              ) : (
                <p className="text-white">{displayData.experience}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={editedData.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                />
              ) : (
                <p className="text-white">{displayData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Certifications
          </h3>
          <div className="space-y-2 mb-3">
            {displayData.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
              >
                <span className="text-white">{cert}</span>
                {isEditing && (
                  <button
                    onClick={() => removeCertification(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCertification(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addCertification()}
                placeholder="Add certification"
                className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
              <Button
                onClick={addCertification}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Availability
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {daysOfWeek.map(day => (
              <button
                key={day}
                onClick={() => isEditing && toggleAvailability(day)}
                disabled={!isEditing}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  displayData.availability.includes(day)
                    ? 'bg-green-500/30 border-green-500 text-green-400'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400'
                } ${isEditing ? 'cursor-pointer hover:bg-gray-600/50' : 'cursor-default'}`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-xs text-gray-400">Active Classes</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-xs text-gray-400">Total Members</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">0</div>
            <div className="text-xs text-gray-400">Sessions This Month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainerProfile;
