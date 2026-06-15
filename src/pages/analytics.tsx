import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "../lib/api";
import { titleCase } from "../lib/format";
import {
  Card,
  LoadingState,
  ErrorState,
  PageHeader,
} from "../components/ui";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ShoppingBag, TrendingUp } from "lucide-react";

interface ProductPerformance {
  productName: string;
  category: string;
  orders: number;
  revenue: number;
  averageOrderValue: number;
}

interface AnalyticsResponse {
  products: ProductPerformance[];
  dailyTrends: Array<Record<string, string | number>>;
  weeklyTrends: Array<Record<string, string | number>>;
}

const LINE_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#f97316",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#eab308",
  "#06b6d4",
];

export function AnalyticsPage() {
  const [reportTab, setReportTab] = useState<"daily" | "weekly">("daily");
  const [metricTab, setMetricTab] = useState<"orders" | "revenue">("orders");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

  const analytics = useQuery({
    queryKey: ["product-analytics"],
    queryFn: () => api<AnalyticsResponse>("/api/analytics/products"),
    staleTime: 5 * 60_000,
  });

  const products = useMemo(() => analytics.data?.products ?? [], [analytics.data]);

  const toggleProduct = (name: string) => {
    setSelectedProducts((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const activeProductNames = useMemo(() => {
    if (products.length === 0) return [];
    const selected = Object.keys(selectedProducts).filter((k) => selectedProducts[k]);
    return selected.length === 0 ? products.map((p) => p.productName) : selected;
  }, [products, selectedProducts]);

  const totalOrders = useMemo(() => products.reduce((s, p) => s + p.orders, 0), [products]);
  const totalRevenue = useMemo(() => products.reduce((s, p) => s + p.revenue, 0), [products]);

  if (analytics.isLoading) return <LoadingState />;
  if (analytics.error) return <ErrorState error={analytics.error} />;

  const chartData = (reportTab === "daily" ? analytics.data?.dailyTrends : analytics.data?.weeklyTrends) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Intelligence Reports"
        title="Product Analytics"
        description="Compare order volume and revenue across the full GlowCare catalog, daily or weekly."
      />

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Products tracked", value: products.length, color: "text-indigo-600" },
          { label: "Total orders", value: totalOrders.toLocaleString(), color: "text-sky-600" },
          { label: "Total revenue", value: `INR ${Math.round(totalRevenue).toLocaleString("en-IN")}`, color: "text-amber-600" },
          { label: "Avg AOV", value: products.length > 0 ? `INR ${Math.round(totalRevenue / (totalOrders || 1)).toLocaleString("en-IN")}` : "-", color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-card">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-2 text-xl font-bold tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => setMetricTab("orders")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricTab === "orders" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShoppingBag className="h-3 w-3" /> Orders
              </button>
              <button
                onClick={() => setMetricTab("revenue")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricTab === "revenue" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp className="h-3 w-3" /> Revenue
              </button>
            </div>

            <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
              {(["daily", "weekly"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReportTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                    reportTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={reportTab === "daily" ? "date" : "week"}
                  stroke="#e2e8f0"
                  fontSize={10}
                  tickLine={false}
                  dy={10}
                  tick={{ fill: "#94a3b8" }}
                />
                <YAxis
                  stroke="#e2e8f0"
                  fontSize={10}
                  tickLine={false}
                  dx={-5}
                  tick={{ fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    color: "#0f172a",
                    fontSize: "11px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                  formatter={(value, name) => {
                    const seriesName = String(name ?? "");
                    const numericValue = Number(value ?? 0);
                    const cleanName = seriesName.replace(/_(orders|revenue)$/, "");
                    const isRevenue = seriesName.endsWith("_revenue");
                    return [
                      isRevenue
                        ? `INR ${Math.round(numericValue).toLocaleString("en-IN")}`
                        : `${numericValue} orders`,
                      cleanName,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="left"
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "20px", color: "#64748b", fontWeight: "600" }}
                />
                {activeProductNames.map((pName, index) => (
                  <Line
                    key={pName}
                    type="monotone"
                    dataKey={`${pName}_${metricTab}`}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    name={pName}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-900">Filter Products</h3>
            </div>
            <p className="text-[11px] leading-4 text-slate-400 mb-4">
              Toggle product overlays. When none are checked, all are plotted.
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {products.map((p, index) => {
                const isChecked = Boolean(selectedProducts[p.productName]);
                const isActive = activeProductNames.includes(p.productName);
                return (
                  <label
                    key={p.productName}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all ${
                      isChecked ? "border-slate-200 bg-slate-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleProduct(p.productName)}
                      className="rounded accent-indigo-600"
                    />
                    <span
                      className="h-2 w-2 rounded-full shrink-0 transition-opacity"
                      style={{
                        backgroundColor: LINE_COLORS[index % LINE_COLORS.length],
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-600 truncate leading-4">
                      {p.productName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setSelectedProducts({})}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 w-full text-center transition-colors"
              disabled={Object.values(selectedProducts).every((v) => !v)}
            >
              Reset and plot all products
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-8 p-0 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-sm text-slate-900">Comparative Catalog Performance</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Direct comparison of order volumes, revenue shares, and average basket sizes across {products.length} products.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Order Share</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">Rev Share</th>
                <th className="px-5 py-3 text-right">AOV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {products.map((p, index) => {
                const ordersShare = totalOrders > 0 ? Math.round((p.orders / totalOrders) * 100) : 0;
                const revenueShare = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
                const color = LINE_COLORS[index % LINE_COLORS.length];
                return (
                  <tr key={p.productName} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: color + "18", color }}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 max-w-[160px] truncate">{p.productName}</td>
                    <td className="px-5 py-3.5 text-slate-400">{titleCase(p.category)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-700">{p.orders}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold" style={{ color }}>{ordersShare}%</span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${ordersShare}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-700">
                      INR {Math.round(p.revenue).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-teal-600">{revenueShare}%</span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${revenueShare}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      INR {p.averageOrderValue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
