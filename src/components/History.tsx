import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, Calendar, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FoodEntry {
  id: number;
  food_name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  entry_date: string;
  entry_time: string;
  image_path?: string;
}

const History: React.FC = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchHistory();
  }, [selectedDays]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/food-entries/history?days=${selectedDays}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    if (!searchTerm) {
      setFilteredEntries(entries);
      return;
    }

    const filtered = entries.filter(entry =>
      entry.food_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  };

  const groupEntriesByDate = (entries: FoodEntry[]) => {
    const grouped = entries.reduce((acc: { [key: string]: FoodEntry[] }, entry) => {
      const date = entry.entry_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDayStats = (dayEntries: FoodEntry[]) => {
    const totalCalories = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const totalProtein = dayEntries.reduce((sum, entry) => sum + entry.protein, 0);
    return { totalCalories, totalProtein };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-16 bg-gray-200 rounded-2xl"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Food History</h1>
        <p className="text-gray-600">Review your nutrition journey</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Show last:</span>
          <div className="flex space-x-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedDays === days
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      {groupedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No food entries found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No entries match "${searchTerm}"`
              : 'Start tracking your meals to see history'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(([date, dayEntries]) => {
            const stats = getDayStats(dayEntries);
            
            return (
              <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-xl">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{formatDate(date)}</h3>
                        <p className="text-sm text-gray-600">{dayEntries.length} entries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">
                        {Math.round(stats.totalCalories)} cal
                      </p>
                      <p className="text-sm font-semibold text-red-600">
                        {Math.round(stats.totalProtein)}g protein
                      </p>
                    </div>
                  </div>
                </div>

                {/* Entries List */}
                <div className="divide-y divide-gray-100">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {entry.image_path ? (
                            <img
                              src={`${baseUrl}/uploads/${entry.image_path}`}
                              alt={entry.food_name}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                              <HistoryIcon className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-800">{entry.food_name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(entry.entry_time)}</span>
                              <span>•</span>
                              <span>{entry.weight_grams}g</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">
                            {Math.round(entry.calories)} cal
                          </p>
                          <p className="text-sm text-red-600">
                            {Math.round(entry.protein)}g protein
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;