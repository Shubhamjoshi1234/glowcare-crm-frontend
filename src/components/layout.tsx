import {
  CircleDot,
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../lib/api";

const workflowNavigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/segments", label: "Audiences", icon: Users },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
];

const dataNavigation = [
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
];

function NavigationLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  const system = useQuery({
    queryKey: ["system-health"],
    queryFn: () =>
      api<{
        crm: { ok: boolean };
        channel: { ok: boolean };
        ai: { provider: "openai" | "fallback"; model: string | null };
      }>("/api/system/health"),
    refetchInterval: 10_000,
    retry: false,
  });
  const crmReady = system.data?.crm.ok ?? false;
  const channelReady = system.data?.channel.ok ?? false;
  const aiProvider = system.data?.ai.provider ?? "fallback";
  const aiLabel =
    aiProvider === "openai"
      ? system.data?.ai.model ?? "OpenAI"
      : "AI fallback";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Sparkles className="h-4.5 w-4.5 text-white h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">GlowCare</p>
            <p className="text-[11px] text-slate-400 font-medium">Marketing CRM</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="mb-1.5 mt-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workflow
          </p>
          {workflowNavigation.map((item) => (
            <NavigationLink key={item.to} {...item} />
          ))}
          <p className="mb-1.5 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Data
          </p>
          {dataNavigation.map((item) => (
            <NavigationLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-indigo-500" />
              <span className="max-w-28 truncate text-[11px] font-bold text-indigo-700">
                {aiLabel}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  aiProvider === "openai"
                    ? "animate-pulse bg-indigo-500"
                    : "bg-amber-500"
                }`}
              />
              {aiProvider === "openai" ? "Active" : "Local"}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-medium text-slate-400">
            <div className="flex items-center justify-between">
              <span>CRM API</span>
              <CircleDot className={`h-3 w-3 ${crmReady ? "fill-emerald-500 text-emerald-500" : "fill-red-400 text-red-400"}`} />
            </div>
            <div className="flex items-center justify-between">
              <span>Channel Sim</span>
              <CircleDot className={`h-3 w-3 ${channelReady ? "fill-emerald-500 text-emerald-500" : "fill-red-400 text-red-400"}`} />
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">GlowCare</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {[...workflowNavigation, ...dataNavigation].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="min-h-screen px-4 py-7 sm:px-7 lg:ml-60 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
