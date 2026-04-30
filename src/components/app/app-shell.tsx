"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Route,
  Search,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type {
  AppShellAlertTone,
  AppShellSignals,
  NavItem,
  UserRole,
} from "@/types/coaching";
import { cn } from "@/utils/cn";

type AppShellProps = {
  account?: {
    email?: string;
    fullName?: string;
  };
  children: React.ReactNode;
  navItems: NavItem[];
  role: UserRole;
  signals?: AppShellSignals;
  subtitle: string;
};

const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  coach: "Coach",
  coachee: "Coaché",
};

const emptySignals: AppShellSignals = {
  alerts: [],
  navBadges: {},
  notificationCount: 0,
};

const iconMap: Record<string, LucideIcon> = {
  bell: Bell,
  book: BookOpen,
  calendar: CalendarDays,
  chart: BarChart3,
  check: CheckSquare,
  clipboard: ClipboardCheck,
  graduation: GraduationCap,
  home: Home,
  library: Library,
  message: MessageCircle,
  route: Route,
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
    active:
      "border-orange-100 bg-orange-50/90 text-orange-700 shadow-sm shadow-orange-900/5 ring-1 ring-orange-100",
    avatar: "from-orange-200 to-rose-200 text-orange-900",
    dot: "bg-orange-300",
    shell: "from-[#fbfdff] via-[#f3fbff] to-[#fff7ed]",
  },
  coach: {
    active:
      "border-sky-100 bg-sky-50/95 text-sky-700 shadow-sm shadow-sky-900/5 ring-1 ring-sky-100",
    avatar: "from-sky-200 to-emerald-200 text-sky-900",
    dot: "bg-sky-300",
    shell: "from-[#fbfdff] via-[#effaff] to-[#f2fff8]",
  },
  coachee: {
    active:
      "border-indigo-100 bg-indigo-50/90 text-indigo-700 shadow-sm shadow-indigo-900/5 ring-1 ring-indigo-100",
    avatar: "from-indigo-200 to-sky-200 text-indigo-900",
    dot: "bg-indigo-300",
    shell: "from-[#fbfdff] via-[#f5f7ff] to-[#effaff]",
  },
};

const alertToneStyles: Record<AppShellAlertTone, string> = {
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  sky: "border-sky-100 bg-sky-50 text-sky-700",
};

function badgeLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

function navBadge(navBadges: AppShellSignals["navBadges"], href: string) {
  const count = navBadges[href] ?? 0;

  return count > 0 ? count : null;
}

function isActivePath(pathname: string, href: string, role: UserRole) {
  return pathname === href || (href !== `/${role}` && pathname.startsWith(href));
}

function QuickNavigationSearch({
  navBadges,
  navItems,
}: {
  navBadges: AppShellSignals["navBadges"];
  navItems: NavItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return navItems.slice(0, 6);
    }

    return navItems
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery))
      .slice(0, 6);
  }, [navItems, normalizedQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (suggestions[0]) {
      router.push(suggestions[0].href);
      setQuery("");
    }
  }

  return (
    <form
      className="group relative flex min-w-0 flex-1 items-center rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-sm shadow-sky-900/5 transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100"
      onSubmit={handleSubmit}
    >
      <Search className="h-4 w-4 shrink-0 text-sky-500" />
      <label className="sr-only" htmlFor="app-shell-search">
        Rechercher une page
      </label>
      <input
        autoComplete="off"
        className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        id="app-shell-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher une page..."
        value={query}
      />
      <div className="invisible absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-sky-100 bg-white opacity-0 shadow-xl shadow-sky-950/10 transition group-focus-within:visible group-focus-within:opacity-100">
        {suggestions.length ? (
          suggestions.map((item) => {
            const badge = navBadge(navBadges, item.href);
            const Icon = iconMap[item.icon] ?? Home;

            return (
              <Link
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                href={item.href}
                key={item.href}
                onClick={() => setQuery("")}
              >
                <Icon className="h-4 w-4 text-sky-500" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badge ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    {badgeLabel(badge)}
                  </span>
                ) : null}
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-3 text-sm text-slate-500">Aucun résultat.</p>
        )}
      </div>
    </form>
  );
}

