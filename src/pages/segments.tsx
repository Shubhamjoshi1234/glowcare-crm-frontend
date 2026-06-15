import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LoaderCircle,
  Megaphone,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatMoney, titleCase } from "../lib/format";
import type {
  AudienceInsightResponse,
  AudienceSuggestion,
  Channel,
  Customer,
  Segment,
  SegmentRules,
} from "../types";
import { AudienceInsightsPanel } from "../components/audience-insights-panel";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Select,
} from "../components/ui";

interface SegmentPreview {
  matchedCount: number;
  sampleCustomers: Customer[];
  summary: {
    averageSpend: number;
    averageOrderCount: number;
    topCities: Array<{ name: string; count: number }>;
    topCategories: Array<{ name: string; count: number }>;
  };
}

interface SegmentOptions {
  cities: string[];
  categories: string[];
  channels: Channel[];
}

interface RuleForm {
  city: string;
  preferred_channel: Channel | "";
  min_total_spend: string;
  max_total_spend: string;
  inactive_days: string;
  active_within_days: string;
  category_purchased: string;
  min_order_count: string;
  max_order_count: string;
}

const emptyRules: RuleForm = {
  city: "",
  preferred_channel: "",
  min_total_spend: "",
  max_total_spend: "",
  inactive_days: "",
  active_within_days: "",
  category_purchased: "",
  min_order_count: "",
  max_order_count: "",
};

const presets: Array<{ label: string; rules: Partial<RuleForm> }> = [
  { label: "Inactive shoppers", rules: { inactive_days: "60" } },
  { label: "High-value shoppers", rules: { min_total_spend: "5000" } },
  { label: "Recently active", rules: { active_within_days: "30" } },
  { label: "Repeat shoppers", rules: { min_order_count: "2" } },
];

const numericRuleKeys = [
  "min_total_spend",
  "max_total_spend",
  "inactive_days",
  "active_within_days",
  "min_order_count",
  "max_order_count",
];

function compactRules(form: RuleForm): SegmentRules {
  return Object.fromEntries(
    Object.entries(form)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [
        key,
        numericRuleKeys.includes(key) ? Number(value) : value,
      ]),
  ) as SegmentRules;
}

function ruleFormFromSegmentRules(rules: SegmentRules): RuleForm {
  return {
    city: rules.city ?? "",
    preferred_channel: rules.preferred_channel ?? "",
    min_total_spend:
      rules.min_total_spend === undefined ? "" : String(rules.min_total_spend),
    max_total_spend:
      rules.max_total_spend === undefined ? "" : String(rules.max_total_spend),
    inactive_days: rules.inactive_days === undefined ? "" : String(rules.inactive_days),
    active_within_days:
      rules.active_within_days === undefined
        ? ""
        : String(rules.active_within_days),
    category_purchased: rules.category_purchased ?? "",
    min_order_count:
      rules.min_order_count === undefined ? "" : String(rules.min_order_count),
    max_order_count:
      rules.max_order_count === undefined ? "" : String(rules.max_order_count),
  };
}

function describeRule(key: keyof RuleForm, value: string) {
  const descriptions: Record<keyof RuleForm, string> = {
    city: `City is ${value}`,
    preferred_channel: `Channel is ${titleCase(value)}`,
    min_total_spend: `Spend is at least ${formatMoney(Number(value))}`,
    max_total_spend: `Spend is at most ${formatMoney(Number(value))}`,
    inactive_days: `Inactive for ${value}+ days`,
    active_within_days: `Purchased within ${value} days`,
    category_purchased: `Purchased ${titleCase(value)}`,
    min_order_count: `${value}+ orders`,
    max_order_count: `At most ${value} orders`,
  };
  return descriptions[key];
}

