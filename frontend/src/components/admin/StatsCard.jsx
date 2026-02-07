import React from 'react';

const StatsCard = ({ title, value, icon: Icon, change, changeType, color = 'primary' }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${
              changeType === 'increase' ? 'text-green-500' : 
              changeType === 'decrease' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : ''} {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;