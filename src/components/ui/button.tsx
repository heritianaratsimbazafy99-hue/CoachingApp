import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold tracking-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55",
  {
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
    variants: {
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-10 px-4",
        lg: "min-h-11 px-5",
      },
      variant: {
        danger:
          "border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-950/10 hover:bg-rose-700 focus-visible:outline-rose-600",
        ghost:
          "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-sky-600",
        primary:
          "border border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-950/15 hover:bg-sky-700 focus-visible:outline-sky-600",
        secondary:
          "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-sky-600",
        soft:
          "border border-sky-100 bg-sky-50 text-sky-800 shadow-sm shadow-sky-950/[0.03] hover:border-sky-200 hover:bg-sky-100 focus-visible:outline-sky-600",
      },
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      type={type}
      {...props}
    />
  );
}
