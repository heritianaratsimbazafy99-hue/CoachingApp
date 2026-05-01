import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils/cn";

type ListPanelProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  countLabel?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
};

export function ListPanel({
  actions,
  children,
  className,
  countLabel,
  description,
  icon: Icon,
  title,
  ...props
}: ListPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {countLabel || actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {countLabel ? (
              <span className="w-fit rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-white">
                {countLabel}
              </span>
            ) : null}
            {actions}
          </div>
        ) : null}
      </CardHeader>
      {children}
    </Card>
  );
}

export function ListPanelBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("divide-y divide-slate-100", className)}
      {...props}
    />
  );
}

export function ListPanelRow({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid min-w-0 items-start gap-4 overflow-hidden p-4 transition hover:bg-sky-50/35 sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function ListMetaTile({
  children,
  className,
  label,
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 ring-1 ring-white",
        className,
      )}
    >
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-700">
        {children}
      </div>
    </div>
  );
}
