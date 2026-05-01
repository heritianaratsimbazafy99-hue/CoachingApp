"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
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
  Pin,
  PinOff,
  Route,
  Search,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShellRealtimeBridge } from "@/components/app/app-shell-realtime-bridge";
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
    userId?: string;
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

const sidebarPinStorageKey = "coaching-platform-sidebar-pinned";

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
      "border-slate-950 bg-slate-950 text-white shadow-sm shadow-slate-950/15",
    avatar: "from-indigo-100 to-sky-200 text-sky-950",
    dot: "bg-indigo-500",
    shell: "from-slate-50 via-white to-indigo-50",
  },
  coach: {
    active:
      "border-slate-950 bg-slate-950 text-white shadow-sm shadow-slate-950/15",
    avatar: "from-sky-200 to-indigo-100 text-sky-950",
    dot: "bg-sky-500",
    shell: "from-slate-50 via-white to-sky-50",
  },
  coachee: {
    active:
      "border-slate-950 bg-slate-950 text-white shadow-sm shadow-slate-950/15",
    avatar: "from-sky-100 to-indigo-200 text-sky-950",
    dot: "bg-emerald-500",
    shell: "from-slate-50 via-white to-emerald-50",
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
      className="group relative flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-950/[0.03] transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100"
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
      <div className="invisible absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white opacity-0 shadow-xl shadow-slate-950/10 transition group-focus-within:visible group-focus-within:opacity-100">
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
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(sidebarPinStorageKey) === "true";
  });
  const [isSidebarPreviewOpen, setIsSidebarPreviewOpen] = useState(false);
  const accountName = account?.fullName ?? roleLabel[role];
  const accountEmail = account?.email ?? "Session active";
  const accent = roleAccent[role];
  const navBadges = signals.navBadges;
  const isDesktopSidebarOpen = isSidebarPinned || isSidebarPreviewOpen;
  const notificationHref =
    role === "admin"
      ? "/admin/stats"
      : role === "coach"
        ? "/coach/notifications"
        : "/coachee/notifications";

  useEffect(() => {
    window.localStorage.setItem(
      sidebarPinStorageKey,
      String(isSidebarPinned),
    );
  }, [isSidebarPinned]);

  useEffect(() => {
    function syncPinnedState(event: StorageEvent) {
      if (event.key !== sidebarPinStorageKey) {
        return;
      }

      setIsSidebarPinned(event.newValue === "true");
      setIsSidebarPreviewOpen(false);
    }

    window.addEventListener("storage", syncPinnedState);

    return () => {
      window.removeEventListener("storage", syncPinnedState);
    };
  }, []);

  useEffect(() => {
    if (isSidebarPinned || !isSidebarPreviewOpen) {
      return;
    }

    function closeSidebarWhenPointerLeaves(event: MouseEvent) {
      if (event.clientX > 286) {
        setIsSidebarPreviewOpen(false);
      }
    }

    window.addEventListener("mousemove", closeSidebarWhenPointerLeaves);

    return () => {
      window.removeEventListener("mousemove", closeSidebarWhenPointerLeaves);
    };
  }, [isSidebarPinned, isSidebarPreviewOpen]);

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br text-slate-800",
        accent.shell,
      )}
    >
      <AppShellRealtimeBridge role={role} userId={account?.userId} />
      <a
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#app-content"
      >
        Aller au contenu
      </a>
      <div
        className="grid min-h-screen transition-[grid-template-columns] duration-300 ease-out"
        data-sidebar-grid
        data-sidebar-open={isDesktopSidebarOpen ? "true" : "false"}
        data-sidebar-pinned={isSidebarPinned ? "true" : "false"}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden overflow-hidden text-slate-100 transition-[width] duration-300 ease-out lg:block",
            isDesktopSidebarOpen ? "w-[272px]" : "w-4",
          )}
          data-open={isDesktopSidebarOpen ? "true" : "false"}
          data-sidebar-zone
          onFocus={() => setIsSidebarPreviewOpen(true)}
          onMouseEnter={() => setIsSidebarPreviewOpen(true)}
          onMouseLeave={() => {
            if (!isSidebarPinned) {
              setIsSidebarPreviewOpen(false);
            }
          }}
        >
          <aside
            aria-label="Navigation principale"
            className="flex h-full w-[272px] text-slate-100 transition-[opacity,translate] duration-300 ease-out"
            data-sidebar-panel
          >
            <div className="flex h-full w-full flex-col overflow-hidden border-r border-white/10 bg-slate-950 shadow-xl shadow-slate-950/15">
              <div className="border-b border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href="/"
                    className="flex min-w-0 items-center gap-3 text-lg font-semibold tracking-tight"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold shadow-sm shadow-sky-950/20",
                        accent.avatar,
                      )}
                    >
                      CP
                    </span>
                    <span className="min-w-0 truncate text-white">
                      Coaching Platform
                    </span>
                  </Link>
                  <button
                    aria-label={
                      isSidebarPinned
                        ? "Activer la navigation auto-masquée"
                        : "Épingler la navigation"
                    }
                    aria-pressed={isSidebarPinned}
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-slate-300 transition hover:bg-white/10 hover:text-white",
                      isSidebarPinned
                        ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                        : "border-white/10 bg-white/5",
                    )}
                    onClick={() => {
                      setIsSidebarPinned((current) => !current);
                      setIsSidebarPreviewOpen(false);
                    }}
                    title={
                      isSidebarPinned
                        ? "Désépingler la barre latérale"
                        : "Épingler la barre latérale"
                    }
                    type="button"
                  >
                    {isSidebarPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="min-w-0 truncate text-xs font-semibold uppercase text-sky-200">
                    {subtitle}
                  </p>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                    {isSidebarPinned ? "Fixe" : "Auto"}
                  </span>
                </div>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
                {navItems.map((item) => {
                  const badge = navBadge(navBadges, item.href);
                  const isActive = isActivePath(pathname, item.href, role);
                  const Icon = iconMap[item.icon] ?? Home;

                  return (
                    <Link
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "border-white/10 bg-white text-slate-950 shadow-lg shadow-slate-950/20"
                          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => {
                        if (!isSidebarPinned) {
                          setIsSidebarPreviewOpen(false);
                        }
                      }}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                          isActive
                            ? "bg-sky-50 text-sky-700"
                            : "bg-white/[0.06] text-slate-300 group-hover:bg-white/10 group-hover:text-sky-100",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {badge ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                            isActive
                              ? "bg-slate-950 text-white ring-slate-950/10"
                              : "bg-white/10 text-slate-100 ring-white/10",
                          )}
                        >
                          {badgeLabel(badge)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/10 p-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        accent.dot,
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {accountName}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {roleLabel[role]} · {accountEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="min-w-0 lg:col-start-2">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/86 px-4 py-3 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl lg:px-6">
            <button
              aria-label="Menu"
              aria-expanded={isMobileNavOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-950/[0.03] lg:hidden"
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
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-950/[0.03] transition hover:border-sky-200 hover:text-sky-700"
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
            <div className="border-b border-slate-200/80 bg-white/78 px-4 py-2 backdrop-blur-xl lg:px-6">
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto">
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
            <div className="border-b border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl lg:hidden">
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
                          : "text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
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
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                          {badgeLabel(badge)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
