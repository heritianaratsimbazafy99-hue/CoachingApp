import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type FormSectionProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  bodyClassName?: string;
  description?: string;
  icon?: LucideIcon;
  title: string;
};

export function FormSection({
  actions,
  bodyClassName,
  children,
  className,
  description,
  icon: Icon,
  title,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70 ring-1 ring-white",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      <div className={cn("space-y-4 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
