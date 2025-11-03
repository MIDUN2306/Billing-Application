import { Shield, Users, CheckCircle2 } from 'lucide-react';

export function RolesTab() {
  const roles = [
    {
      name: 'Admin',
      value: 'admin',
      color: 'red',
      description: 'Full system access with all permissions',
      permissions: [
        'Create and manage stores',
        'Create and manage users',
        'Assign and change user roles',
        'Transfer users between stores',
        'Access all store data',
        'View and manage all transactions',
        'Configure system settings',
        'Access admin panel',
        'All manager and staff permissions',
      ],
    },
    {
      name: 'Manager',
      value: 'manager',
      color: 'blue',
      description: 'Store management with elevated permissions',
      permissions: [
        'View dashboard and reports',
        'Manage products and inventory',
        'Process sales and refunds',
        'Manage purchases and suppliers',
        'Record expenses',
        'Manage petty cash',
        'View sales history',
        'Manage raw materials',
        'All staff permissions',
      ],
    },
    {
      name: 'Staff',
      value: 'staff',
      color: 'green',
      description: 'Basic operational access',
      permissions: [
        'View dashboard',
        'Process sales (POS)',
        'View sales history',
        'View products',
        'View raw materials',
        'View petty cash records',
        'Limited access to reports',
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
        icon: 'text-red-600',
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800',
        icon: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-800',
        icon: 'text-green-600',
      },
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Role-Based Access Control
            </h3>
            <p className="text-sm text-blue-800">
              The system uses three role levels to control access. Each role has specific permissions that determine what users can see and do.
            </p>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {roles.map((role) => {
          const colors = getColorClasses(role.color);
          return (
            <div
              key={role.value}
              className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 sm:p-6`}
            >
              {/* Role Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.badge}`}>
                  <Shield className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${colors.text}`}>
                    {role.name}
                  </h3>
                  <span className={`text-xs font-medium ${colors.badge} px-2 py-1 rounded-full`}>
                    {role.value}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className={`text-sm ${colors.text} mb-4`}>
                {role.description}
              </p>

              {/* Permissions */}
              <div>
                <h4 className={`text-xs font-semibold ${colors.text} uppercase tracking-wider mb-3`}>
                  Permissions
                </h4>
                <ul className="space-y-2">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} />
                      <span className={`text-sm ${colors.text}`}>
                        {permission}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Hierarchy Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">
                Role Hierarchy
              </h3>
              <p className="text-sm text-secondary-700">
                Roles follow a hierarchical structure: Admin → Manager → Staff
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-secondary-700">
              <div className="flex items-start gap-2">
                <span className="font-medium text-secondary-900 min-w-[80px]">Admin:</span>
                <span>Has all permissions and can manage the entire system including creating stores and users.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-secondary-900 min-w-[80px]">Manager:</span>
                <span>Can manage store operations, inventory, and transactions but cannot create users or stores.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-secondary-900 min-w-[80px]">Staff:</span>
                <span>Can perform daily operations like processing sales and viewing basic information.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-300">
              <p className="text-xs text-secondary-600">
                <span className="font-medium">Note:</span> To change a user's role, go to the Users tab and edit the user's details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
