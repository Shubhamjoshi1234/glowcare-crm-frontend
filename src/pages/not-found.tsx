import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 shadow-soft">
        <span className="text-3xl font-extrabold text-slate-400">404</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Page not found</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">This page doesn't exist</h1>
      <p className="mt-3 text-sm text-slate-500 leading-6">
        Return home and continue with the customer, audience, and campaign workflow.
      </p>
      <Link to="/" className="mt-8 inline-block">
        <Button>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
