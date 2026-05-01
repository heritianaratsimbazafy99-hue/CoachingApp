import type { HTMLAttributes } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";

type FormStatusMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  compact?: boolean;
  message: string;
  status: "error" | "idle" | "success";
};

export function FormStatusMessage({
  className,
  compact = false,
  message,
  status,
  ...props
}: FormStatusMessageProps) {
  if (!message) {
    return null;
  }

  const isError = status === "error";
  const Icon = isError ? TriangleAlert : CircleCheck;

  return (
    <p
      className={cn(
        "flex min-w-0 items-start gap-2 break-words rounded-xl border font-medium ring-1",
        compact ? "px-3 py-2 text-xs" : "px-3.5 py-2.5 text-sm",
        isError
          ? "border-rose-200 bg-rose-50 text-rose-700 ring-rose-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100",
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{message}</span>
    </p>
  );
}
