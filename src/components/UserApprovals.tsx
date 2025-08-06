import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PendingUser {
  id: number;
  name: string;
  email: string;
  profile_photo?: string;
  goal: string;
  body_type: string;
  created_at: string;
}

const UserApprovals: React.FC = () => {
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/pending-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setPendingUsers(users);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: number, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`${baseUrl}/api/admin/users/${userId}/approval`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Remove user from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">User Approvals</h1>
        <p className="text-gray-600">Review and approve new user registrations</p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{pendingUsers.length}</h2>
            <p className="text-purple-100">Pending Approvals</p>
          </div>
          <Clock className="h-12 w-12 text-purple-200" />
        </div>
      </div>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending user approvals at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => {
            const isProcessing = processingIds.has(user.id);
            
            return (
              <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start space-x-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {user.profile_photo ? (
                      <img
                        src={`${baseUrl}/uploads/${user.profile_photo}`}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                        <UserCheck className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {user.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {getTimeAgo(user.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{user.email}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.body_type}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.goal}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleUserAction(user.id, 'approve')}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleUserAction(user.id, 'reject')}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserApprovals;