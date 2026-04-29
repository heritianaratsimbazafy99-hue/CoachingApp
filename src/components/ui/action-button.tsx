"use client";

import { toast } from "sonner";

type ActionButtonProps = {
  children: React.ReactNode;
  confirmMessage?: string;
  message: string;
  variant?: "danger" | "primary" | "secondary";
};

export function ActionButton({
  children,
  confirmMessage,
  message,
  variant = "secondary",
}: ActionButtonProps) {
  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    toast.success(message);
  }

  const classes = {
    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-100",
    primary:
      "border-sky-600 bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-100",
    secondary:
      "border-sky-100 bg-white text-slate-700 hover:bg-sky-50 focus:ring-sky-100",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 ${classes[variant]}`}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}
