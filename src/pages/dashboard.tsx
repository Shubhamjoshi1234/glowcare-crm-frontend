import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Database,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Users,
  Send,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type {
  AudienceInsightResponse,
  Campaign,
  CampaignOpportunityResponse,
  CampaignStats,
} from "../types";
import {
  AiBadge,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
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

interface TrendPoint {
  date?: string;
  week?: string;
  sent: number;
  delivered: number;
  clicked: number;
  converted: number;
}

interface DashboardResponse {
  totals: {
    totalCustomers: number;
    totalOrders: number;
    totalSegments: number;
    totalCampaigns: number;
  };
  overallStats: CampaignStats;
  recentCampaigns: Campaign[];
  dailyTrends: TrendPoint[];
  weeklyTrends: TrendPoint[];
}

function DeliveryProgressBar({ stats }: { stats: CampaignStats }) {
  const size = stats.audienceSize || stats.communicationsCreated || 1;
  const convertedPercent = (stats.converted / size) * 100;
  const clickedPercent = ((stats.clicked - stats.converted) / size) * 100;
  const readPercent = ((stats.read - stats.clicked) / size) * 100;
  const deliveredPercent = ((stats.delivered - stats.read) / size) * 100;
  const sentPercent = ((stats.sent - stats.delivered - stats.failed) / size) * 100;
  const failedPercent = (stats.failed / size) * 100;

  return (
    <div className="mt-3">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        {convertedPercent > 0 && <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${convertedPercent}%` }} title={`Converted: ${stats.converted}`} />}
        {clickedPercent > 0 && <div className="h-full bg-orange-400 transition-all duration-700" style={{ width: `${clickedPercent}%` }} title={`Clicked: ${stats.clicked}`} />}
        {readPercent > 0 && <div className="h-full bg-purple-400 transition-all duration-700" style={{ width: `${readPercent}%` }} title={`Read: ${stats.read}`} />}
        {deliveredPercent > 0 && <div className="h-full bg-teal-400 transition-all duration-700" style={{ width: `${deliveredPercent}%` }} title={`Delivered: ${stats.delivered}`} />}
        {sentPercent > 0 && <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${sentPercent}%` }} title={`Sent: ${stats.sent}`} />}
        {failedPercent > 0 && <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${failedPercent}%` }} title={`Failed: ${stats.failed}`} />}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-400 font-medium">
        {stats.delivered > 0 && <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-teal-400" /> {stats.delivered} del</span>}
        {stats.read > 0 && <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-purple-400" /> {stats.read} read</span>}
        {stats.clicked > 0 && <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-orange-400" /> {stats.clicked} clicked</span>}
        {stats.converted > 0 && <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" /> {stats.converted} conv.</span>}
      </div>
    </div>
  );
}

const CHART_COLORS = {
  sent: "#818cf8",
  delivered: "#2dd4bf",
  clicked: "#fb923c",
  converted: "#10b981",
};

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [reportTab, setReportTab] = useState<"daily" | "weekly">("daily");

  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardResponse>("/api/dashboard"),
    refetchInterval: 5000,
  });

  const seed = useMutation({
    mutationFn: () => api("/api/seed", { method: "POST" }),
    onSuccess: async () => { await queryClient.invalidateQueries(); },
  });

  const resetDatabase = useMutation({
    mutationFn: () => api("/api/seed?reset=true", { method: "POST" }),
    onSuccess: async () => { await queryClient.invalidateQueries(); },
  });

  const isEmpty = dashboard.data ? dashboard.data.totals.totalCustomers === 0 : true;

  const insights = useQuery({
    queryKey: ["audience-insights", 90],
    queryFn: () => api<AudienceInsightResponse>("/api/ai/audience-insights?periodDays=90"),
    enabled: !isEmpty,
    staleTime: 5 * 60_000,
  });

  const opportunities = useQuery({
    queryKey: ["campaign-opportunities", 90],
    queryFn: () => api<CampaignOpportunityResponse>("/api/ai/campaign-opportunities?periodDays=90"),
    enabled: !isEmpty,
    staleTime: 5 * 60_000,
  });

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.error) return <ErrorState error={dashboard.error} />;

  const data = dashboard.data!;
  const hasAudience = data.totals.totalSegments > 0;
  const primaryAction = hasAudience
    ? { to: "/campaigns?new=1", label: "Create campaign" }
    : { to: "/segments?new=1", label: "Build an audience" };

  const chartData = (reportTab === "daily" ? data.dailyTrends : data.weeklyTrends) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Monitor campaigns, track AI-generated insights, and reach the right shoppers."
        action={
          isEmpty ? (
            <Button onClick={() => seed.mutate()} loading={seed.isPending}>
              <Database className="h-4 w-4" /> Add demo data
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (confirm("Reset and re-seed the database with the GlowCare skincare catalog?")) {
                    resetDatabase.mutate();
                  }
                }}
                loading={resetDatabase.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Link to={primaryAction.to}>
                <Button>
                  {primaryAction.label} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )
        }
      />

      {isEmpty ? (
        /* ── Empty state ─────────────────────────────────────────── */
        <div className="grid gap-5 md:grid-cols-2 mt-2">
          <Card className="flex flex-col justify-between border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-900">GlowCare Mini CRM</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                An AI-native campaign engine for skincare brands — audience segmentation, GPT-4o mini message drafting, and real-time delivery analytics.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  "Import shopper profiles and order histories",
                  "Behavioral segmentation with AI audience insights",
                  "GPT-4o mini personalized campaign messages",
                  "Live async delivery callbacks across all channels",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2 text-xs font-medium text-slate-500">
                    <span className="text-indigo-500 mt-0.5 shrink-0">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-7 border-t border-slate-100 pt-5">
              <Button onClick={() => seed.mutate()} loading={seed.isPending} className="w-full justify-center">
                <Database className="h-4 w-4" /> Load 500 shoppers & 1,500 orders
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 content-start">
            {[
              { title: "1. Seed Shopper Data", body: "Load a realistic skincare brand catalog with customer profiles and order histories across 8 products.", icon: Database },
              { title: "2. Build Segment Rules", body: "Filter shoppers by location, order count, spend, or inactivity to target specific behavioral groups.", icon: BarChart3 },
              { title: "3. Generate AI Opportunities", body: "GPT-4o mini scans the catalog, ranks campaign ideas, proposes incentivized offers, and composes templates.", icon: Bot },
              { title: "4. Deliver & Trace Receipts", body: "Watch message callbacks (sent, delivered, opened, clicked, converted) flow back in real-time.", icon: Send },
            ].map(({ title, body, icon: Icon }) => (
              <Card key={title} className="flex gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Metric Grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              label="Shoppers"
              value={data.totals.totalCustomers.toLocaleString()}
              detail={insights.data?.overview?.activePercent ? `${insights.data.overview.activePercent}% active (90d)` : "Seeded"}
              accent
              icon={<Users className="h-4 w-4 text-white/70" />}
            />
            <MetricCard
              label="Orders"
              value={data.totals.totalOrders.toLocaleString()}
              detail={insights.data?.overview?.currentRevenue ? `INR ${Math.round(insights.data.overview.currentRevenue).toLocaleString("en-IN")}` : "Completed"}
              icon={<ShoppingBag className="h-4 w-4 text-amber-500" />}
            />
            <MetricCard
              label="Segments"
              value={data.totals.totalSegments.toLocaleString()}
              detail="Audience groups"
              icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
            />
            <MetricCard
              label="Campaigns"
              value={data.totals.totalCampaigns.toLocaleString()}
              detail={`${data.overallStats.deliveryRate}% delivery rate`}
              icon={<Megaphone className="h-4 w-4 text-blue-500" />}
            />
          </div>

          {/* ── Trend Chart ──────────────────────────────────────── */}
          {chartData.length > 0 && (
            <Card className="mt-6 p-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Campaign Delivery Trends</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Message funnel across all campaigns</p>
                </div>
                <div className="flex bg-slate-100 rounded-xl p-0.5">
                  {(["daily", "weekly"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setReportTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all capitalize ${
                        reportTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey={reportTab === "daily" ? "date" : "week"}
                      stroke="#e2e8f0"
                      fontSize={10}
                      tickLine={false}
                      dy={8}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis stroke="#e2e8f0" fontSize={10} tickLine={false} dx={-5} tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", color: "#0f172a", fontSize: "11px", boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}
                      itemStyle={{ padding: "2px 0" }}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "#64748b" }} />
                    <Line type="monotone" dataKey="sent" stroke={CHART_COLORS.sent} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Sent" />
                    <Line type="monotone" dataKey="delivered" stroke={CHART_COLORS.delivered} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Delivered" />
                    <Line type="monotone" dataKey="clicked" stroke={CHART_COLORS.clicked} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Clicked" />
                    <Line type="monotone" dataKey="converted" stroke={CHART_COLORS.converted} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="Converted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ── AI Campaign Spotlight ─────────────────────────── */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">AI Campaign Spotlight</h2>
                  {opportunities.data && (
                    <AiBadge provider={opportunities.data.provider === "openai" ? "openai" : "fallback"} />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  GPT-4o mini analyzed {opportunities.data?.productPerformance.length ?? 8} catalog products over the latest {opportunities.data?.periodDays ?? 90} days
                </p>
              </div>
              <Link to="/campaigns?new=1" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                All ideas <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {opportunities.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
                ))}
              </div>
            ) : opportunities.data?.opportunities.length ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {opportunities.data.opportunities.slice(0, 3).map((opp, i) => (
                  <Card key={opp.id} className="group flex flex-col justify-between hover:border-indigo-200 hover:shadow-soft" style={{ animationDelay: `${i * 60}ms` }}>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                          {opp.incentiveLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {opp.potentialAudience}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold leading-5 text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {opp.headline}
                      </h3>
                      <p className="mt-1.5 text-[11px] leading-5 text-slate-400 line-clamp-2">
                        {opp.rationale}
                      </p>
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px]">
                        <span className="text-slate-400">Focus: </span>
                        <span className="font-bold text-slate-700">{opp.featuredProducts.map((p) => p.productName).join(" + ")}</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                      <AiBadge provider={opportunities.data.provider === "openai" ? "openai" : "fallback"} />
                      <Link to={`/campaigns?new=1&opportunityId=${opp.id}`}>
                        <Button className="py-1.5 px-3 text-xs">
                          Use this <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8 text-slate-400 text-sm">
                No AI opportunities available. Try seeding more data or changing the period.
              </Card>
            )}
          </section>

          {/* ── Bottom Grid: Recent + Performance ────────────── */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            {/* Recent Campaigns */}
            <Card>
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recent Campaign Dispatches</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Open a campaign to check live delivery receipts</p>
                </div>
                <Link to="/campaigns" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.recentCampaigns.length === 0 ? (
                <EmptyState
                  title="No campaigns yet"
                  body="Select an AI spotlight idea above or create a segment manually to launch your first campaign."
                />
              ) : (
                <div className="space-y-3">
                  {data.recentCampaigns.slice(0, 4).map((campaign) => (
                    <div key={campaign.id} className="group rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-slate-200 hover:bg-slate-50/50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/campaigns/${campaign.id}`} className="truncate text-sm font-bold text-slate-800 group-hover:text-indigo-700 hover:underline transition-colors">
                              {campaign.name}
                            </Link>
                            <Badge value={campaign.status} />
                            <Badge value={campaign.channel} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {campaign.segment.name} · {formatDate(campaign.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-900">{campaign.stats.deliveryRate}%</p>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">delivered</p>
                        </div>
                      </div>
                      {campaign.status !== "draft" && <DeliveryProgressBar stats={campaign.stats} />}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Performance Summary Card */}
            <Card className="relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Activity className="h-3.5 w-3.5 text-indigo-500" /> Overall Performance
              </div>
              <div className="mt-5">
                <p className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {data.overallStats.delivered.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-400 font-medium">messages delivered</p>
              </div>

              <div className="mt-5 relative flex justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path strokeWidth="3" stroke="#e2e8f0" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    strokeWidth="3"
                    strokeDasharray={`${data.overallStats.sent > 0 ? Math.round((data.overallStats.delivered / data.overallStats.sent) * 100) : 100}, 100`}
                    strokeLinecap="round"
                    stroke="#4f46e5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                  {data.overallStats.sent > 0 ? `${Math.round((data.overallStats.delivered / data.overallStats.sent) * 100)}%` : "—"}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                {[
                  { label: "Read", value: data.overallStats.read, color: "bg-purple-400" },
                  { label: "Clicked", value: data.overallStats.clicked, color: "bg-orange-400" },
                  { label: "Converted", value: data.overallStats.converted, color: "bg-emerald-500" },
                  { label: "Failed", value: data.overallStats.failed, color: "bg-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className={`h-1 w-full rounded-full mb-1.5 ${color} opacity-50`} />
                    <p className="text-lg font-bold text-slate-900">{value.toLocaleString()}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Campaign History Ledger ───────────────────────── */}
          <Card className="mt-8 p-0 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Campaign Dispatch Ledger</h3>
                <p className="mt-0.5 text-xs text-slate-400">Chronological history of all dispatches and performance rates</p>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Channel</th>
                    <th className="px-5 py-3">Audience</th>
                    <th className="px-5 py-3">Dispatched</th>
                    <th className="px-5 py-3 text-right">Size</th>
                    <th className="px-5 py-3 text-right">Delivery %</th>
                    <th className="px-5 py-3 text-right">Click %</th>
                    <th className="px-5 py-3 text-right">Conv %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                  {data.recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        <Link to={`/campaigns/${campaign.id}`} className="hover:text-indigo-600 hover:underline transition-colors">
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5"><Badge value={campaign.status} /></td>
                      <td className="px-5 py-3.5"><Badge value={campaign.channel} /></td>
                      <td className="px-5 py-3.5 text-slate-500">{campaign.segment.name}</td>
                      <td className="px-5 py-3.5 text-slate-400">{formatDate(campaign.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500">{campaign.stats.audienceSize}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-teal-600">{campaign.stats.deliveryRate}%</td>
                      <td className="px-5 py-3.5 text-right font-bold text-orange-600">{campaign.stats.clickRate}%</td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{campaign.stats.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
