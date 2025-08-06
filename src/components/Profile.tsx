import React, { useState, useEffect } from 'react';
import { User, Mail, Ruler, Weight, Target, LogOut, Camera, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  height: number;
  weight: number;
  body_type: string;
  goal: string;
  profile_photo?: string;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  created_at: string;
}

const Profile: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchProfile();
  }, []);

const fetchProfile = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setProfile(data);
    } else {
      const errorText = await response.text(); // Optional for better debugging
      console.error('API error:', errorText);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    setLoading(false);
  }
};


  const handleLogout = () => {
    logout();
  };

  const getJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getBMI = (weight: number, height: number) => {
    const heightInM = height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  const bmi = parseFloat(getBMI(profile.weight, profile.height));
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {profile.profile_photo ? (
              <img
                src={`${baseUrl}/uploads/${profile.profile_photo}`}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            <div className="flex items-center space-x-2 text-gray-600 mt-1">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{profile.email}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Member since {getJoinedDate(profile.created_at)}
            </p>
            {user?.isAdmin && (
              <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium mt-2">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Height & Weight */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Ruler className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Height</p>
              <p className="text-xl font-bold text-gray-800">{profile.height} cm</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <Weight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Weight</p>
              <p className="text-xl font-bold text-gray-800">{profile.weight} kg</p>
            </div>
          </div>
        </div>

        {/* Body Type & Goal */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-xl">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Body Type</p>
              <p className="text-xl font-bold text-gray-800">{profile.body_type}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-orange-100 p-2 rounded-xl">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Goal</p>
              <p className="text-lg font-bold text-gray-800">{profile.goal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BMI Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">BMI</p>
            <p className="text-3xl font-bold text-gray-800">{bmi}</p>
            <p className={`text-sm font-medium ${bmiCategory.color}`}>
              {bmiCategory.category}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Daily Goals</p>
            <p className="text-lg font-bold text-orange-600">
              {profile.daily_calorie_goal} cal
            </p>
            <p className="text-lg font-bold text-red-600">
              {profile.daily_protein_goal}g protein
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 text-left rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Account Settings</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 text-left rounded-xl hover:bg-red-50 transition-colors text-red-600"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </div>
            <span className="text-red-400">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;