import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/90 p-8 text-center shadow-sm shadow-emerald-950/5">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
