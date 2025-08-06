import React, { useState, useEffect } from 'react';
import { Target, Zap, Beef, Calendar, Quote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FoodEntry {
  id: number;
  food_name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  entry_time: string;
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchTodayEntries();
    fetchMotivationalQuote();
  }, []);

  const fetchTodayEntries = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/food-entries/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const entries = await response.json();
        setTodayEntries(entries);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMotivationalQuote = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/motivational-quote`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQuote(data.quote);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
  };

  // ✅ Guard: use fallback values if user goal is invalid
  const dailyCalorieGoal =
    Number(user?.dailyCalorieGoal) > 0 ? Number(user.dailyCalorieGoal) : 2000;
  const dailyProteinGoal =
    Number(user?.dailyProteinGoal) > 0 ? Number(user.dailyProteinGoal) : 100;

  const totalCalories = todayEntries.reduce(
    (sum, entry) =>
      sum +
      (typeof entry.calories === 'number' && !isNaN(entry.calories)
        ? entry.calories
        : 0),
    0
  );

  const totalProtein = todayEntries.reduce(
    (sum, entry) =>
      sum +
      (typeof entry.protein === 'number' && !isNaN(entry.protein)
        ? entry.protein
        : 0),
    0
  );

  const calorieProgress =
    dailyCalorieGoal > 0 ? (totalCalories / dailyCalorieGoal) * 100 : 0;
  const proteinProgress =
    dailyProteinGoal > 0 ? (totalProtein / dailyProteinGoal) * 100 : 0;
  const averageProgress = (calorieProgress + proteinProgress) / 2;

  const displayAverageProgress = isNaN(averageProgress)
    ? '0%'
    : `${Math.round(Math.min(averageProgress, 100))}%`;
console.log('✅ DEBUG VALUES:');
console.log('User:', user);
console.log('Token:', token);
console.log('Today\'s Entries:', todayEntries);
console.log('Daily Calorie Goal:', dailyCalorieGoal);
console.log('Daily Protein Goal:', dailyProteinGoal);
console.log('Total Calories:', totalCalories);
console.log('Total Protein:', totalProtein);
console.log('Calorie Progress (%):', calorieProgress);
console.log('Protein Progress (%):', proteinProgress);
console.log('Average Progress (%):', averageProgress);
console.log('Display Average:', displayAverageProgress);

  if (loading || !user) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'User'}! 👋</h2>
            <p className="text-green-100 mt-1">Ready to crush your goals today?</p>
          </div>
          <Calendar className="h-12 w-12 text-green-200" />
        </div>
      </div>

      {/* Motivational Quote */}
      {quote && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Quote className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
            <p className="text-blue-800 font-medium italic">{quote}</p>
          </div>
        </div>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Calories Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-100 p-2 rounded-xl">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Calories</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-gray-800">{Math.round(totalCalories)}</span>
              <span className="text-sm text-gray-500">/ {dailyCalorieGoal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {Math.round(Math.min(calorieProgress, 100))}% of goal
            </p>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 p-2 rounded-xl">
                <Beef className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Protein</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-gray-800">{Math.round(totalProtein)}g</span>
              <span className="text-sm text-gray-500">/ {dailyProteinGoal}g</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {Math.round(Math.min(proteinProgress, 100))}% of goal
            </p>
          </div>
        </div>
      </div>

      {/* Goal Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Daily Goal Progress</h3>
            <p className="text-sm text-gray-600">Keep up the great work!</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-green-600">{displayAverageProgress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(averageProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {todayEntries.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-2">No food entries today</p>
              <p className="text-sm text-gray-400">Start tracking your meals to see progress!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Meals</h3>
          <div className="space-y-3">
            {todayEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{entry.food_name}</p>
                  <p className="text-sm text-gray-600">{entry.weight_grams}g</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">{Math.round(entry.calories)} cal</p>
                  <p className="text-sm text-red-600">{Math.round(entry.protein)}g protein</p>
                </div>
              </div>
            ))}
            {todayEntries.length > 3 && (
              <p className="text-center text-sm text-gray-500 pt-2">
                And {todayEntries.length - 3} more entries...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
