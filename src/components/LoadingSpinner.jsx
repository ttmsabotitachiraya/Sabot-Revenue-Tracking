import React from 'react';
import { Activity } from 'lucide-react';

export default function LoadingSpinner({ message = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <Activity className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
