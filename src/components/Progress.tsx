import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, Zap, Beef } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  entries: number;
}

const Progress: React.FC = () => {
  const { user, token } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/food-entries/history?days=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const entries = await response.json();
        
        // Group entries by date
        const grouped = entries.reduce((acc: any, entry: any) => {
          const date = entry.entry_date;
          if (!acc[date]) {
            acc[date] = { date, calories: 0, protein: 0, entries: 0 };
          }
          acc[date].calories += entry.calories;
          acc[date].protein += entry.protein;
          acc[date].entries += 1;
          return acc;
        }, {});

        // Convert to array and sort by date
        const stats = Object.values(grouped) as DailyStats[];
        stats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setWeeklyStats(stats);
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayStats = weeklyStats.find(stat => 
    stat.date === new Date().toISOString().split('T')[0]
  ) || { date: new Date().toISOString().split('T')[0], calories: 0, protein: 0, entries: 0 };

  const dailyCalorieGoal = Number(user?.dailyCalorieGoal) || 2000;
  const dailyProteinGoal = Number(user?.dailyProteinGoal) || 100;

  const safeTodayCalories = isNaN(todayStats.calories) ? 0 : todayStats.calories;
  const safeTodayProtein = isNaN(todayStats.protein) ? 0 : todayStats.protein;

  const avgCalories = weeklyStats.length > 0 
    ? weeklyStats.reduce((sum, stat) => sum + (stat.calories || 0), 0) / weeklyStats.length 
    : 0;

  const avgProtein = weeklyStats.length > 0 
    ? weeklyStats.reduce((sum, stat) => sum + (stat.protein || 0), 0) / weeklyStats.length 
    : 0;

  const safeAvgCalories = isNaN(avgCalories) ? 0 : avgCalories;
  const safeAvgProtein = isNaN(avgProtein) ? 0 : avgProtein;

  const calorieProgress = dailyCalorieGoal > 0 ? (safeTodayCalories / dailyCalorieGoal) * 100 : 0;
  const proteinProgress = dailyProteinGoal > 0 ? (safeTodayProtein / dailyProteinGoal) * 100 : 0;

  const safeCalorieProgress = isNaN(calorieProgress) ? 0 : calorieProgress;
  const safeProteinProgress = isNaN(proteinProgress) ? 0 : proteinProgress;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Progress Tracking</h1>
        <p className="text-gray-600">Monitor your nutrition journey</p>
      </div>

      {/* Today's Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Today's Progress</h2>
          <TrendingUp className="h-8 w-8 text-blue-200" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Calories</p>
            <p className="text-2xl font-bold">{Math.round(safeTodayCalories)}</p>
            <div className="w-full bg-blue-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(safeCalorieProgress, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Protein</p>
            <p className="text-2xl font-bold">{Math.round(safeTodayProtein)}g</p>
            <div className="w-full bg-blue-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(safeProteinProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Averages */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-orange-100 p-2 rounded-xl">
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Calories</p>
              <p className="text-xs text-gray-500">This week</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{Math.round(safeAvgCalories)}</p>
          <p className="text-sm text-gray-500">per day</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <Beef className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Protein</p>
              <p className="text-xs text-gray-500">This week</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{Math.round(safeAvgProtein)}g</p>
          <p className="text-sm text-gray-500">per day</p>
        </div>
      </div>

      {/* Goal Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Goal Achievement</h3>
            <p className="text-sm text-gray-600">How you're doing today</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Calorie Goal</span>
              <span className="text-sm font-semibold text-orange-600">
                {Math.round(safeCalorieProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(safeCalorieProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeTodayCalories)} / {dailyCalorieGoal} calories
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Protein Goal</span>
              <span className="text-sm font-semibold text-red-600">
                {Math.round(safeProteinProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(safeProteinProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeTodayProtein)} / {dailyProteinGoal}g protein
            </p>
          </div>
        </div>
      </div>

      {/* Weekly History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Weekly History</h3>
            <p className="text-sm text-gray-600">Last 7 days performance</p>
          </div>
        </div>

        <div className="space-y-3">
          {weeklyStats.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No data available</p>
              <p className="text-sm text-gray-400">Start tracking your meals to see progress</p>
            </div>
          ) : (
            weeklyStats.map((stat) => {
              const safeCalories = isNaN(stat.calories) ? 0 : stat.calories;
              const safeProtein = isNaN(stat.protein) ? 0 : stat.protein;
              const date = new Date(stat.date);
              const isToday = stat.date === new Date().toISOString().split('T')[0];
              
              return (
                <div 
                  key={stat.date} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <p className={`font-medium ${isToday ? 'text-green-800' : 'text-gray-800'}`}>
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">{stat.entries} entries</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{Math.round(safeCalories)} cal</p>
                    <p className="text-sm text-red-600">{Math.round(safeProtein)}g protein</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;