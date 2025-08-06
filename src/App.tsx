import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddFood from './components/AddFood';
import Progress from './components/Progress';
import History from './components/History';
import Profile from './components/Profile';
import UserApprovals from './components/UserApprovals';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Saapudu Bro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Dashboard />;
      case 'add-food':
        return <AddFood />;
      case 'progress':
        return <Progress />;
      case 'history':
        return <History />;
      case 'profile':
        return <Profile />;
      case 'approvals':
        return user.isAdmin ? <UserApprovals /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-center">Saapudu Bro 💪</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {renderCurrentPage()}
        </div>

        {/* Bottom Navigation */}
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={user.isAdmin} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;