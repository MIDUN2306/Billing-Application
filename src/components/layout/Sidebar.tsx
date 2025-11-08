import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Milk,
  X,
  Receipt,
  Wallet,
  Shield,
  Coffee
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['staff', 'manager', 'admin'] },
  { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['staff', 'manager', 'admin'] },
  { name: 'Sales History', href: '/sales/history', icon: Receipt, roles: ['staff', 'manager', 'admin'] },
  { name: 'Preparation', href: '/preparation', icon: Coffee, roles: ['staff', 'manager', 'admin'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['staff', 'manager', 'admin'] },
  { name: 'Stock', href: '/raw-materials', icon: Milk, roles: ['staff', 'manager', 'admin'] },
  { name: 'Petty Cash', href: '/petty-cash', icon: Wallet, roles: ['staff', 'manager', 'admin'] },
  { name: 'Admin Panel', href: '/admin', icon: Shield, roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile } = useAuthStore();

  const filteredNavigation = navigation.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Close Button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-xl font-display font-bold text-primary-800">
            DISA Info Tech
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-secondary-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-secondary-600 hover:bg-gray-50 hover:text-secondary-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-800 font-semibold">
                {profile?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-secondary-500 capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
