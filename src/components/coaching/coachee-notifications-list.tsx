"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Route,
  Trophy,
} from "lucide-react";
import {
  markCoacheeNotificationMessagesReadAction,
  type MarkCoacheeNotificationsReadState,
} from "@/app/coachee/notifications/actions";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  CoacheeNotificationCategory,
  CoacheeNotificationFilter,
  CoacheeNotificationsData,
} from "@/services/coachee-service";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import {
  coacheeNotificationPreferenceOptions,
  getStoredNotificationPreferenceSnapshot,
  normalizeNotificationPreferenceSelection,
  notificationPreferenceStorageKeys,
  subscribeToNotificationPreferenceChanges,
} from "@/utils/notification-preferences";

const categoryIcons: Record<CoacheeNotificationCategory, typeof Bell> = {
  agenda: CalendarDays,
  messages: MessageCircle,
  paths: Route,
  results: Trophy,
};

const categoryLabels: Record<CoacheeNotificationCategory, string> = {
  agenda: "Agenda",
  messages: "Message",
  paths: "Parcours",
  results: "Résultat",
};

const categoryStyles: Record<CoacheeNotificationCategory, string> = {
  agenda: "border-emerald-100 bg-emerald-50 text-emerald-700",
  messages: "border-sky-100 bg-sky-50 text-sky-700",
  paths: "border-indigo-100 bg-indigo-50 text-indigo-700",
  results: "border-amber-100 bg-amber-50 text-amber-700",
};

const availableNotificationCategories = coacheeNotificationPreferenceOptions.map(
  (option) => option.category,
);

const initialReadState: MarkCoacheeNotificationsReadState = {
  message: "",
  status: "idle",
};

function MarkMessagesReadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled || pending}
      type="submit"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {pending ? "Mise à jour..." : "Marquer les messages lus"}
    </button>
  );
}

export function CoacheeNotificationsList({
  data,
}: {
  data: CoacheeNotificationsData;
}) {
  const [activeFilter, setActiveFilter] =
    useState<CoacheeNotificationFilter>("all");
  const [readState, readAction] = useActionState(
    markCoacheeNotificationMessagesReadAction,
    initialReadState,
  );
  const serverEnabledCategories = useMemo(
    () =>
      normalizeNotificationPreferenceSelection(
        data.enabledNotificationCategories,
        availableNotificationCategories,
      ),
    [data.enabledNotificationCategories],
  );
  const preferenceSnapshot = useSyncExternalStore(
    subscribeToNotificationPreferenceChanges,
    () =>
      getStoredNotificationPreferenceSnapshot(
        notificationPreferenceStorageKeys.coachee,
      ),
    () => "",
  );
  const enabledCategories = useMemo(() => {
    if (!preferenceSnapshot) {
      return serverEnabledCategories;
    }

    try {
      return normalizeNotificationPreferenceSelection(
        JSON.parse(preferenceSnapshot),
        availableNotificationCategories,
      );
    } catch {
      return serverEnabledCategories;
    }
  }, [preferenceSnapshot, serverEnabledCategories]);
  const effectiveFilter =
    activeFilter !== "all" && !enabledCategories.includes(activeFilter)
      ? "all"
      : activeFilter;
  const enabledNotifications = useMemo(
    () =>
      data.notifications.filter((notification) =>
        enabledCategories.includes(notification.category),
      ),
    [data.notifications, enabledCategories],
  );
  const visibleNotifications = useMemo(() => {
    if (effectiveFilter === "all") {
      return enabledNotifications;
    }

    return enabledNotifications.filter(
      (notification) => notification.category === effectiveFilter,
    );
  }, [effectiveFilter, enabledNotifications]);
  const visibleFilters = useMemo(
    () =>
      data.filters
        .filter(
          (filter) =>
            filter.id === "all" || enabledCategories.includes(filter.id),
        )
        .map((filter) => {
          if (filter.id === "all") {
            return { ...filter, count: enabledNotifications.length };
          }

          return {
            ...filter,
            count: enabledNotifications.filter(
              (notification) => notification.category === filter.id,
            ).length,
          };
        }),
    [data.filters, enabledCategories, enabledNotifications],
  );

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-900/5">
      <div className="border-b border-indigo-100 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Dernières notifications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Messages, rendez-vous, parcours et résultats.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <form action={readAction}>
              <MarkMessagesReadButton
                disabled={data.metrics.unreadMessagesCount === 0}
              />
            </form>
            {readState.message ? (
              <p
                className={cn(
                  "text-xs font-medium",
                  readState.status === "error"
                    ? "text-red-700"
                    : "text-emerald-700",
                )}
              >
                {readState.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleFilters.map((filter) => {
            const isActive = effectiveFilter === filter.id;

            return (
              <button
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
                  isActive
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-700",
                )}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-100">
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleNotifications.length ? (
        <div className="divide-y divide-slate-100">
          {visibleNotifications.map((notification) => {
            const Icon = categoryIcons[notification.category];

            return (
              <Link
                className="group grid gap-4 p-5 transition hover:bg-indigo-50/40 lg:grid-cols-[190px_1fr_120px]"
                href={notification.href}
                key={notification.id}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      categoryStyles[notification.category],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">
                      {categoryLabels[notification.category]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {notification.title}
                    </h3>
                    {notification.priority === "high" ? (
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Priorité
                      </span>
                    ) : null}
                    {notification.isUnread ? (
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        Non lu
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {notification.description}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 self-center text-sm font-semibold text-indigo-700 lg:justify-self-end">
                  Ouvrir
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            description="Aucune notification ne correspond au filtre sélectionné."
            icon={AlertTriangle}
            title="Rien à afficher"
          />
        </div>
      )}
    </section>
  );
}
