interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: 'indigo' | 'green' | 'purple' | 'blue' | 'yellow' | 'gray' | 'red';
}

export default function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className = '',
  color = 'indigo'
}: StatsCardProps) {
  const colorClasses = {
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      icon: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      icon: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      icon: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      icon: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      icon: 'bg-yellow-600',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      icon: 'bg-gray-600',
      text: 'text-gray-600',
      border: 'border-gray-200'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      icon: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white overflow-hidden shadow-lg rounded-xl border ${colors.border} hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center shadow-lg`}>
                <div className="text-white">
                  {icon}
                </div>
              </div>
            </div>
          )}
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-600 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-1">
                      {trend.isPositive ? '↗' : '↘'}
                    </span>
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
              {description && (
                <dd className="text-sm text-gray-500 mt-2">
                  {description}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
      <div className={`h-1 ${colors.bg}`}></div>
    </div>
  );
} 