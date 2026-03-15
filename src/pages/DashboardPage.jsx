import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  AlertCircle,
  ExternalLink,
  Coins,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import MockDataBanner from "../components/MockDataBanner";

const fmt = (n) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(
    Math.round(n),
  );
const fmtShort = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}ล.`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
};

const fmtFull = (n) =>
  `${new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(Math.round(n))} บาท`;

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function DashboardPage({ setActivePage }) {
  const { state } = useApp();
  const { projects, transactions, loading, usingMockData } = state;

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const cost = transactions
      .filter((t) => t.type === "Cost")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalTarget = projects.reduce(
      (s, p) => s + Number(p.target_revenue),
      0,
    );
    const totalEstCost = projects.reduce(
      (s, p) => s + Number(p.estimated_cost),
      0,
    );
    const netProfit = income - cost;

    return { income, cost, totalTarget, totalEstCost, netProfit };
  }, [projects, transactions]);

  // Per-project income vs cost bar chart data
  const projectCompareData = useMemo(() => {
    return projects.map((p) => {
      const income = transactions
        .filter((t) => t.project_id === p.id && t.type === "Income")
        .reduce((s, t) => s + Number(t.amount), 0);
      const cost = transactions
        .filter((t) => t.project_id === p.id && t.type === "Cost")
        .reduce((s, t) => s + Number(t.amount), 0);
      return {
        name: p.name,
        income,
        cost,
      };
    });
  }, [projects, transactions]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const monthMap = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("th-TH", {
        month: "short",
        year: "2-digit",
      });
      if (!monthMap[key]) monthMap[key] = { key, label, income: 0, cost: 0 };
      if (t.type === "Income") monthMap[key].income += Number(t.amount);
      if (t.type === "Cost") monthMap[key].cost += Number(t.amount);
    });
    return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  // Pie data for project status
  const pieData = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      // Treat "Paused" as "Cancelled" so it doesn't appear separately in the pie/legend
      const status = p.status === "Paused" ? "Cancelled" : p.status;
      map[status] = (map[status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Custom X-axis tick to wrap long project names
  const CustomXAxisTick = ({ x, y, payload }) => {
    const words = payload.value.split("");
    const maxChars = 8;
    const lines = [];
    let current = "";
    for (let i = 0; i < payload.value.length; i++) {
      current += payload.value[i];
      if (current.length >= maxChars) {
        lines.push(current);
        current = "";
      }
    }
    if (current) lines.push(current);
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={0}
            dy={12 + i * 13}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={10}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {usingMockData && <MockDataBanner />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard ภาพรวมรายได้
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          ติดตามและเปรียบเทียบเป้าหมายกับผลลัพธ์จริง
        </p>
      </div>

      {/* Stat Cards — 3 cards (removed ความสำเร็จโดยรวม) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="รายได้รวมจริง"
          value={`฿${fmt(stats.income)}`}
          subtitle={`เป้าหมาย ${fmtFull(stats.totalTarget)}`}
          icon={Coins}
          color="blue"
        />
        <StatCard
          title="ต้นทุนจริง"
          value={`฿${fmt(stats.cost)}`}
          subtitle={`ประมาณการ ${fmtFull(stats.totalEstCost)}`}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="กำไรสุทธิ"
          value={`฿${fmt(stats.netProfit)}`}
          subtitle="รายได้ - ต้นทุน"
          icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={stats.netProfit >= 0 ? "green" : "red"}
        />
      </div>

      {/* Revenue vs Target Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          ความคืบหน้าต่อเป้าหมายรายโครงการ
        </h2>
        <div className="space-y-4">
          {projects.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              ยังไม่มีโครงการ
            </p>
          )}
          {[...projects]
            .sort((a, b) => {
              const order = { Active: 0, Completed: 1, Cancelled: 2 };
              const ao = order[a.status] ?? 0;
              const bo = order[b.status] ?? 0;
              return ao - bo;
            })
            .map((p) => {
              const projectIncome = transactions
                .filter((t) => t.project_id === p.id && t.type === "Income")
                .reduce((s, t) => s + Number(t.amount), 0);
              const pct =
                p.target_revenue > 0
                  ? (projectIncome / p.target_revenue) * 100
                  : 0;
              const color =
                pct >= 100 ? "green" : pct >= 50 ? "blue" : "yellow";
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-700 font-medium truncate max-w-xs">
                        {p.name}
                      </span>
                      <span className="text-gray-400 text-xs shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-gray-500 ml-2 shrink-0 text-xs">
                      ฿{fmt(projectIncome)} / ฿{fmt(p.target_revenue)}
                    </span>
                  </div>
                  <ProgressBar
                    value={projectIncome}
                    max={Number(p.target_revenue)}
                    color={color}
                    showPercent={false}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">
            แนวโน้มรายได้รายเดือน
          </h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `฿${fmt(v)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#2563EB"
                  name="รายได้"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#EF4444"
                  name="ต้นทุน"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              ยังไม่มีข้อมูล
            </div>
          )}
        </div>

        {/* Project Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">สถานะโครงการ</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  formatter={(v) => {
                    const map = {
                      Active: "กำลังดำเนินการ",
                      Completed: "เสร็จสิ้น",
                      Cancelled: "ยกเลิก",
                    };
                    return map[v] || v;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              ยังไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* Per-Project Income vs Cost Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">
          เปรียบเทียบรายได้(จริง)และต้นทุน(จริง)ของแต่ละโครงการ
        </h2>
        {projectCompareData.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={Math.max(
              260,
              Math.ceil(projectCompareData.length / 4) * 260,
            )}
          >
            <BarChart
              data={projectCompareData}
              margin={{
                top: 10,
                right: 16,
                left: 0,
                bottom: projectCompareData.length > 4 ? 60 : 40,
              }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={({ x, y, payload }) => {
                  const maxLen = 10;
                  const val = payload.value;
                  const display =
                    val.length > maxLen ? val.slice(0, maxLen) + "…" : val;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={10}
                      >
                        {display}
                      </text>
                    </g>
                  );
                }}
                interval={0}
              />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [`฿${fmt(v)}`, name]}
                labelFormatter={(label) => `โครงการ: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="income"
                fill="#2563EB"
                name="รายได้จริง"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cost"
                fill="#EF4444"
                name="ต้นทุนจริง"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
            ยังไม่มีข้อมูล
          </div>
        )}
      </div>

      {/* Quick Links — renamed to ลิงก์ระบบงานที่เกี่ยวข้อง */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium mb-3">
          ลิงก์ระบบงานที่เกี่ยวข้อง
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="https://sabot-financial-plan.rxdevman.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white text-blue-700 text-sm px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ระบบเสนองบประมาณ
          </a>
          <a
            href="https://sabot-revenue-tracking.rxdevman.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white text-blue-700 text-sm px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ระบบจัดหา/จัดเก็บรายได้
          </a>
        </div>
      </div>
    </div>
  );
}
