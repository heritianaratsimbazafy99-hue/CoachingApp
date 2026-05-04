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
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  agenda: "border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100",
  messages: "border-sky-100 bg-sky-50 text-sky-700 ring-sky-100",
  paths: "border-indigo-100 bg-indigo-50 text-indigo-700 ring-indigo-100",
  results: "border-amber-100 bg-amber-50 text-amber-700 ring-amber-100",
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
      className={cn(buttonVariants({ size: "sm", variant: "soft" }), "w-full sm:w-auto")}
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
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 ring-1 ring-white">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>Dernières notifications</CardTitle>
              <CardDescription>
                Messages, rendez-vous, parcours et résultats.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <form action={readAction} className="w-full sm:w-auto">
              <MarkMessagesReadButton
                disabled={data.metrics.unreadMessagesCount === 0}
              />
            </form>
            {readState.message ? (
              <p
                className={cn(
                  "text-xs font-medium",
                  readState.status === "error"
                    ? "text-rose-700"
                    : "text-emerald-700",
                )}
              >
                {readState.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {visibleFilters.map((filter) => {
            const isActive = effectiveFilter === filter.id;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  buttonVariants({ size: "sm", variant: "secondary" }),
                  "max-w-[12rem] shrink-0",
                  isActive
                    ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
                    : "text-slate-500 hover:border-sky-200 hover:text-sky-700",
                )}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                <span className="min-w-0 truncate">{filter.label}</span>
                <span className="inline-flex max-w-[3rem] shrink-0 overflow-hidden rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-100">
                  <span className="min-w-0 truncate">{filter.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      {visibleNotifications.length ? (
        <div className="divide-y divide-slate-100">
          {visibleNotifications.map((notification) => {
            const Icon = categoryIcons[notification.category];

            return (
              <Link
                className="group grid gap-4 p-4 transition hover:bg-sky-50/40 sm:p-5 lg:grid-cols-[160px_minmax(0,1fr)_auto]"
                href={notification.href}
                key={notification.id}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      "ring-1",
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
                    <h3 className="min-w-0 break-words font-semibold text-slate-950">
                      {notification.title}
                    </h3>
                    {notification.priority === "high" ? (
                      <span className="inline-flex w-fit max-w-[8rem] shrink-0 overflow-hidden rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold leading-none text-rose-700">
                        <span className="min-w-0 truncate">Priorité</span>
                      </span>
                    ) : null}
                    {notification.isUnread ? (
                      <span className="inline-flex w-fit max-w-[8rem] shrink-0 overflow-hidden rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold leading-none text-sky-700">
                        <span className="min-w-0 truncate">Non lu</span>
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-slate-500">
                    {notification.description}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 self-center rounded-xl border border-transparent px-2.5 py-1.5 text-sm font-semibold text-sky-700 transition group-hover:border-sky-100 group-hover:bg-white lg:justify-self-end">
                  Ouvrir
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50/40 p-6">
          <EmptyState
            description="Aucune notification ne correspond au filtre sélectionné."
            icon={AlertTriangle}
            title="Rien à afficher"
          />
        </div>
      )}
    </Card>
  );
}
