import React from "react";
import {
  CoinsIcon,
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Settings,
} from "lucide-react";

export default function Navbar({ activePage, setActivePage }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "โครงการ", icon: FolderKanban },
    { id: "transactions", label: "บันทึกรายรับ/รายจ่าย", icon: Receipt },
  ];

  return (
    <nav className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <CoinsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-blue-700 font-bold text-lg leading-none block">
                ระบบจัดหาและจัดเก็บรายได้
              </span>
              <span className="text-gray-400 text-xs leading-none">
                Sabot Revenue Tracking
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activePage === id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
