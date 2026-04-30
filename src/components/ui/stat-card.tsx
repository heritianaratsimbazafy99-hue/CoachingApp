import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  helper?: string;
  icon: LucideIcon;
  label: string;
  tone?: "amber" | "emerald" | "indigo" | "rose" | "sky";
  value: string;
};

const toneStyles = {
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  sky: "border-sky-100 bg-sky-50 text-sky-700",
};

export function StatCard({
  helper,
  icon: Icon,
  label,
  tone = "emerald",
  value,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-sky-100/80 bg-white/95 p-5 shadow-sm shadow-sky-900/[0.04] ring-1 ring-white/70 transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={`rounded-lg border p-2 ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? <p className="mt-4 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
