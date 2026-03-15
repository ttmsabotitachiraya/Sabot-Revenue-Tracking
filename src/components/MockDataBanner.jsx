import React from "react";
import { Info } from "lucide-react";

export default function MockDataBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-amber-800 text-sm font-medium">
          กำลังแสดงข้อมูลตัวอย่าง (Demo Mode)
        </p>
        <p className="text-amber-600 text-xs mt-0.5">
          ระบบอินเตอร์เน็ตขัดข้อง ไม่สามารถเชื่อมต่อ{" "}
          <code className="bg-amber-100 px-1 rounded">VITE_GAS_URL</code> ใน{" "}
          <code className="bg-amber-100 px-1 rounded">.env</code>{" "}
          กรุณาเชื่อมต่ออินเตอร์เน็ตก่อนใช้งาน
        </p>
      </div>
    </div>
  );
}
