import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  helper?: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export function StatCard({ helper, icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? <p className="mt-4 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
