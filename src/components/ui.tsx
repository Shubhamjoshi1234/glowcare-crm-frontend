import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { LoaderCircle, Zap } from "lucide-react";
import { titleCase } from "../lib/format";

/* ── Page Header ─────────────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────── */
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-soft ${className}`}
      {...props}
    />
  );
}

/* ── Metric Card ─────────────────────────────────────────────────── */
export function MetricCard({
  label,
  value,
  detail,
  accent = false,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft ${
        accent
          ? "border-indigo-200 bg-indigo-600"
          : "border-slate-200 bg-white shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-indigo-200" : "text-slate-500"}`}>
          {label}
        </p>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-white/15" : "bg-slate-50 border border-slate-100"}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {detail && (
        <p className={`mt-1.5 text-xs font-medium ${accent ? "text-indigo-200" : "text-slate-400"}`}>
          {detail}
        </p>
      )}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────── */
export function Button({
  children,
  className = "",
  variant = "primary",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-700/20",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/* ── AI Badge ────────────────────────────────────────────────────── */
export function AiBadge({
  model = "GPT-4o mini",
  provider = "openai",
}: {
  model?: string;
  provider?: "openai" | "fallback" | "mock";
}) {
  if (provider !== "openai") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
        Rule-based
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
      <Zap className="h-2.5 w-2.5" />
      {model}
    </span>
  );
}

/* ── Badge ───────────────────────────────────────────────────────── */
export function Badge({ value }: { value: string }) {
  const palette: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    queued: "bg-amber-50 text-amber-700 border-amber-200",
    sending: "bg-blue-50 text-blue-700 border-blue-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    delivered: "bg-teal-50 text-teal-700 border-teal-200",
    opened: "bg-violet-50 text-violet-700 border-violet-200",
    read: "bg-purple-50 text-purple-700 border-purple-200",
    clicked: "bg-orange-50 text-orange-700 border-orange-200",
    converted: "bg-emerald-50 text-emerald-800 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    partially_failed: "bg-amber-50 text-amber-800 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sms: "bg-blue-50 text-blue-700 border-blue-200",
    email: "bg-violet-50 text-violet-700 border-violet-200",
    rcs: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        palette[value] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {titleCase(value)}
    </span>
  );
}

/* ── Input ───────────────────────────────────────────────────────── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

/* ── Select ──────────────────────────────────────────────────────── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

/* ── Textarea ────────────────────────────────────────────────────── */
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

/* ── Field ───────────────────────────────────────────────────────── */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

/* ── EmptyState ──────────────────────────────────────────────────── */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

/* ── LoadingState ────────────────────────────────────────────────── */
export function LoadingState() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-400">
      <LoaderCircle className="h-6 w-6 animate-spin text-indigo-400" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  );
}

/* ── ErrorState ──────────────────────────────────────────────────── */
export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      <span className="font-semibold">Error: </span>
      {error instanceof Error ? error.message : "Something went wrong."}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────── */
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
