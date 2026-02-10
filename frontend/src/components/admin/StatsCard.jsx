import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'primary', change = null }) => {
  const colors = {
    primary: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-500',
      border: 'border-red-100 dark:border-red-800/30',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-500',
      border: 'border-blue-100 dark:border-blue-800/30',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-500',
      border: 'border-green-100 dark:border-green-800/30',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-500',
      border: 'border-yellow-100 dark:border-yellow-800/30',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-500',
      border: 'border-purple-100 dark:border-purple-800/30',
    },
  };

  const colorSet = colors[color] || colors.primary;

  return (
    <div className={`bg-white dark:bg-dark-200 rounded-xl p-4 sm:p-6 border ${colorSet.border} transition-all hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{change}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 ${colorSet.bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colorSet.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;