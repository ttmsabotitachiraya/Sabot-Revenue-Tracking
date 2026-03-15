import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Plus,
  Search,
  X,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit3,
  Check,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import MockDataBanner from "../components/MockDataBanner";
import { addProject, updateProjectStatus } from "../services/api";

const fmt = (n) =>
  new Intl.NumberFormat("th-TH").format(Math.round(Number(n) || 0));
const fmtShort = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}ล.`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
};

// Format number input with commas while typing (keeps decimals)
const formatNumberInput = (value) => {
  if (value === null || value === undefined) return "";
  let v = String(value).replace(/,/g, "");
  // keep only digits and dot
  v = v.replace(/[^\d.]/g, "");
  // If multiple dots, keep first and discard others
  const parts = v.split(".");
  const intPart = parts[0] || "";
  const decPart = parts.length > 1 ? parts.slice(1).join("") : "";
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${intFormatted}.${decPart}` : intFormatted;
};

// Parse formatted number (remove commas) before numeric conversion
const parseNumber = (formatted) => {
  if (formatted === null || formatted === undefined || formatted === "")
    return "";
  return String(formatted).replace(/,/g, "");
};

// Return current datetime as "YYYY-MM-DDTHH:mm:ss"
const nowISOLocal = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
};

// Format date string → dd/mm/yyyy
const fmtDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ================================================================
// Project Detail Modal
// ================================================================
function ProjectDetailModal({
  project,
  transactions,
  onClose,
  onStatusUpdate,
}) {
  const projectTx = useMemo(
    () => transactions.filter((t) => t.project_id === project.id),
    [transactions, project.id],
  );
  const income = projectTx
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const cost = projectTx
    .filter((t) => t.type === "Cost")
    .reduce((s, t) => s + Number(t.amount), 0);
  const netProfit = income - cost;
  const pct =
    project.target_revenue > 0 ? (income / project.target_revenue) * 100 : 0;
  const costPct =
    project.estimated_cost > 0 ? (cost / project.estimated_cost) * 100 : 0;

  const chartData = useMemo(() => {
    const monthMap = {};
    projectTx.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("th-TH", {
        month: "short",
        year: "2-digit",
      });
      if (!monthMap[key])
        monthMap[key] = { key, label, income: 0, cost: 0, cumIncome: 0 };
      if (t.type === "Income") monthMap[key].income += Number(t.amount);
      if (t.type === "Cost") monthMap[key].cost += Number(t.amount);
    });
    const sorted = Object.values(monthMap).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
    let cum = 0;
    sorted.forEach((m) => {
      cum += m.income;
      m.cumIncome = cum;
    });
    return sorted;
  }, [projectTx]);

  // Removed "Paused" status here as requested.
  const statusMap = {
    Active: { label: "กำลังดำเนินการ", color: "bg-blue-100 text-blue-700" },
    Completed: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700" },
    Cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-gray-800 leading-snug">
              {project.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusMap[project.status]?.color || "bg-gray-100 text-gray-600"}`}
              >
                {statusMap[project.status]?.label || project.status}
              </span>
              <span className="text-xs text-gray-400">
                {fmtDate(project.start_date)} — {fmtDate(project.end_date)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "รายได้จริง",
                value: `฿${fmt(income)}`,
                sub: `เป้า ฿${fmtShort(project.target_revenue)}`,
                color: "text-blue-600",
              },
              {
                label: "ต้นทุนจริง",
                value: `฿${fmt(cost)}`,
                sub: `ประมาณ ฿${fmtShort(project.estimated_cost)}`,
                color: "text-red-500",
              },
              {
                label: "กำไรสุทธิ",
                value: `฿${fmt(netProfit)}`,
                sub: "รายได้ - ต้นทุน",
                color: netProfit >= 0 ? "text-green-600" : "text-red-600",
              },
              {
                label: "% สำเร็จ",
                value: `${pct.toFixed(1)}%`,
                sub: `ต้นทุน ${costPct.toFixed(0)}%`,
                color:
                  pct >= 100
                    ? "text-green-600"
                    : pct >= 50
                      ? "text-blue-600"
                      : "text-yellow-600",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-gray-50 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>ความคืบหน้ารายได้</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <ProgressBar
                value={income}
                max={Number(project.target_revenue)}
                color={pct >= 100 ? "green" : pct >= 50 ? "blue" : "yellow"}
                showPercent={false}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>การใช้ต้นทุน</span>
                <span>{costPct.toFixed(1)}%</span>
              </div>
              <ProgressBar
                value={cost}
                max={Number(project.estimated_cost)}
                color={
                  costPct >= 100 ? "red" : costPct >= 80 ? "yellow" : "green"
                }
                showPercent={false}
              />
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                แนวโน้มรายเดือน
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `฿${fmt(v)}`} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#2563EB"
                    name="รายได้"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#EF4444"
                    name="ต้นทุน"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Transactions */}
          {projectTx.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                รายการล่าสุด
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[...projectTx]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-gray-400 w-24 shrink-0">
                        {fmtDate(t.date)}
                      </span>
                      <span className="text-gray-600 flex-1 truncate px-2">
                        {t.description || "-"}
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${t.type === "Income" ? "text-green-600" : "text-red-500"}`}
                      >
                        {t.type === "Income" ? "+" : "-"}฿{fmt(t.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              อัปเดตสถานะ
            </p>
            <div className="flex gap-2 flex-wrap">
              {["Active", "Completed", "Cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusUpdate(project.id, s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    project.status === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {statusMap[s]?.label || s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Add Project Modal — no department field
// ================================================================
function AddProjectModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    target_revenue: "",
    estimated_cost: "",
    start_date: "",
    end_date: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อโครงการ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Capture exact timestamp at the moment user hits submit
      const createdAt = nowISOLocal();
      const payload = {
        ...form,
        department: "",
        created_at: createdAt,
        target_revenue: Number(parseNumber(form.target_revenue)) || 0,
        estimated_cost: Number(parseNumber(form.estimated_cost)) || 0,
      };
      const res = await addProject(payload);
      const newProject = {
        ...payload,
        id: res.id || `P${Date.now()}`,
        target_revenue: Number(parseNumber(form.target_revenue)) || 0,
        estimated_cost: Number(parseNumber(form.estimated_cost)) || 0,
        created_at: createdAt,
      };
      onAdd(newProject);
      onClose();
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">เพิ่มโครงการใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              ชื่อโครงการ *
            </label>
            <input
              className={inp}
              placeholder="เช่น โครงการตรวจสุขภาพ..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Revenue & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                เป้าหมายรายได้ (บาท)
              </label>
              <input
                className={inp}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.target_revenue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    target_revenue: formatNumberInput(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                ประมาณการต้นทุน (บาท)
              </label>
              <input
                className={inp}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.estimated_cost}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_cost: formatNumberInput(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                วันที่เริ่ม
              </label>
              <input
                className={inp}
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
              {form.start_date && (
                <p className="text-xs text-gray-400 mt-1">
                  {fmtDate(form.start_date)}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                วันที่สิ้นสุด
              </label>
              <input
                className={inp}
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
              {form.end_date && (
                <p className="text-xs text-gray-400 mt-1">
                  {fmtDate(form.end_date)}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              สถานะ
            </label>
            <select
              className={inp}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Active">กำลังดำเนินการ</option>
              <option value="Completed">เสร็จสิ้น</option>
              <option value="Cancelled">ยกเลิก</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกโครงการ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================================================================
// Main Projects Page
// ================================================================
export default function ProjectsPage() {
  const { state, dispatch } = useApp();
  const { projects, transactions, loading, usingMockData } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.department || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [projects, search, filterStatus]);

  const getProjectStats = (p) => {
    const income = transactions
      .filter((t) => t.project_id === p.id && t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const cost = transactions
      .filter((t) => t.project_id === p.id && t.type === "Cost")
      .reduce((s, t) => s + Number(t.amount), 0);
    const pct = p.target_revenue > 0 ? (income / p.target_revenue) * 100 : 0;
    return { income, cost, pct };
  };

  const handleAddProject = (project) => {
    dispatch({ type: "ADD_PROJECT", payload: project });
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateProjectStatus({ id, status });
      dispatch({ type: "UPDATE_PROJECT_STATUS", payload: { id, status } });
      if (selectedProject?.id === id) {
        setSelectedProject((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Update status failed:", err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {usingMockData && <MockDataBanner />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายการโครงการ</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            ทั้งหมด {projects.length} โครงการ
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มโครงการ
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาโครงการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Completed", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {
                {
                  All: "ทั้งหมด",
                  Active: "กำลังดำเนินการ",
                  Completed: "เสร็จสิ้น",
                  Cancelled: "ยกเลิก",
                }[s]
              }
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ไม่พบโครงการที่ตรงกัน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const { income, cost, pct } = getProjectStats(p);
            const color = pct >= 100 ? "green" : pct >= 50 ? "blue" : "yellow";
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-700 transition-colors truncate">
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge status={p.status} />
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>

                {/* Progress bar with % label */}
                <div className="mb-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">ความคืบหน้า</span>
                    <span className="text-xs text-gray-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={income}
                    max={Number(p.target_revenue)}
                    color={color}
                    showPercent={false}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">รายได้จริง</p>
                    <p className="font-semibold text-blue-600">
                      ฿{fmt(income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">เป้าหมาย</p>
                    <p className="font-semibold text-gray-700">
                      ฿{fmt(p.target_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ต้นทุนจริง</p>
                    <p className="font-semibold text-red-500">฿{fmt(cost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">% สำเร็จ</p>
                    <p
                      className={`font-bold ${
                        pct >= 100
                          ? "text-green-600"
                          : pct >= 50
                            ? "text-blue-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {pct.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          transactions={transactions}
          onClose={() => setSelectedProject(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProject}
        />
      )}
    </div>
  );
}
