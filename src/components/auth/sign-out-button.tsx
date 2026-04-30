"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

type SignOutButtonProps = {
  className?: string;
  display?: "desktop" | "inline";
};

export function SignOutButton({
  className,
  display = "desktop",
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className={cn(
        "items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60",
        display === "desktop" ? "hidden sm:inline-flex" : "inline-flex",
        className,
      )}
      disabled={isSigningOut}
      onClick={handleSignOut}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}
