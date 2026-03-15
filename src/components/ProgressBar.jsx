import React from 'react';

export default function ProgressBar({ value, max, label, color = 'blue', showPercent = true }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
  }[color] || 'bg-blue-500';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          {showPercent && (
            <span className="text-sm font-semibold text-gray-700">{pct.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
