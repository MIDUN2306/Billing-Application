import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  FileText,
  Settings,
  Coffee
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { isManager } from '../../lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['staff', 'manager', 'admin'] },
  { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['staff', 'manager', 'admin'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['staff', 'manager', 'admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['staff', 'manager', 'admin'] },
  { name: 'Purchases', href: '/purchases', icon: TrendingUp, roles: ['staff', 'manager', 'admin'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['manager', 'admin'] },
  { name: 'Tea Boys', href: '/tea-boys', icon: Coffee, roles: ['manager', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { profile } = useAuthStore();

  const filteredNavigation = navigation.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-display font-bold text-primary-800">
          Tea Boys POS
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
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
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
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
  );
}