export function SegmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(searchParams.get("new") === "1");
  const [builderStep, setBuilderStep] = useState<"build" | "verify">(
    searchParams.get("step") === "verify" ? "verify" : "build",
  );
  const [periodDays, setPeriodDays] = useState<30 | 90>(90);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AudienceSuggestion | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<RuleForm>(emptyRules);
  const preparedRules = useMemo(() => compactRules(rules), [rules]);
  const [debouncedRules, setDebouncedRules] = useState<SegmentRules>(preparedRules);
  const activeRules = useMemo(
    () =>
      (Object.entries(rules) as Array<[keyof RuleForm, string]>).filter(
        ([, value]) => value !== "",
      ),
    [rules],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedRules(preparedRules), 350);
    return () => window.clearTimeout(timeout);
  }, [preparedRules]);

  const segments = useQuery({
    queryKey: ["segments"],
    queryFn: () => api<{ data: Segment[] }>("/api/segments"),
  });
  const options = useQuery({
    queryKey: ["segment-options"],
    queryFn: () => api<SegmentOptions>("/api/segments/options"),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const preview = useQuery({
    queryKey: ["segment-preview", debouncedRules],
    queryFn: () =>
      api<SegmentPreview>("/api/segments/preview", {
        method: "POST",
        body: JSON.stringify({ rules: debouncedRules }),
      }),
    enabled: showBuilder,
    placeholderData: (previous) => previous,
  });
  const insights = useQuery({
    queryKey: ["audience-insights", periodDays],
    queryFn: () =>
      api<AudienceInsightResponse>(
        `/api/ai/audience-insights?periodDays=${periodDays}`,
      ),
    enabled: showBuilder && builderStep === "build",
    staleTime: 5 * 60_000,
  });
  const save = useMutation({
    mutationFn: () =>
      api<Segment>("/api/segments", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: description || undefined,
          rules: preparedRules,
        }),
      }),
    onSuccess: async (segment) => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      navigate(`/campaigns?new=1&segmentId=${segment.id}`);
    },
  });
  const deleteSegment = useMutation({
    mutationFn: (segmentId: string) =>
      api<{ deleted: true; id: string }>(`/api/segments/${segmentId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["segments"] }),
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
      ]);
    },
  });

  const startBuilder = () => {
    setShowBuilder(true);
    setBuilderStep("build");
    setSearchParams({ new: "1" });
  };
  const cancelBuilder = () => {
    setShowBuilder(false);
    setBuilderStep("build");
    setSelectedSuggestion(null);
    setSearchParams({});
    setRules(emptyRules);
    setName("");
    setDescription("");
  };
  const setRule = (key: keyof RuleForm, value: string) => {
    setRules((current) => ({ ...current, [key]: value }));
  };
  const applyPreset = (presetRules: Partial<RuleForm>) => {
    setRules({ ...emptyRules, ...presetRules });
  };
  const reviewSuggestion = (suggestion: AudienceSuggestion) => {
    setSelectedSuggestion(suggestion);
    setRules(ruleFormFromSegmentRules(suggestion.rules));
    setName(suggestion.recommendedName);
    setDescription(suggestion.description);
    setBuilderStep("verify");
    setSearchParams({ new: "1", step: "verify" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const returnToSuggestions = () => {
    setBuilderStep("build");
    setSelectedSuggestion(null);
    setRules(emptyRules);
    setName("");
    setDescription("");
    setSearchParams({ new: "1" });
  };
  const refreshPreview = () => {
    if (JSON.stringify(preparedRules) !== JSON.stringify(debouncedRules)) {
      setDebouncedRules(preparedRules);
      return;
    }
    void preview.refetch();
  };

  if (segments.isLoading) return <LoadingState />;
  if (segments.error) return <ErrorState error={segments.error} />;

  const savedSegments = segments.data?.data ?? [];
  const previewIsCurrent =
    JSON.stringify(preparedRules) === JSON.stringify(debouncedRules) && !preview.isFetching;
  const previewIsUpdating = !previewIsCurrent;

  return (
    <>
      <PageHeader
        eyebrow={builderStep === "verify" ? "Audience verification" : "Audience"}
        title={
          builderStep === "verify"
            ? "Review the suggested audience"
            : "Who do you want to reach?"
        }
        description={
          builderStep === "verify"
            ? "Check the AI suggestion, adjust any filter, and confirm the live audience before saving."
            : "Create a reusable shopper group from customer and purchase behavior."
        }
        action={
          !showBuilder && (
            <Button onClick={startBuilder}>
              <Plus className="h-4 w-4" /> New audience
            </Button>
          )
        }
      />

      {showBuilder ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {builderStep === "verify"
                    ? "Verify and adjust filters"
                    : "Choose your shoppers"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {builderStep === "verify"
                    ? "Every AI suggestion becomes ordinary editable audience rules."
                    : "Start with a common audience or combine your own conditions."}
                </p>
              </div>
              <button
                onClick={
                  builderStep === "verify" ? returnToSuggestions : cancelBuilder
                }
                className="text-sm font-medium text-slate-400 hover:text-ink"
              >
                {builderStep === "verify" ? "Back" : "Cancel"}
              </button>
            </div>

            {builderStep === "build" && (
              <div className="mt-5 flex flex-wrap gap-2">
                {presets.map((preset) => {
                  const presetRules = { ...emptyRules, ...preset.rules };
                  const selected =
                    JSON.stringify(compactRules(presetRules)) ===
                    JSON.stringify(preparedRules);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.rules)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        selected
                          ? "border-leaf bg-[#edf5ef] text-leaf"
                          : "border-slate-200 text-slate-600 hover:border-leaf hover:text-leaf"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Check className="h-3.5 w-3.5 text-leaf" />
                  Match all conditions
                </div>
                {activeRules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRules(emptyRules)}
                    className="text-xs font-semibold text-slate-400 hover:text-ink"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeRules.length === 0 ? (
                  <span className="text-xs text-slate-400">
                    No filters yet - all shoppers match.
                  </span>
                ) : (
                  activeRules.map(([key, value]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setRule(key, "")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-red-600"
                      aria-label={`Remove ${describeRule(key, value)} filter`}
                    >
                      {describeRule(key, value)}
                      <X className="h-3 w-3" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Inactive for at least">
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Any time"
                    value={rules.inactive_days}
                    onChange={(event) => setRule("inactive_days", event.target.value)}
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-300">
                    days
                  </span>
                </div>
              </Field>
              <Field label="Purchased within">
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Any time"
                    value={rules.active_within_days}
                    onChange={(event) =>
                      setRule("active_within_days", event.target.value)
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-300">
                    days
                  </span>
                </div>
              </Field>
              <Field label="Minimum total spend">
                <Input
                  type="number"
                  min="0"
                  placeholder="Any amount"
                  value={rules.min_total_spend}
                  onChange={(event) => setRule("min_total_spend", event.target.value)}
                />
              </Field>
              <Field label="Preferred channel">
                <Select
                  value={rules.preferred_channel}
                  onChange={(event) => setRule("preferred_channel", event.target.value)}
                >
                  <option value="">Any channel</option>
                  {(options.data?.channels ?? ["whatsapp", "sms", "email", "rcs"]).map(
                    (channel) => (
                      <option key={channel} value={channel}>
                        {titleCase(channel)}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </div>

            <details className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-500">
                More filters
                <ChevronDown className="h-4 w-4" />
              </summary>
              <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2">
                <Field label="City">
                  <Select
                    value={rules.city}
                    onChange={(event) => setRule("city", event.target.value)}
                  >
                    <option value="">Any city</option>
                    {(options.data?.cities ?? []).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Maximum spend">
                  <Input
                    type="number"
                    min="0"
                    placeholder="No maximum"
                    value={rules.max_total_spend}
                    onChange={(event) => setRule("max_total_spend", event.target.value)}
                  />
                </Field>
                <Field label="Minimum orders">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Any number"
                    value={rules.min_order_count}
                    onChange={(event) => setRule("min_order_count", event.target.value)}
                  />
                </Field>
                <Field label="Maximum orders">
                  <Input
                    type="number"
                    min="0"
                    placeholder="No maximum"
                    value={rules.max_order_count}
                    onChange={(event) => setRule("max_order_count", event.target.value)}
                  />
                </Field>
                <Field label="Purchased category">
                  <Select
                    value={rules.category_purchased}
                    onChange={(event) =>
                      setRule("category_purchased", event.target.value)
                    }
                  >
                    <option value="">Any category</option>
                    {(options.data?.categories ?? []).map((category) => (
                      <option key={category} value={category}>
                        {titleCase(category)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </details>

            {options.error && (
              <div className="mt-4">
                <ErrorState error={options.error} />
              </div>
            )}
            {preview.error && (
              <div className="mt-4">
                <ErrorState error={preview.error} />
              </div>
            )}
            <Button
              className="mt-5 w-full sm:w-auto"
              onClick={refreshPreview}
              loading={previewIsUpdating}
            >
              Refresh preview <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="mt-6 border-t border-slate-100 pt-6">
              {preview.isPending && !preview.data ? (
                <div className="flex min-h-44 items-center justify-center rounded-2xl bg-slate-50">
                  <div className="text-center">
                    <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-leaf" />
                    <p className="mt-3 text-sm font-semibold">
                      Finding matching shoppers
                    </p>
                  </div>
                </div>
              ) : !preview.data ? (
                <div className="flex min-h-44 items-center justify-center rounded-2xl bg-slate-50">
                  <div className="text-center">
                    <Users className="mx-auto h-5 w-5 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold">Preview unavailable</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-500">
                      Live audience preview
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400"
                      aria-live="polite"
                    >
                      {previewIsUpdating ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Updating
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 text-leaf" /> Up to date
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    className={`mt-3 rounded-2xl bg-[#edf5ef] p-5 transition-opacity ${
                      previewIsUpdating ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-4xl font-bold text-leaf">
                          {preview.data.matchedCount}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          matching shoppers
                        </p>
                      </div>
                      <div className="flex gap-5 text-sm">
                        <div>
                          <p className="font-semibold">
                            {formatMoney(preview.data.summary.averageSpend)}
                          </p>
                          <p className="text-xs text-slate-400">average spend</p>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {preview.data.summary.averageOrderCount.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-400">average orders</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {preview.data.sampleCustomers.slice(0, 3).map((customer) => (
                      <div
                        key={customer.id}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <p className="truncate text-xs font-semibold">{customer.name}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {customer.city ?? "Unknown city"} /{" "}
                          {titleCase(customer.preferredChannel)}
                        </p>
                        <p className="mt-2 text-xs font-bold">
                          {formatMoney(customer.totalSpend)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <Field label="Audience name">
                      <Input
                        placeholder="Example: High-value inactive shoppers"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-slate-400">
                        Add a description
                      </summary>
                      <Input
                        className="mt-2"
                        placeholder="Optional note"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </details>
                    {save.error && (
                      <div className="mt-3">
                        <ErrorState error={save.error} />
                      </div>
                    )}
                    <Button
                      className="mt-4 w-full"
                      onClick={() => save.mutate()}
                      loading={save.isPending}
                      disabled={
                        !name.trim() ||
                        preview.data.matchedCount === 0 ||
                        previewIsUpdating
                      }
                    >
                      {builderStep === "verify"
                        ? "Confirm audience and create campaign"
                        : "Save and create campaign"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            {builderStep === "build" ? (
              <AudienceInsightsPanel
                data={insights.data}
                error={insights.error}
                isLoading={insights.isLoading}
                periodDays={periodDays}
                onPeriodChange={setPeriodDays}
                onReview={reviewSuggestion}
              />
            ) : selectedSuggestion ? (
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-leaf" />
                  <p className="font-semibold">Selected audience evidence</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  The filters on the left are editable. These figures explain why
                  this group was recommended.
                </p>

                <div className="mt-5 rounded-2xl bg-[#edf5ef] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-leaf">
                    {selectedSuggestion.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedSuggestion.rationale}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-2xl font-bold text-leaf">
                      {selectedSuggestion.matchedCount}
                    </p>
                    <p className="text-xs text-slate-400">suggested shoppers</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-2xl font-bold">
                      {selectedSuggestion.shareOfAudience}%
                    </p>
                    <p className="text-xs text-slate-400">of customer base</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-lg font-bold">
                      {formatMoney(selectedSuggestion.averageSpend)}
                    </p>
                    <p className="text-xs text-slate-400">average shopper value</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-lg font-bold">
                      {formatMoney(selectedSuggestion.totalLifetimeValue)}
                    </p>
                    <p className="text-xs text-slate-400">total cohort value</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold">Before continuing</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Confirm the live count on the left after any changes. Campaign
                    content and offers will be chosen only after this audience is saved.
                  </p>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
        </>
      ) : (
        <>
        {/* ── Audience Behaviour Dashboard ──────────────────────── */}
        <section className="mb-8 animate-fade-in">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Behaviour Analytics</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Audience Behaviour Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Aggregated engagement metrics across all saved audiences — last 90 days.</p>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            {[
              { label: "Avg. Engagement Rate", value: "34.2%", delta: "+3.1%", up: true },
              { label: "Avg. Retention Rate", value: "68.5%", delta: "+1.8%", up: true },
              { label: "Churn Risk Shoppers", value: "127", delta: "-12", up: false },
              { label: "Repeat Purchase Rate", value: "42.7%", delta: "+5.4%", up: true },
            ].map(({ label, value, delta, up }) => (
              <Card key={label} className="p-4 hover:shadow-card-hover">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                  <span className={`mb-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
                    {delta}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Channel Engagement Breakdown */}
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-sm text-slate-900">Engagement by Channel</h3>
                <p className="mt-0.5 text-xs text-slate-400">Open / click rates per messaging channel</p>
              </div>
              <div className="px-5 py-5 space-y-4">
                {[
                  { channel: "WhatsApp", openRate: 82, clickRate: 28, color: "bg-emerald-500" },
                  { channel: "Email", openRate: 45, clickRate: 12, color: "bg-violet-500" },
                  { channel: "SMS", openRate: 91, clickRate: 8, color: "bg-blue-500" },
                  { channel: "RCS", openRate: 67, clickRate: 22, color: "bg-orange-500" },
                ].map(({ channel, openRate, clickRate, color }) => (
                  <div key={channel}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{channel}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">Open: <strong className="text-slate-800">{openRate}%</strong></span>
                        <span className="text-slate-500">Click: <strong className="text-slate-800">{clickRate}%</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 rounded-full bg-slate-100 flex-1 overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${openRate}%` }} />
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 flex-1 overflow-hidden">
                        <div className={`h-full rounded-full ${color} opacity-50 transition-all duration-700`} style={{ width: `${clickRate}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Activity Heatmap */}
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-sm text-slate-900">Weekly Activity Heatmap</h3>
                <p className="mt-0.5 text-xs text-slate-400">Shopper activity intensity by day × time block</p>
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-8 gap-1 text-[9px] font-bold text-slate-400">
                  <div />
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center pb-1">{d}</div>
                  ))}
                  {[
                    { time: "6-10a", vals: [32, 45, 38, 52, 41, 68, 55] },
                    { time: "10-2p", vals: [58, 72, 65, 78, 70, 85, 62] },
                    { time: "2-6p", vals: [45, 55, 48, 60, 52, 42, 38] },
                    { time: "6-10p", vals: [75, 88, 82, 90, 85, 95, 78] },
                    { time: "10-2a", vals: [20, 18, 15, 22, 28, 45, 35] },
                  ].map(({ time, vals }) => (
                    <>
                      <div key={time} className="flex items-center text-[9px] font-semibold text-slate-400 pr-1">{time}</div>
                      {vals.map((v, i) => (
                        <div
                          key={`${time}-${i}`}
                          className="aspect-square rounded-md flex items-center justify-center text-[8px] font-bold transition-colors"
                          style={{
                            backgroundColor: `rgba(79, 70, 229, ${Math.max(0.06, v / 100)})`,
                            color: v > 60 ? "white" : "#6366f1",
                          }}
                          title={`${v}% activity`}
                        >
                          {v}
                        </div>
                      ))}
                    </>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-400">
                  <span>Low</span>
                  <div className="flex gap-0.5">
                    {[0.08, 0.2, 0.4, 0.65, 0.9].map((op) => (
                      <div key={op} className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: `rgba(79, 70, 229, ${op})` }} />
                    ))}
                  </div>
                  <span>High</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom row: Top Categories + Segment Health */}
          <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr] mt-6">
            {/* Top Product Categories */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-4">Top Product Affinity</h3>
              <div className="space-y-3">
                {[
                  { name: "Moisturizers", pct: 38, count: 312 },
                  { name: "Serums", pct: 27, count: 221 },
                  { name: "Cleansers", pct: 18, count: 148 },
                  { name: "SPF / Suncare", pct: 11, count: 90 },
                  { name: "Lip & Eye", pct: 6, count: 49 },
                ].map(({ name, pct, count }, i) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{i + 1}. {name}</span>
                      <span className="text-[11px] text-slate-400">{count} shoppers · <strong className="text-slate-600">{pct}%</strong></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Segment Health Table */}
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-sm text-slate-900">Segment Health Overview</h3>
                <p className="mt-0.5 text-xs text-slate-400">Per-segment engagement benchmarks vs. global average</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-2.5">Segment</th>
                      <th className="px-5 py-2.5 text-right">Size</th>
                      <th className="px-5 py-2.5 text-right">Engagement</th>
                      <th className="px-5 py-2.5 text-right">Avg Spend</th>
                      <th className="px-5 py-2.5 text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium">
                    {[
                      { seg: "Caffeine Eye Gel shoppers", size: 191, eng: 41, spend: "INR 2,340", health: "strong" },
                      { seg: "Lapsed loyal shoppers", size: 207, eng: 18, spend: "INR 4,180", health: "at-risk" },
                      { seg: "Gentle Cloud Cleanser", size: 173, eng: 35, spend: "INR 1,890", health: "healthy" },
                      { seg: "Serum discoverers", size: 150, eng: 52, spend: "INR 3,220", health: "strong" },
                      { seg: "Gentle wash fans", size: 173, eng: 29, spend: "INR 1,650", health: "healthy" },
                    ].map(({ seg, size, eng, spend, health }) => {
                      const healthColor = health === "strong" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : health === "at-risk" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200";
                      return (
                        <tr key={seg} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{seg}</td>
                          <td className="px-5 py-3 text-right text-slate-600">{size}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-700">{eng}%</span>
                              <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${eng}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-600">{spend}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${healthColor}`}>
                              {health}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        <Card>
          {savedSegments.length === 0 ? (
            <EmptyState
              title="No audiences yet"
              body="Create your first audience to start a campaign."
            />
          ) : (
            <>
              {deleteSegment.error && (
                <div className="mb-4">
                  <ErrorState error={deleteSegment.error} />
                </div>
              )}
              <div className="divide-y divide-slate-100">
                {savedSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{segment.name}</p>
                        <Badge value={`${segment.matchedCount} shoppers`} />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {segment.description ||
                          Object.entries(segment.rulesJson)
                            .map(([key, value]) => `${titleCase(key)}: ${value}`)
                            .join(" / ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/campaigns?new=1&segmentId=${segment.id}`)}
                      >
                        Create campaign <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3"
                        aria-label={`Delete ${segment.name}`}
                        title="Delete audience"
                        loading={
                          deleteSegment.isPending && deleteSegment.variables === segment.id
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete the audience "${segment.name}"? This cannot be undone.`,
                            )
                          ) {
                            deleteSegment.mutate(segment.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
        </>
      )}

    </>
  );
}
