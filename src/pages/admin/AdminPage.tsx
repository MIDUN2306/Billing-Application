import { useState } from 'react';
import { Store, Users, Shield } from 'lucide-react';
import { StoresTab } from './StoresTab';
import { UsersTab } from './UsersTab';
import { RolesTab } from './RolesTab';

type TabType = 'stores' | 'users' | 'roles';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stores');

  const tabs = [
    { id: 'stores' as TabType, name: 'Stores', icon: Store },
    { id: 'users' as TabType, name: 'Users', icon: Users },
    { id: 'roles' as TabType, name: 'Role Management', icon: Shield },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-secondary-900">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-secondary-600">
          Manage stores, users, and permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation - Responsive */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? 'border-primary-800 text-primary-800'
                      : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'stores' && <StoresTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'roles' && <RolesTab />}
        </div>
      </div>
    </div>
  );
}
