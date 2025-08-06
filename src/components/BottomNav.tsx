import React from 'react';
import { Home, Plus, TrendingUp, History, User, UserCheck } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isAdmin: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'add-food', icon: Plus, label: 'Add Food' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
    ...(isAdmin ? [{ id: 'approvals', icon: UserCheck, label: 'Approvals' }] : [])
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;