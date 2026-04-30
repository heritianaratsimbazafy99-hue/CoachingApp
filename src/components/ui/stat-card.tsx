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
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-950/[0.04] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {value}
          </p>
        </div>
        <div className={`rounded-lg border p-2.5 ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? <p className="mt-4 text-sm leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}