export function AppShell({
  account,
  children,
  navItems,
  role,
  signals = emptySignals,
  subtitle,
}: AppShellProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const accountName = account?.fullName ?? roleLabel[role];
  const accountEmail = account?.email ?? "Session active";
  const accent = roleAccent[role];
  const navBadges = signals.navBadges;
  const notificationHref =
    role === "admin"
      ? "/admin/stats"
      : role === "coach"
        ? "/coach/notifications"
        : "/coachee/notifications";

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br text-slate-800",
        accent.shell,
      )}
    >
      <a
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#app-content"
      >
        Aller au contenu
      </a>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-sky-100/80 bg-white/88 text-slate-700 shadow-sm shadow-sky-900/5 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-sky-100 p-6">
              <Link
                href="/"
                className="flex items-center gap-3 text-lg font-semibold tracking-tight"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold",
                    accent.avatar,
                  )}
                >
                  CP
                </span>
                <span className="text-slate-800">Coaching Platform</span>
              </Link>
              <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const badge = navBadge(navBadges, item.href);
                const isActive = isActivePath(pathname, item.href, role);
                const Icon = iconMap[item.icon] ?? Home;

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition",
                      isActive
                        ? accent.active
                        : "text-slate-500 hover:border-sky-100 hover:bg-sky-50/80 hover:text-sky-700",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {badge ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-100">
                        {badgeLabel(badge)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sky-100 p-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
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
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {roleLabel[role]} · {accountEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-sky-100/80 bg-white/86 px-4 py-3 shadow-sm shadow-sky-900/[0.03] backdrop-blur-xl lg:px-6">
            <button
              aria-label="Menu"
              aria-expanded={isMobileNavOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-600 shadow-sm shadow-sky-900/5 lg:hidden"
              onClick={() => setIsMobileNavOpen((current) => !current)}
              type="button"
            >
              {isMobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <QuickNavigationSearch navBadges={navBadges} navItems={navItems} />
            <Link
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-600 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:text-sky-700"
              href={notificationHref}
            >
              <Bell className="h-5 w-5" />
              {signals.notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
                  {badgeLabel(signals.notificationCount)}
                </span>
              ) : null}
            </Link>
            <SignOutButton />
          </header>

          {signals.alerts.length ? (
            <div className="border-b border-sky-100/80 bg-white/72 px-4 py-2 backdrop-blur-xl lg:px-6">
              <div className="flex gap-2 overflow-x-auto">
                {signals.alerts.slice(0, 4).map((alert) => (
                  <Link
                    className={cn(
                      "inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition hover:brightness-95",
                      alertToneStyles[alert.tone],
                    )}
                    href={alert.href}
                    key={`${alert.href}:${alert.label}`}
                  >
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px]">
                      {badgeLabel(alert.count)}
                    </span>
                    <span>{alert.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {isMobileNavOpen ? (
            <div className="border-b border-sky-100 bg-white/95 p-4 shadow-sm shadow-sky-900/5 backdrop-blur-xl lg:hidden">
              <nav className="grid gap-1">
                {navItems.map((item) => {
                  const badge = navBadge(navBadges, item.href);
                  const isActive = isActivePath(pathname, item.href, role);
                  const Icon = iconMap[item.icon] ?? Home;

                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? accent.active
                          : "text-slate-500 hover:border-sky-100 hover:bg-sky-50/80 hover:text-sky-700",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-100">
                          {badgeLabel(badge)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {accountName}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {roleLabel[role]} · {accountEmail}
                </p>
                <SignOutButton
                  className="mt-3 w-full justify-center"
                  display="inline"
                />
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-[1480px]" id="app-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
