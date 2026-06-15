import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, queryString } from "../lib/api";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { Channel, Customer } from "../types";
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
  Pagination,
  Select,
} from "../components/ui";

interface CustomersResponse {
  data: Customer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface CustomerOptions {
  cities: string[];
  channels: Channel[];
}

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [city, setCity] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<Channel | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const options = useQuery({
    queryKey: ["customer-options"],
    queryFn: () => api<CustomerOptions>("/api/customers/options"),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const customers = useQuery({
    queryKey: ["customers", debouncedSearch, city, preferredChannel, page],
    queryFn: () =>
      api<CustomersResponse>(
        `/api/customers${queryString({
          search: debouncedSearch,
          city,
          preferredChannel,
          page,
          limit: 20,
        })}`,
      ),
    placeholderData: (previous) => previous,
  });

  const hasFilters = Boolean(search || city || preferredChannel);
  const customerData = customers.data;
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCity("");
    setPreferredChannel("");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        eyebrow="Customer data"
        title="Customers"
        description="Search shopper profiles and filter them by location or preferred channel."
      />
      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_190px_auto] lg:items-end">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-300" />
              <Input
                className="pl-10"
                placeholder="Name, email, or phone"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Field>
          <Field label="City">
            <Select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All cities</option>
              {(options.data?.cities ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preferred channel">
            <Select
              value={preferredChannel}
              onChange={(event) => {
                setPreferredChannel(event.target.value as Channel | "");
                setPage(1);
              }}
            >
              <option value="">All channels</option>
              {(options.data?.channels ?? ["whatsapp", "sms", "email", "rcs"]).map(
                (channel) => (
                  <option key={channel} value={channel}>
                    {titleCase(channel)}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Button
            variant="secondary"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="lg:mb-0"
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>

        {options.error && (
          <div className="mt-4">
            <ErrorState error={options.error} />
          </div>
        )}

        {customers.isLoading || !customerData ? (
          <LoadingState />
        ) : customers.error ? (
          <div className="mt-5">
            <ErrorState error={customers.error} />
          </div>
        ) : (
          <>
            <div className="mb-3 mt-6 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">
                {customerData.pagination.total.toLocaleString()} matching customers
                {customerData.pagination.total > customerData.data.length
                  ? ` / showing ${customerData.data.length}`
                  : ""}
              </p>
              {customers.isFetching && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Updating
                </span>
              )}
            </div>

            {customerData.data.length === 0 ? (
              <EmptyState
                title="No customers match"
                body="Try removing a filter or searching with a broader term."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Location</th>
                      <th className="px-3 py-3 font-medium">Purchase summary</th>
                      <th className="px-3 py-3 font-medium">Last purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.data.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-800">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {customer.email ?? customer.phone ?? "No contact details"}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-slate-600">{customer.city ?? "Unknown city"}</p>
                          <div className="mt-1">
                            <Badge value={customer.preferredChannel} />
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-medium text-slate-800">{formatMoney(customer.totalSpend)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {customer.orderCount} orders
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="capitalize text-slate-600">
                            {customer.lastPurchaseCategory ?? "No purchases"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(customer.lastOrderDate)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={customerData.pagination.page}
              totalPages={customerData.pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
