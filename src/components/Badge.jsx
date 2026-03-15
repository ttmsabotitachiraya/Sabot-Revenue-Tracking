import React from "react";

const statusConfig = {
  Active: {
    label: "กำลังดำเนินการ",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  Completed: {
    label: "เสร็จสิ้น",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  Cancelled: {
    label: "ยกเลิก",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
};

export default function Badge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: "currentColor" }}
      />
      {config.label}
    </span>
  );
}
