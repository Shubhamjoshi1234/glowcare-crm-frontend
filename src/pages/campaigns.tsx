import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  Lightbulb,
  Megaphone,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate, titleCase } from "../lib/format";
import type {
  Campaign,
  CampaignOpportunity,
  CampaignOpportunityResponse,
  CampaignStatus,
  Channel,
  Customer,
  Segment,
} from "../types";
import {
  AiBadge,
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
  Textarea,
} from "../components/ui";

function CampaignOpportunityPanel({
  data,
  isLoading,
  error,
  period,
  selectedId,
  applyingId,
  applyError,
  onPeriodChange,
  onUseIdea,
  children,
}: {
  data?: CampaignOpportunityResponse;
  isLoading: boolean;
  error: unknown;
  period: 30 | 90;
  selectedId?: string;
  applyingId?: string;
  applyError: unknown;
  onPeriodChange: (period: 30 | 90) => void;
  onUseIdea: (opportunity: CampaignOpportunity) => void;
  children?: ReactNode;
}) {
  const maximumOrders = Math.max(
    1,
    ...(data?.productPerformance.map((product) => product.orders) ?? []),
  );

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#f8faff]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">AI campaign ideas</p>
              {data && (
                <AiBadge provider={data.provider === "openai" ? "openai" : "fallback"} />
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              GPT-4o mini compares every product in the catalog to create targeted routes.
            </p>
          </div>
        </div>
        <Select
          className="w-full sm:w-36"
          value={period}
          onChange={(event) => onPeriodChange(Number(event.target.value) as 30 | 90)}
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          <div className="inline-block h-5 w-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin mb-3" />
          <p>GPT-4o mini comparing catalog products…</p>
        </div>
      ) : error ? (
        <div className="p-5">
          <ErrorState error={error} />
        </div>
      ) : data?.opportunities.length ? (
        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className="p-5 lg:border-r lg:border-slate-100 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                  Recommended actions
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Top three campaign ideas
                </h2>
                <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                  GPT-4o mini uses the same product evidence to create three different promotional approaches.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                3 AI picks
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {data.opportunities.map((opportunity, index) => {
                const isSelected = selectedId === opportunity.id;
                return (
                  <div
                    key={opportunity.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/60 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {opportunity.headline}
                          </p>
                          {index === 0 && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              Best fit
                            </span>
                          )}
                          <AiBadge provider={data.provider === "openai" ? "openai" : "fallback"} />
                        </div>
                        <div className="mt-2 inline-flex rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                          {opportunity.incentiveLabel}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {opportunity.rationale}
                        </p>
                        <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-600">
                          {opportunity.offer}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {opportunity.potentialAudience}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          relevant shoppers for this idea
                        </p>
                      </div>
                      <Button
                        variant={isSelected ? "primary" : "secondary"}
                        loading={applyingId === opportunity.id}
                        onClick={() => onUseIdea(opportunity)}
                        className="shrink-0"
                      >
                        <PackagePlus className="h-4 w-4" />
                        {isSelected ? "Selected" : "Use this idea"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {applyError ? (
              <div className="mt-4">
                <ErrorState error={applyError} />
              </div>
            ) : null}

            {children && (
              <div className="mt-6 border-t border-leaf/10 pt-6">
                {children}
              </div>
            )}
          </section>

          <aside className="border-t border-slate-100 bg-slate-50/70 p-5 lg:border-t-0 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Catalog analysis
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900">Product performance</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Direct comparison by orders in the selected period.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {data.productPerformance.length} products
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <PackagePlus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    AI focus products
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600/70">
                    Lowest order demand — boost with campaigns
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-amber-900">
                {data.focusProducts.map((product) => product.productName).join(" + ")}
              </p>
            </div>

            <div className="mt-5 space-y-1.5">
              {data.productPerformance.map((product) => (
                <div
                  key={product.productName}
                  className={`rounded-xl border px-3 py-2.5 transition ${
                    product.status === "focus"
                      ? "border-amber-100 bg-amber-50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                        product.status === "focus"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {product.productName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {titleCase(product.category)}
                        {product.status === "focus" && " · focus"}
                      </p>
                    </div>
                    <p className="ml-auto shrink-0 text-xs font-bold text-slate-700">
                      {product.orders}
                      <span className="ml-1 font-normal text-slate-400">orders</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        product.status === "focus" ? "bg-amber-400" : "bg-indigo-500"
                      }`}
                      style={{
                        width: `${Math.max(4, (product.orders / maximumOrders) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {data.limitations[0] && (
              <p className="mt-4 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400">
                {data.limitations[0]}
              </p>
            )}
          </aside>
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-slate-400">
          No clear campaign opportunity was found for this period.
        </p>
      )}
    </div>
  );
}

export function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(searchParams.get("new") === "1");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState(searchParams.get("segmentId") ?? "");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [offer, setOffer] = useState("20% off");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [opportunityPeriod, setOpportunityPeriod] = useState<30 | 90>(90);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<CampaignOpportunity | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "">("");

  const segments = useQuery({
    queryKey: ["segments"],
    queryFn: () => api<{ data: Segment[] }>("/api/segments"),
  });
  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<{ data: Campaign[] }>("/api/campaigns"),
  });
  const opportunities = useQuery({
    queryKey: ["campaign-opportunities", opportunityPeriod],
    queryFn: () =>
      api<CampaignOpportunityResponse>(
        `/api/ai/campaign-opportunities?periodDays=${opportunityPeriod}`,
      ),
    enabled: creating,
    staleTime: 5 * 60_000,
  });
  const selectedSegment = segments.data?.data.find((segment) => segment.id === segmentId);
  const segmentCustomers = useQuery({
    queryKey: ["segment-customers", segmentId],
    queryFn: () =>
      api<{ data: Customer[]; matchedCount: number }>(
        `/api/segments/${segmentId}/customers?limit=1`,
      ),
    enabled: Boolean(segmentId),
    staleTime: 30_000,
  });
  const sampleCustomer = segmentCustomers.data?.data[0];
  const personalizedPreview = useMemo(() => {
    if (!messageTemplate.trim() || !sampleCustomer) return "";
    const replacements: Record<string, string> = {
      name: sampleCustomer.name || "there",
      last_purchase_category: sampleCustomer.lastPurchaseCategory || "purchase",
    };
    return messageTemplate.replace(
      /\{\{(name|last_purchase_category)\}\}/g,
      (_match, key: string) => replacements[key] ?? "",
    );
  }, [messageTemplate, sampleCustomer]);

  const draft = useMutation({
    mutationFn: () =>
      api<{ messageTemplate: string; notes: string; provider: string }>("/api/ai/message-draft", {
        method: "POST",
        body: JSON.stringify({
          campaignGoal,
          channel,
          tone: "friendly",
          offer,
          featuredProducts: selectedOpportunity?.featuredProducts.map(
            (product) => product.productName,
          ),
          segmentSummary: { matchedCount: selectedSegment?.matchedCount ?? 0 },
        }),
      }),
    onSuccess: (data) => setMessageTemplate(data.messageTemplate),
  });
  const create = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ name, segmentId, channel, campaignGoal, messageTemplate }),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      navigate(`/campaigns/${data.id}`);
    },
  });
  const deleteCampaign = useMutation({
    mutationFn: (campaignId: string) =>
      api<{ deleted: true; id: string }>(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["segments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
  const applyOpportunity = useMutation({
    mutationFn: async (opportunity: CampaignOpportunity) => {
      const existing = savedSegments.find(
        (segment) =>
          segment.name === opportunity.suggestedAudience.name &&
          segment.rulesJson.category_purchased ===
            opportunity.suggestedAudience.rules.category_purchased,
      );
      const audience =
        existing ??
        (await api<Segment>("/api/segments", {
          method: "POST",
          body: JSON.stringify({
            name: opportunity.suggestedAudience.name,
            description: opportunity.suggestedAudience.description,
            rules: opportunity.suggestedAudience.rules,
          }),
        }));
      return { opportunity, audience };
    },
    onSuccess: async ({ opportunity, audience }) => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      setSelectedOpportunity(opportunity);
      setName(opportunity.campaignName);
      setCampaignGoal(opportunity.campaignGoal);
      setSegmentId(audience.id);
      setOffer(opportunity.offer);
      setMessageTemplate(opportunity.messageTemplate);
    },
  });

  const opportunityIdParam = searchParams.get("opportunityId");

  // Synchronize creating state with query parameters
  useEffect(() => {
    const isNew = searchParams.get("new") === "1" || searchParams.has("opportunityId");
    if (isNew !== creating) {
      setCreating(isNew);
    }
  }, [searchParams, creating]);

  // Auto-apply opportunity if opportunityId parameter is provided
  useEffect(() => {
    const savedSegmentsList = segments.data?.data ?? [];
    if (
      creating &&
      opportunityIdParam &&
      opportunities.data?.opportunities &&
      savedSegmentsList.length > 0 &&
      !selectedOpportunity &&
      !applyOpportunity.isPending &&
      !applyOpportunity.isSuccess &&
      !applyOpportunity.error
    ) {
      const match = opportunities.data.opportunities.find(
        (opp) => opp.id === opportunityIdParam
      );
      if (match) {
        applyOpportunity.mutate(match);
      }
    }
  }, [
    creating,
    opportunityIdParam,
    opportunities.data,
    segments.data,
    selectedOpportunity,
    applyOpportunity,
  ]);

  const startCreating = () => {
    setCreating(true);
    setStep(1);
    setSearchParams({ new: "1" });
  };
  const cancelCreating = () => {
    setCreating(false);
    setStep(1);
    setSearchParams({});
    setSelectedOpportunity(null);
  };

  if (segments.isLoading || campaigns.isLoading) return <LoadingState />;
  if (segments.error || campaigns.error) return <ErrorState error={segments.error ?? campaigns.error} />;

  const savedCampaigns = campaigns.data?.data ?? [];
  const savedSegments = segments.data?.data ?? [];
  const visibleCampaigns = savedCampaigns.filter((campaign) => {
    const searchValue = campaignSearch.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      campaign.name.toLowerCase().includes(searchValue) ||
      campaign.segment.name.toLowerCase().includes(searchValue);
    return matchesSearch && (!statusFilter || campaign.status === statusFilter);
  });

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title={creating ? "Create a campaign" : "Your campaigns"}
        description={
          creating
            ? "Choose an audience, set the creative direction, then review before sending."
            : "Create new campaigns or open an existing one to see results."
        }
        action={
          !creating && (
            <Button onClick={startCreating}>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          )
        }
      />

      {creating ? (
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${step === 1 ? "bg-leaf text-white" : "bg-[#edf5ef] text-leaf"}`}>
              1
            </span>
            <span className={step === 1 ? "font-semibold text-ink" : "text-slate-400"}>
              Audience
            </span>
            <span className="h-px flex-1 bg-slate-200" />
            <span className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${step === 2 ? "bg-leaf text-white" : "bg-slate-100 text-slate-400"}`}>
              2
            </span>
            <span className={step === 2 ? "font-semibold text-ink" : "text-slate-400"}>
              Creative direction
            </span>
          </div>

          <Card>
            {step === 1 ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Campaign setup</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Decide who should receive this campaign and what it should achieve.
                    </p>
                  </div>
                  <button
                    onClick={cancelCreating}
                    className="text-sm font-medium text-slate-400 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>

                <CampaignOpportunityPanel
                  data={opportunities.data}
                  isLoading={opportunities.isLoading}
                  error={opportunities.error}
                  period={opportunityPeriod}
                  selectedId={selectedOpportunity?.id}
                  applyingId={
                    applyOpportunity.isPending ? applyOpportunity.variables?.id : undefined
                  }
                  applyError={applyOpportunity.error}
                  onPeriodChange={(period) => {
                    setOpportunityPeriod(period);
                    setSelectedOpportunity(null);
                    setOffer("");
                    setMessageTemplate("");
                  }}
                  onUseIdea={(opportunity) => applyOpportunity.mutate(opportunity)}
                >
                  {savedSegments.length === 0 ? (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">
                        Choose an AI idea or create an audience
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        Using an idea above creates its recommended audience automatically.
                      </p>
                      <Link to="/segments?new=1">
                        <Button className="mt-4">Build one manually</Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Campaign details
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          Review and adjust your selected route
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Campaign name">
                          <Input
                            placeholder="Example: Summer win-back"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </Field>
                        <Field label="Audience">
                          <Select value={segmentId} onChange={(event) => setSegmentId(event.target.value)}>
                            <option value="">Choose an audience</option>
                            {savedSegments.map((segment) => (
                              <option key={segment.id} value={segment.id}>
                                {segment.name} ({segment.matchedCount} shoppers)
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Channel">
                          <Select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                            <option value="rcs">RCS</option>
                          </Select>
                        </Field>
                        <Field label={selectedOpportunity ? "AI-proposed offer" : "Offer"}>
                          <Input
                            placeholder="Example: Bonus points or 15% off"
                            value={offer}
                            onChange={(event) => setOffer(event.target.value)}
                          />
                        </Field>
                      </div>

                      {selectedOpportunity && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                {selectedOpportunity.incentiveLabel}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                This is an editable AI proposal. Confirm margin, fulfilment,
                                credits, points, or discount rules before launch.
                              </p>
                            </div>
                            <button
                              className="text-xs font-semibold text-slate-400 hover:text-ink"
                              onClick={() => {
                                setSelectedOpportunity(null);
                                setOffer("");
                                setMessageTemplate("");
                              }}
                            >
                              Clear idea
                            </button>
                          </div>
                          <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-600">
                            Featured products:{" "}
                            <span className="font-semibold text-ink">
                              {selectedOpportunity.featuredProducts
                                .map((product) => product.productName)
                                .join(" + ")}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="mt-4">
                        <Field label="What should this campaign achieve?">
                          <Input
                            placeholder="Example: Bring back shoppers who have not ordered recently"
                            value={campaignGoal}
                            onChange={(event) => setCampaignGoal(event.target.value)}
                          />
                        </Field>
                      </div>

                      {selectedSegment?.matchedCount === 0 && (
                        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          This audience currently has no matching shoppers. Adjust it before
                          creating the campaign.
                        </div>
                      )}

                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={() => setStep(2)}
                          disabled={
                            !name.trim() ||
                            !segmentId ||
                            !offer.trim() ||
                            !campaignGoal.trim() ||
                            selectedSegment?.matchedCount === 0
                          }
                        >
                          Continue to creative direction <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CampaignOpportunityPanel>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-ink"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={cancelCreating}
                    className="text-sm font-medium text-slate-400 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedSegment?.name} / {selectedSegment?.matchedCount ?? 0} shoppers /{" "}
                    {titleCase(channel)}
                  </p>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">Set the campaign direction</p>
                      <AiBadge />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      GPT-4o mini rewrites this direction and crafts a distinct personalized
                      message for every shopper at send time.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => draft.mutate()}
                    loading={draft.isPending}
                  >
                    <Bot className="h-4 w-4" /> Generate draft
                  </Button>
                </div>

                <div className="mt-4">
                  <Textarea
                    rows={7}
                    placeholder="Example: Invite shoppers back with a warm recommendation related to their latest purchase."
                    value={messageTemplate}
                    onChange={(event) => setMessageTemplate(event.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    GPT-4o mini varies the wording and purchase connection while preserving the
                    approved offer. Spend, order counts, location, and purchase timing stay out.
                  </p>
                </div>

                {(draft.error || create.error) && (
                  <div className="mt-4"><ErrorState error={draft.error ?? create.error} /></div>
                )}

                {personalizedPreview && sampleCustomer && (
                  <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-indigo-600">Draft preview</p>
                      <span className="text-xs text-slate-400">{sampleCustomer.name}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {personalizedPreview}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      GPT-4o mini will rewrite this uniquely for each shopper when the campaign is sent.
                    </p>
                  </div>
                )}

                {draft.data?.notes && (
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Draft note: {draft.data.notes}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-400">
                    {messageTemplate.length.toLocaleString()} characters
                  </p>
                  <Button
                    onClick={() => create.mutate()}
                    loading={create.isPending}
                    disabled={!messageTemplate.trim()}
                  >
                    Review campaign <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : savedCampaigns.length === 0 ? (
        <Card>
          <EmptyState title="No campaigns yet" body="Create your first campaign to start reaching shoppers." />
          <div className="mt-4 flex justify-center">
            <Button onClick={startCreating}>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-300" />
                <Input
                  className="pl-10"
                  placeholder="Search campaigns or audiences"
                  value={campaignSearch}
                  onChange={(event) => setCampaignSearch(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as CampaignStatus | "")
                }
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sending">Sending</option>
                <option value="completed">Completed</option>
                <option value="partially_failed">Partially failed</option>
                <option value="failed">Failed</option>
              </Select>
              <Button
                variant="secondary"
                disabled={!campaignSearch && !statusFilter}
                onClick={() => {
                  setCampaignSearch("");
                  setStatusFilter("");
                }}
              >
                <X className="h-4 w-4" /> Clear
              </Button>
            </div>
          </Card>

          {visibleCampaigns.length === 0 ? (
            <Card>
              <EmptyState
                title="No campaigns match"
                body="Clear the search or status filter to see more campaigns."
              />
            </Card>
          ) : (
            <>
              {deleteCampaign.error && (
                <div className="mb-4">
                  <ErrorState error={deleteCampaign.error} />
                </div>
              )}
              <div className="space-y-3">
                {visibleCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2 transition hover:border-slate-200 hover:shadow-soft"
                  >
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="group flex min-w-0 flex-1 flex-col justify-between gap-4 rounded-xl p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{campaign.name}</p>
                            <Badge value={campaign.status} />
                          </div>
                          <p className="mt-1 text-sm text-slate-400">
                            {campaign.segment.name} / {formatDate(campaign.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 sm:text-right">
                        <div>
                          <p className="font-bold text-slate-900">{campaign.stats.audienceSize || "-"}</p>
                          <p className="text-xs text-slate-400">audience</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{campaign.stats.deliveryRate}%</p>
                          <p className="text-xs text-slate-400">delivered</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-600" />
                      </div>
                    </Link>
                    <Button
                      variant="danger"
                      className="mr-2 px-3"
                      aria-label={`Delete ${campaign.name}`}
                      title={
                        campaign.status === "sending"
                          ? "Wait for this campaign to finish sending"
                          : "Delete campaign"
                      }
                      disabled={campaign.status === "sending"}
                      loading={
                        deleteCampaign.isPending &&
                        deleteCampaign.variables === campaign.id
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete the campaign "${campaign.name}" and its communication history? This cannot be undone.`,
                          )
                        ) {
                          deleteCampaign.mutate(campaign.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
