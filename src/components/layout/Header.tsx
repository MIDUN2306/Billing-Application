import { Bell, LogOut, Store, Menu } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useStoreStore } from '../../stores/storeStore';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut, profile } = useAuthStore();
  const { currentStore } = useStoreStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-secondary-600" />
        </button>

        {/* Store Info */}
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary-800 flex-shrink-0" />
          <span className="font-medium text-secondary-900 truncate max-w-[150px] sm:max-w-none">
            {currentStore?.name || 'No Store'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-secondary-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info - Desktop */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-800 font-semibold text-sm">
              {profile?.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-xs font-medium text-secondary-900 truncate">
              {profile?.full_name}
            </p>
            <p className="text-xs text-secondary-500 capitalize">
              {profile?.role}
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
