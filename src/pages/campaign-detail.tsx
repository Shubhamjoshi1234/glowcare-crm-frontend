import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, ChevronDown, Radio, RefreshCw, Send, UserRoundSearch } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { Campaign, Communication, ReceiptEvent } from "../types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from "../components/ui";
import { CustomerProfileDrawer } from "../components/customer-profile-drawer";

interface CampaignDetailResponse {
  campaign: Omit<Campaign, "stats">;
  stats: Campaign["stats"];
  communications: Communication[];
  receiptEvents: ReceiptEvent[];
  currentAudienceSize: number | null;
}

export function CampaignDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedCommunication, setSelectedCommunication] =
    useState<Communication | null>(null);
  const campaign = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api<CampaignDetailResponse>(`/api/campaigns/${id}`),
    refetchInterval: (query) => {
      const current = query.state.data as CampaignDetailResponse | undefined;
      const hasPending = current?.communications.some((communication) =>
        ["queued", "sent"].includes(communication.currentStatus),
      );
      const withinSimulationWindow =
        current?.campaign.sentAt &&
        Date.now() - new Date(current.campaign.sentAt).getTime() < 18_000;
      return hasPending || withinSimulationWindow ? 2500 : false;
    },
  });
  const send = useMutation({
    mutationFn: () => api(`/api/campaigns/${id}/send`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (campaign.isLoading) return <LoadingState />;
  if (campaign.error) return <ErrorState error={campaign.error} />;

  const data = campaign.data!;
  const isDraft = data.campaign.status === "draft";
  const isActive =
    data.communications.some((communication) =>
      ["queued", "sent"].includes(communication.currentStatus),
    ) ||
    Boolean(
      data.campaign.sentAt &&
        Date.now() - new Date(data.campaign.sentAt).getTime() < 18_000,
    );
  const funnel = [
    { name: "Audience", value: data.stats.audienceSize },
    { name: "Sent", value: data.stats.sent },
    { name: "Delivered", value: data.stats.delivered },
    { name: "Read", value: data.stats.read },
    { name: "Clicked", value: data.stats.clicked },
    { name: "Converted", value: data.stats.converted },
  ];
  const aiPersonalizedCount = data.communications.filter(
    (communication) => communication.personalizationSource === "openai",
  ).length;
  const fallbackPersonalizedCount = data.communications.filter(
    (communication) => communication.personalizationSource === "fallback",
  ).length;

  return (
    <>
      <Link
        to="/campaigns"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-leaf"
      >
        <ArrowLeft className="h-4 w-4" /> Campaigns
      </Link>

      <PageHeader
        eyebrow={isDraft ? "Review campaign" : "Campaign results"}
        title={data.campaign.name}
        description={`${data.campaign.segment.name} / ${data.campaign.channel}`}
        action={
          <div className="flex items-center gap-2">
            <Badge value={data.campaign.status} />
            {!isDraft && (
              <Button
                variant="secondary"
                onClick={() => void campaign.refetch()}
                loading={campaign.isFetching}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            )}
          </div>
        }
      />

      {send.error && <div className="mb-5"><ErrorState error={send.error} /></div>}

      {isDraft ? (
        <Card className="mx-auto max-w-4xl">
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-slate-400">Audience</p>
              <p className="mt-2 text-lg font-semibold">{data.campaign.segment.name}</p>
              <p className="mt-1 text-sm capitalize text-slate-400">
                Sent by {data.campaign.channel}
              </p>
              {data.campaign.campaignGoal && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-400">Goal</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {data.campaign.campaignGoal}
                  </p>
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-[#f4f7f4] p-5">
              <p className="text-sm font-semibold text-slate-400">Creative direction</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {data.campaign.messageTemplate}
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row">
            <p className="text-sm text-slate-400">
              GPT-4o mini will write {data.currentAudienceSize ?? 0} distinct journey-aware
              messages before the channel simulator sends them.
            </p>
            <Button onClick={() => send.mutate()} loading={send.isPending}>
              <Send className="h-4 w-4" />
              {send.isPending ? "Personalizing every message..." : "Send campaign"}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {isActive && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Radio className="h-4 w-4 animate-pulse" />
              Messages are being processed. Results update automatically.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Audience" value={data.stats.audienceSize} detail={`${data.stats.sent} sent`} accent />
            <MetricCard label="Delivered" value={`${data.stats.deliveryRate}%`} detail={`${data.stats.delivered} messages`} />
            <MetricCard label="Read" value={`${data.stats.readRate}%`} detail={`${data.stats.read} shoppers`} />
            <MetricCard
              label="Clicked"
              value={data.stats.clicked}
              detail={`${data.stats.clickRate}% of delivered`}
            />
            <MetricCard
              label="Converted"
              value={data.stats.converted}
              detail={`${data.stats.conversionRate}% of delivered`}
            />
            <MetricCard label="Failed" value={data.stats.failed} detail="provider failures" />
          </div>

          {(aiPersonalizedCount > 0 || fallbackPersonalizedCount > 0) && (
            <div className="mt-4 flex flex-wrap gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="font-semibold">Individual message generation:</span>
              {aiPersonalizedCount > 0 && (
                <span>{aiPersonalizedCount} written by GPT-4o mini</span>
              )}
              {fallbackPersonalizedCount > 0 && (
                <span>{fallbackPersonalizedCount} used the journey-aware fallback</span>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Campaign funnel</p>
                  <p className="mt-1 text-xs text-slate-400">From audience to click</p>
                </div>
                <Activity className="h-4 w-4 text-leaf" />
              </div>
              <div className="overflow-x-auto">
                <BarChart
                  width={600}
                  height={256}
                  data={funnel}
                  margin={{ top: 10, right: 10, bottom: 0, left: -24 }}
                >
                  <CartesianGrid vertical={false} stroke="#edf0eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#839088" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#839088" }} />
                  <Tooltip cursor={{ fill: "#f6f8f5" }} contentStyle={{ borderRadius: 12, border: "1px solid #edf0eb" }} />
                  <Bar dataKey="value" fill="#28634a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Shopper activity</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Select a shopper to see contact and purchase history
                  </p>
                </div>
                <UserRoundSearch className="h-4 w-4 text-leaf" />
              </div>
              {data.communications.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="Waiting for messages" body="Recipient activity will appear here." />
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {data.communications.slice(0, 6).map((communication) => (
                    <button
                      type="button"
                      key={communication.id}
                      data-testid={`customer-profile-card-${communication.id}`}
                      onClick={() => setSelectedCommunication(communication)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{communication.customer.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {communication.customer.city ?? "Unknown city"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge value={communication.currentStatus} />
                        <span className="text-xs font-semibold text-leaf">View</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="mt-6">
            <p className="font-semibold">Campaign creative direction</p>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {data.campaign.messageTemplate}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Sent {formatDate(data.campaign.sentAt)}
            </p>
          </Card>

          <details className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold">Delivery details</p>
                <p className="mt-1 text-xs text-slate-400">
                  Communication records and callback history
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 p-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Personalized message</th>
                      <th className="px-3 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.communications.map((communication) => (
                      <tr key={communication.id} className="border-b border-slate-50 align-top">
                        <td className="px-3 py-4 font-medium">
                          <button
                            type="button"
                            data-testid={`customer-profile-row-${communication.id}`}
                            onClick={() => setSelectedCommunication(communication)}
                            className="text-left font-semibold text-ink hover:text-leaf"
                          >
                            {communication.customer.name}
                            <span className="mt-1 block text-[11px] font-medium text-slate-400">
                              View customer profile
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-4"><Badge value={communication.currentStatus} /></td>
                        <td className="max-w-md px-3 py-4 text-xs leading-5 text-slate-500">
                          {communication.personalizedMessage}
                          <span className="mt-2 block font-semibold text-emerald-700">
                            {communication.personalizationSource === "openai"
                              ? "GPT-4o mini"
                              : communication.personalizationSource === "fallback"
                                ? "Journey fallback"
                                : "Template personalization"}
                          </span>
                          {communication.personalizationReason && (
                            <span className="mt-1 block text-[11px] leading-4 text-slate-400">
                              {communication.personalizationReason}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-400">
                          {formatDate(communication.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="mt-5 rounded-xl bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-500">
                  Callback events ({data.receiptEvents.length})
                </summary>
                <div className="grid gap-2 border-t border-slate-100 p-4 md:grid-cols-2">
                  {data.receiptEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge value={event.status} />
                        <span className="text-xs text-slate-400">
                          {event.processed ? "Processed" : "Unprocessed"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(event.receivedAt)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </details>
          <CustomerProfileDrawer
            communication={selectedCommunication}
            onClose={() => setSelectedCommunication(null)}
          />
        </>
      )}
    </>
  );
}
