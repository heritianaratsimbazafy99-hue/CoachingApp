import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type ReferencePillProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: "indigo" | "sky" | "slate";
};

const toneStyles: Record<NonNullable<ReferencePillProps["tone"]>, string> = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700 ring-indigo-100",
  sky: "border-sky-100 bg-sky-50 text-sky-700 ring-sky-100",
  slate: "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100",
};

export function ReferencePill({
  children,
  className,
  title,
  tone = "sky",
}: ReferencePillProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-[14rem] min-w-0 shrink-0 items-center justify-center overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ring-1 sm:max-w-[18rem]",
        toneStyles[tone],
        className,
      )}
      title={title}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
