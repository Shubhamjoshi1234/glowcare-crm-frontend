import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { Campaign, Channel, Communication, Customer } from "../types";
import { Badge, ErrorState, LoadingState } from "./ui";

interface CustomerOrder {
  id: string;
  productName: string;
  category: string;
  amount: number;
  orderDate: string;
}

interface CustomerCommunication {
  id: string;
  channel: Channel;
  currentStatus: string;
  updatedAt: string;
  campaign: Pick<Campaign, "id" | "name" | "channel">;
}

interface CustomerProfileResponse {
  customer: Customer;
  orders: CustomerOrder[];
  communications: CustomerCommunication[];
}

const lifecycleSteps: Array<{
  label: string;
  key: keyof Pick<
    Communication,
    | "createdAt"
    | "sentAt"
    | "deliveredAt"
    | "openedAt"
    | "readAt"
    | "clickedAt"
    | "convertedAt"
    | "failedAt"
  >;
}> = [
  { label: "Queued", key: "createdAt" },
  { label: "Sent", key: "sentAt" },
  { label: "Delivered", key: "deliveredAt" },
  { label: "Opened", key: "openedAt" },
  { label: "Read", key: "readAt" },
  { label: "Clicked", key: "clickedAt" },
  { label: "Converted", key: "convertedAt" },
  { label: "Failed", key: "failedAt" },
];

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export function CustomerProfileDrawer({
  communication,
  onClose,
}: {
  communication: Communication | null;
  onClose: () => void;
}) {
  const profile = useQuery({
    queryKey: ["customer-profile", communication?.customer.id],
    queryFn: () =>
      api<CustomerProfileResponse>(`/api/customers/${communication?.customer.id}`),
    enabled: Boolean(communication?.customer.id),
  });

  if (!communication) return null;

  const profileData = profile.data;
  const customer = profileData?.customer;
  const averageOrderValue =
    customer && customer.orderCount > 0 ? customer.totalSpend / customer.orderCount : 0;
  const completedLifecycle = lifecycleSteps.filter(({ key }) => communication[key]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close customer profile"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-semibold text-leaf">Shopper profile</p>
            <p className="mt-1 text-sm text-slate-400">
              Customer details, purchases, and campaign activity
            </p>
          </div>
          <button
            type="button"
            aria-label="Close profile"
            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:text-ink"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {profile.isLoading ? (
          <LoadingState />
        ) : profile.error ? (
          <div className="p-6"><ErrorState error={profile.error} /></div>
        ) : customer && profileData ? (
          <div className="space-y-6 p-5 sm:p-7">
            <section>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf text-lg font-bold text-white">
                    {customer.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink">
                      {customer.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge value={communication.currentStatus} />
                      <Badge value={customer.preferredChannel} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-300" />
                  {customer.city || "Location unavailable"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ContactRow icon={Mail} label="Email" value={customer.email} />
                <ContactRow icon={Phone} label="Phone" value={customer.phone} />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-leaf" />
                <h3 className="font-semibold text-ink">Customer value</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 p-3.5">
                  <p className="text-xs text-slate-400">Lifetime spend</p>
                  <p className="mt-1.5 font-bold">{formatMoney(customer.totalSpend)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3.5">
                  <p className="text-xs text-slate-400">Orders</p>
                  <p className="mt-1.5 font-bold">{customer.orderCount}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3.5">
                  <p className="text-xs text-slate-400">Average order</p>
                  <p className="mt-1.5 font-bold">{formatMoney(averageOrderValue)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3.5">
                  <p className="text-xs text-slate-400">Last ordered</p>
                  <p className="mt-1.5 text-sm font-bold">
                    {formatDate(customer.lastOrderDate)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {customer.categoriesPurchased?.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {titleCase(category)}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-leaf" />
                  <h3 className="font-semibold text-ink">This campaign</h3>
                </div>
                <Badge value={communication.currentStatus} />
              </div>
              <p className="mt-4 rounded-xl bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
                {communication.personalizedMessage}
              </p>
              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  {communication.personalizationSource === "openai"
                    ? "GPT-4o mini personalized"
                    : communication.personalizationSource === "fallback"
                      ? "Journey-aware fallback"
                      : "Template personalization"}
                </p>
                {communication.personalizationReason && (
                  <p className="mt-1.5 text-xs leading-5 text-emerald-800">
                    {communication.personalizationReason}
                  </p>
                )}
              </div>
              {communication.failureReason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {communication.failureReason}
                </p>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {completedLifecycle.map(({ label, key }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-leaf" />
                      <span className="text-xs font-semibold text-slate-600">{label}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(communication[key])}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-leaf" />
                  <h3 className="font-semibold text-ink">Order history</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {profileData.orders.length} orders
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                {profileData.orders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {order.productName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {titleCase(order.category)} / {formatDate(order.orderDate)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-ink">{formatMoney(order.amount)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-leaf" />
                <h3 className="font-semibold text-ink">Recent campaign history</h3>
              </div>
              <div className="space-y-2">
                {profileData.communications.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {item.campaign.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {titleCase(item.channel)} / {formatDate(item.updatedAt)}
                      </p>
                    </div>
                    <Badge value={item.currentStatus} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
