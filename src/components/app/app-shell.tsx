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

const roleAccent: Record<
  UserRole,
  {
    active: string;
    avatar: string;
    dot: string;
    shell: string;
  }
> = {
  admin: {
    active: "bg-[#f97316] text-white shadow-sm shadow-orange-950/20",
    avatar: "from-orange-400 to-rose-500",
    dot: "bg-orange-400",
    shell: "from-orange-50 via-[#f7f6ef] to-emerald-50",
  },
  coach: {
    active: "bg-[#047857] text-white shadow-sm shadow-emerald-950/20",
    avatar: "from-emerald-400 to-teal-500",
    dot: "bg-emerald-400",
    shell: "from-emerald-50 via-[#f7f6ef] to-indigo-50",
  },
  coachee: {
    active: "bg-[#4f46e5] text-white shadow-sm shadow-indigo-950/20",
    avatar: "from-indigo-400 to-sky-500",
    dot: "bg-indigo-400",
    shell: "from-indigo-50 via-[#f7f6ef] to-amber-50",
  },
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
  const accent = roleAccent[role];

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br text-slate-950",
        accent.shell,
      )}
    >
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-emerald-900/10 bg-[#10231f] text-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-6">
              <Link
                href="/"
                className="flex items-center gap-3 text-lg font-semibold tracking-tight"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white",
                    accent.avatar,
                  )}
                >
                  CP
                </span>
                <span>Coaching Platform</span>
              </Link>
              <p className="mt-3 text-sm text-emerald-50/65">{subtitle}</p>
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
                        ? accent.active
                        : "text-emerald-50/72 hover:bg-white/8 hover:text-white",
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

            <div className="border-t border-white/10 p-4">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      accent.dot,
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {accountName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-50/65">
                  {roleLabel[role]} · {accountEmail}
                </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-emerald-900/10 bg-white/82 px-4 py-3 backdrop-blur-xl lg:px-6">
            <button
              aria-label="Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-700 shadow-sm lg:hidden"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-emerald-900/10 bg-white px-3 py-2 shadow-sm shadow-emerald-950/5">
              <Search className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="ml-2 truncate text-sm text-slate-500">
                Rechercher contenus, coachés, quiz...
              </span>
            </div>
            <button
              aria-label="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-700 shadow-sm shadow-emerald-950/5 transition hover:border-emerald-200 hover:text-emerald-700"
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
