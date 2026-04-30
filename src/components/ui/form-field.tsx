import { cn } from "@/utils/cn";

export const labelClassName = "text-sm font-semibold text-slate-700";

export function inputClassName(className?: string) {
  return cn(
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm shadow-slate-950/[0.02] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    className,
  );
}

export function textareaClassName(className?: string) {
  return cn(inputClassName("min-h-28 leading-6"), className);
}
