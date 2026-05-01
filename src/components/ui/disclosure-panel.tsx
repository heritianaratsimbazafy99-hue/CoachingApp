import type { DetailsHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

type DisclosurePanelProps = DetailsHTMLAttributes<HTMLDetailsElement> & {
  children: ReactNode;
  description?: string;
  title: string;
};

export function DisclosurePanel({
  children,
  className,
  description,
  title,
  ...props
}: DisclosurePanelProps) {
  return (
    <details
      className={cn(
        "group rounded-xl border border-slate-200/80 bg-slate-50/80 ring-1 ring-white transition open:border-sky-200 open:bg-white open:shadow-sm open:shadow-slate-950/[0.04]",
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block break-words text-slate-900">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500">
              {description}
            </span>
          ) : null}
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition group-open:rotate-180 group-open:border-sky-100 group-open:text-sky-700">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 pt-4">
        {children}
      </div>
    </details>
  );
}
