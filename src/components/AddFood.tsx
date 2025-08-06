import React, { useState } from 'react';
import { Camera, Plus, Utensils, Scale, Zap, Beef, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AddFood: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  const [manualData, setManualData] = useState({
    foodName: '',
    weight: '',
    calories: '',
    protein: ''
  });

  const [cameraData, setCameraData] = useState({
    foodName: '',
    weight: '',
    calories: '',
    protein: '',
    image: null as File | null
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('foodName', manualData.foodName);
      formData.append('weight', manualData.weight);
      formData.append('calories', manualData.calories);
      formData.append('protein', manualData.protein);

      const response = await fetch(`${baseUrl}/api/food-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setManualData({ foodName: '', weight: '', calories: '', protein: '' });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error adding food entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setCameraData({ ...cameraData, image: file });

    try {
      const formData = new FormData();
      formData.append('foodImage', file);

      const response = await fetch(`${baseUrl}/api/analyze-food-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCameraData({
          ...cameraData,
          image: file,
          foodName: data.analysis.foodName,
          weight: data.analysis.weight.toString(),
          calories: data.analysis.calories.toString(),
          protein: data.analysis.protein.toString()
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('foodName', cameraData.foodName);
      formData.append('weight', cameraData.weight);
      formData.append('calories', cameraData.calories);
      formData.append('protein', cameraData.protein);
      if (cameraData.image) {
        formData.append('foodImage', cameraData.image);
      }

      const response = await fetch(`${baseUrl}/api/food-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setCameraData({ foodName: '', weight: '', calories: '', protein: '', image: null });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error adding food entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Add Food Entry</h1>
        <p className="text-gray-600">Track your nutrition intake</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-800 font-semibold">Food entry added successfully! 🎉</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-gray-100 rounded-2xl p-1 flex">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'manual'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Utensils className="h-5 w-5" />
          <span>Manual Entry</span>
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'camera'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span>AI Camera</span>
        </button>
      </div>

      {/* Manual Entry Form */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Name
              </label>
              <div className="relative">
                <Utensils className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={manualData.foodName}
                  onChange={(e) => setManualData({ ...manualData, foodName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Chicken Breast"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (grams)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={manualData.weight}
                  onChange={(e) => setManualData({ ...manualData, weight: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={manualData.calories}
                    onChange={(e) => setManualData({ ...manualData, calories: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="165"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g)
                </label>
                <div className="relative">
                  <Beef className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={manualData.protein}
                    onChange={(e) => setManualData({ ...manualData, protein: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="31"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Food Entry
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Camera Entry Form */}
      {activeTab === 'camera' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Food Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-400 transition-colors">
                <div className="space-y-2 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                      <span>Upload an image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            {analyzing && (
              <div className="text-center py-4">
                <Loader className="animate-spin h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">Analyzing image with AI...</p>
              </div>
            )}

            {/* AI Analysis Results */}
            {cameraData.foodName && !analyzing && (
              <form onSubmit={handleCameraSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 font-medium text-sm">AI Analysis Complete! Review and adjust if needed:</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Name
                  </label>
                  <input
                    type="text"
                    value={cameraData.foodName}
                    onChange={(e) => setCameraData({ ...cameraData, foodName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    value={cameraData.weight}
                    onChange={(e) => setCameraData({ ...cameraData, weight: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={cameraData.calories}
                      onChange={(e) => setCameraData({ ...cameraData, calories: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={cameraData.protein}
                      onChange={(e) => setCameraData({ ...cameraData, protein: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add Food Entry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFood;