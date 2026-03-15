import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'bg-green-600', text: 'text-green-600', border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-100' },
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% จากเดือนก่อน
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${c.icon} rounded-xl p-2.5 ml-3`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
