import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  X,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Clock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import LoadingSpinner from "../components/LoadingSpinner";
import MockDataBanner from "../components/MockDataBanner";
import { addTransaction } from "../services/api";

const fmt = (n) =>
  new Intl.NumberFormat("th-TH").format(Math.round(Number(n) || 0));

// Format date string (YYYY-MM-DD) → dd/mm/yyyy
const fmtDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Format ISO datetime string → dd/mm/yyyy hh:mm
const fmtDateTime = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// Return current datetime as "YYYY-MM-DDTHH:mm:ss" (for created_at)
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

// Today as YYYY-MM-DD (default value for date picker)
// Today as YYYY-MM-DD (helper, no longer used as default)
const todayStr = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Format user input for amount with thousand separators while typing.
// Accepts digits and at most one decimal point. Keeps commas for display.
const formatNumberInput = (value) => {
  if (value === null || value === undefined) return "";
  let v = String(value);
  // Remove existing commas first
  v = v.replace(/,/g, "");
  // Keep only digits and dot
  v = v.replace(/[^\d.]/g, "");
  // If more than one dot, keep only the first and remove the rest
  const parts = v.split(".");
  const intPart = parts[0] || "";
  const decPart = parts.length > 1 ? parts.slice(1).join("") : "";
  // Format integer part with commas
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${intFormatted}.${decPart}` : intFormatted;
};

// Parse a formatted number string (with commas) back to plain numeric string
const parseNumber = (formatted) => {
  if (formatted === null || formatted === undefined || formatted === "")
    return "";
  return String(formatted).replace(/,/g, "");
};

// ================================================================
// Add Transaction Modal
// ================================================================
function AddTransactionModal({ projects, onClose, onAdd }) {
  const [form, setForm] = useState({
    project_id: projects[0]?.id || "",
    type: "Income",
    amount: "",
    date: "", // transaction date — user selects (default empty so user must pick)
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.amount || Number(form.amount) <= 0) {
      setError("กรุณากรอกโครงการและจำนวนเงิน");
      return;
    }
    if (!form.date) {
      setError("กรุณาเลือกวันที่รายการ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Capture exact timestamp at the moment user hits submit
      const createdAt = nowISOLocal();
      // parse formatted amount (remove commas) before sending/storing
      const parsedAmountStr = parseNumber(form.amount);
      const payload = {
        ...form,
        amount: parsedAmountStr,
        created_at: createdAt,
      };
      const res = await addTransaction(payload);
      const newTx = {
        ...payload,
        id: res.id || `T${Date.now()}`,
        amount: Number(parsedAmountStr),
      };
      onAdd(newTx);
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">เพิ่มรายการใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              ประเภทรายการ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Income", "Cost"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.type === t
                      ? t === "Income"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t === "Income" ? (
                    <ArrowUpCircle className="w-4 h-4" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4" />
                  )}
                  {t === "Income" ? "รายได้ (Income)" : "ต้นทุน (Cost)"}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              โครงการ *
            </label>
            <select
              className={inp}
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              required
            >
              <option value="">-- เลือกโครงการ --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ฿
              </span>
              {/* Use text input so we can show commas while typing */}
              <input
                className={`${inp} pl-7`}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: formatNumberInput(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          {/* Transaction Date — user selects */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              วันที่รายการ{" "}
              <span className="text-gray-400 font-normal">
                (เงินเข้า/ออกจริง)
              </span>
            </label>
            <input
              className={inp}
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            {form.date && (
              <p className="text-xs text-gray-400 mt-1">{fmtDate(form.date)}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              รายละเอียด
            </label>
            <textarea
              className={`${inp} resize-none`}
              rows={3}
              placeholder="อธิบายรายการ..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
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
              className={`flex-1 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 transition-colors ${
                form.type === "Income"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================================================================
// Main Transactions Page
// ================================================================
export default function TransactionsPage() {
  const { state, dispatch } = useApp();
  const { projects, transactions, loading, usingMockData } = state;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterProject, setFilterProject] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Summary stats
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const cost = transactions
      .filter((t) => t.type === "Cost")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { income, cost, net: income - cost, count: transactions.length };
  }, [transactions]);

  // Filtered & sorted (by transaction date desc)
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const project = projects.find((p) => p.id === t.project_id);
        const pName = project?.name || "";
        const matchSearch =
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          pName.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === "All" || t.type === filterType;
        const matchProject =
          filterProject === "All" || t.project_id === filterProject;
        return matchSearch && matchType && matchProject;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, projects, search, filterType, filterProject]);

  const getProjectName = (pid) =>
    projects.find((p) => p.id === pid)?.name || pid;

  const handleAdd = (tx) => {
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
  };

  // CSV Export — includes both transaction date and created_at timestamp
  const handleExport = () => {
    const header = [
      "id",
      "วันที่รายการ",
      "บันทึกเมื่อ",
      "โครงการ",
      "ประเภท",
      "จำนวนเงิน",
      "รายละเอียด",
    ];
    const rows = filtered.map((t) => [
      t.id,
      fmtDate(t.date),
      t.created_at ? fmtDateTime(t.created_at) : "",
      getProjectName(t.project_id),
      t.type,
      t.amount,
      `"${(t.description || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {usingMockData && <MockDataBanner />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            บันทึกรายรับ/รายจ่าย
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Reconciliation - ตรวจสอบรายได้และต้นทุน
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500 font-medium">รายได้รวม</p>
          </div>
          <p className="text-xl font-bold text-green-600">
            ฿{fmt(summary.income)}
          </p>
          <p className="text-xs text-gray-400">
            {transactions.filter((t) => t.type === "Income").length} รายการ
          </p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-500 font-medium">ต้นทุนรวม</p>
          </div>
          <p className="text-xl font-bold text-red-500">฿{fmt(summary.cost)}</p>
          <p className="text-xs text-gray-400">
            {transactions.filter((t) => t.type === "Cost").length} รายการ
          </p>
        </div>
        <div
          className={`bg-white border ${
            summary.net >= 0 ? "border-blue-100" : "border-red-100"
          } rounded-xl p-4 shadow-sm`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">กำไรสุทธิ</p>
          </div>
          <p
            className={`text-xl font-bold ${
              summary.net >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            ฿{fmt(summary.net)}
          </p>
          <p className="text-xs text-gray-400">
            ทั้งหมด {summary.count} รายการ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหารายการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Income", "Cost"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? t === "Income"
                    ? "bg-green-600 text-white"
                    : t === "Cost"
                      ? "bg-red-500 text-white"
                      : "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {{ All: "ทั้งหมด", Income: "+ รายได้", Cost: "- ต้นทุน" }[t]}
            </button>
          ))}
        </div>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
        >
          <option value="All">ทุกโครงการ</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ไม่พบรายการที่ตรงกัน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs">
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    วันที่รายการ
                  </th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    บันทึกเมื่อ
                  </th>
                  <th className="px-4 py-3 text-left font-medium">โครงการ</th>
                  <th className="px-4 py-3 text-left font-medium">ประเภท</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    จำนวนเงิน
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-gray-50/30"
                    }`}
                  >
                    {/* Transaction date — user-selected */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs font-medium">
                      {fmtDate(t.date)}
                    </td>
                    {/* created_at timestamp — auto */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {t.created_at ? (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3 shrink-0" />
                          {fmtDateTime(t.created_at)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium max-w-[160px] truncate">
                      {getProjectName(t.project_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          t.type === "Income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.type === "Income" ? (
                          <ArrowUpCircle className="w-3 h-3" />
                        ) : (
                          <ArrowDownCircle className="w-3 h-3" />
                        )}
                        {t.type === "Income" ? "รายได้" : "ต้นทุน"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                        t.type === "Income" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {t.type === "Income" ? "+" : "-"}฿{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                      {t.description}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-100 font-semibold text-sm">
                  <td colSpan={4} className="px-4 py-3 text-gray-600">
                    รวม ({filtered.length} รายการ)
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-600 block text-xs">
                      +฿
                      {fmt(
                        filtered
                          .filter((t) => t.type === "Income")
                          .reduce((s, t) => s + Number(t.amount), 0),
                      )}
                    </span>
                    <span className="text-red-500 block text-xs">
                      -฿
                      {fmt(
                        filtered
                          .filter((t) => t.type === "Cost")
                          .reduce((s, t) => s + Number(t.amount), 0),
                      )}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddTransactionModal
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
