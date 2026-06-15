import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, queryString } from "../lib/api";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { Order } from "../types";
import {
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

interface OrdersResponse {
  data: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface OrderOptions {
  categories: string[];
}

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const options = useQuery({
    queryKey: ["order-options"],
    queryFn: () => api<OrderOptions>("/api/orders/options"),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const orders = useQuery({
    queryKey: ["orders", debouncedSearch, category, fromDate, toDate, page],
    queryFn: () =>
      api<OrdersResponse>(
        `/api/orders${queryString({
          search: debouncedSearch,
          category,
          fromDate,
          toDate,
          page,
          limit: 20,
        })}`,
      ),
    placeholderData: (previous) => previous,
  });

  const hasFilters = Boolean(search || category || fromDate || toDate);
  const orderData = orders.data;
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        eyebrow="Purchase behavior"
        title="Orders"
        description="Search purchases and filter the order data used to create audiences."
      />
      <Card>
        <div className="grid gap-3 xl:grid-cols-[1fr_190px_170px_170px_auto] xl:items-end">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-300" />
              <Input
                className="pl-10"
                placeholder="Product, customer, or category"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {(options.data?.categories ?? []).map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Button variant="secondary" onClick={clearFilters} disabled={!hasFilters}>
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>

        {options.error && (
          <div className="mt-4">
            <ErrorState error={options.error} />
          </div>
        )}

        {orders.isLoading || !orderData ? (
          <LoadingState />
        ) : orders.error ? (
          <div className="mt-5">
            <ErrorState error={orders.error} />
          </div>
        ) : (
          <>
            <div className="mb-3 mt-6 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">
                {orderData.pagination.total.toLocaleString()} matching orders
                {orderData.pagination.total > orderData.data.length
                  ? ` / showing ${orderData.data.length}`
                  : ""}
              </p>
              {orders.isFetching && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Updating
                </span>
              )}
            </div>

            {orderData.data.length === 0 ? (
              <EmptyState
                title="No orders match"
                body="Try removing a filter or searching with a broader term."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="px-3 py-3 font-medium">Product</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.data.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-50 hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">{order.productName}</p>
                          <p className="mt-1 text-xs capitalize text-slate-400">
                            {order.category}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p>{order.customer.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {order.customer.city ?? "Unknown city"}
                          </p>
                        </td>
                        <td className="px-3 py-4 font-medium">
                          {formatMoney(order.amount)}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {formatDate(order.orderDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={orderData.pagination.page}
              totalPages={orderData.pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
