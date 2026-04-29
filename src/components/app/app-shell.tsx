"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  GraduationCap,
  Home,
  Library,
  Menu,
  MessageCircle,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { NavItem, UserRole } from "@/types/coaching";
import { cn } from "@/utils/cn";

type AppShellProps = {
  account?: {
    email?: string;
    fullName?: string;
  };
  children: React.ReactNode;
  navItems: NavItem[];
  role: UserRole;
  subtitle: string;
};

const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  coach: "Coach",
  coachee: "Coaché",
};

const iconMap: Record<string, LucideIcon> = {
  book: BookOpen,
  calendar: CalendarDays,
  chart: BarChart3,
  check: CheckSquare,
  clipboard: ClipboardCheck,
  graduation: GraduationCap,
  home: Home,
  library: Library,
  message: MessageCircle,
  settings: Settings,
  users: UsersRound,
};

export function AppShell({
  account,
  children,
  navItems,
  role,
  subtitle,
}: AppShellProps) {
  const pathname = usePathname();
  const accountName = account?.fullName ?? roleLabel[role];
  const accountEmail = account?.email ?? "Session active";

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 p-6">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Coaching Platform
              </Link>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/${role}` && pathname.startsWith(item.href));
                const Icon = iconMap[item.icon] ?? Home;

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="truncate text-sm font-semibold">{accountName}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {roleLabel[role]} · {accountEmail}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
            <button
              aria-label="Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="ml-2 truncate text-sm text-slate-500">
                Rechercher contenus, coachés, quiz...
              </span>
            </div>
            <button
              aria-label="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
              type="button"
            >
              <Bell className="h-5 w-5" />
            </button>
            <SignOutButton />
          </header>

          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
