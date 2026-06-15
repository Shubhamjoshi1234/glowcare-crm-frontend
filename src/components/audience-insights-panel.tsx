import {
  ArrowRight,
  BrainCircuit,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type {
  AudienceInsightResponse,
  AudienceSuggestion,
} from "../types";
import { Button, ErrorState } from "./ui";

interface AudienceInsightsPanelProps {
  data?: AudienceInsightResponse;
  error: Error | null;
  isLoading: boolean;
  periodDays: 30 | 90;
  onPeriodChange: (periodDays: 30 | 90) => void;
  onReview: (suggestion: AudienceSuggestion) => void;
}

const chartColors = ["#28634a", "#e8a94b"];

export function AudienceInsightsPanel({
  data,
  error,
  isLoading,
  periodDays,
  onPeriodChange,
  onReview,
}: AudienceInsightsPanelProps) {
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-leaf" />
            <p className="font-semibold">AI audience recommendations</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Three different opportunities selected from customer behavior.
          </p>
        </div>
        <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
          {[30, 90].map((days) => (
            <button
              type="button"
              key={days}
              onClick={() => onPeriodChange(days as 30 | 90)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                periodDays === days
                  ? "bg-white text-ink shadow-sm"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="max-w-xs text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-leaf">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </div>
            <p className="mt-4 font-semibold">Finding your best audiences</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              AI is comparing activity, loyalty, spend, and purchase momentum.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[0.8fr_1.2fr]">
            <div className="relative h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active", value: data.overview.activeShoppers },
                      { name: "Inactive", value: data.overview.inactiveShoppers },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {chartColors.map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #edf0eb",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-ink">
                  {data.overview.totalShoppers}
                </span>
                <span className="text-[10px] text-slate-400">shoppers</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Active and inactive shoppers</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Based on whether they purchased within the selected {periodDays}-day
                period.
              </p>
              <div className="mt-4 flex gap-5 text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-leaf" />
                  {data.overview.activeShoppers} active
                </span>
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e8a94b]" />
                  {data.overview.inactiveShoppers} inactive
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`rounded-xl border p-4 ${
                  index === 0
                    ? "border-leaf/30 bg-[#fbfdfb]"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-leaf">
                      {index === 0 && <Sparkles className="h-3 w-3" />}
                      {index === 0 ? "AI first choice" : "Alternative"}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">{suggestion.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {suggestion.rationale}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-leaf">
                      {suggestion.matchedCount}
                    </p>
                    <p className="text-[10px] text-slate-400">shoppers</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => onReview(suggestion)}
                >
                  Use this audience <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
            Each recommendation targets a different shopper behavior. All filters
            remain editable before saving.
          </p>
        </>
      )}
    </div>
  );
}
