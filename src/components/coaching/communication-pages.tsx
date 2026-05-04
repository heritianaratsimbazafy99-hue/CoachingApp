import Link from "next/link";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  CircleSlash,
  Filter,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import { updateCalendarEventStatusAction } from "@/app/coach/calendar/actions";
import { CalendarEventForm } from "@/components/coaching/calendar-event-form";
import { MessageComposerForm } from "@/components/coaching/message-composer-form";
import { MessageRealtimeBridge } from "@/components/coaching/message-realtime-bridge";
import {
  NotificationPreferenceForm,
  ProfileForm,
  ReminderTemplateForm,
  ReminderTemplateList,
} from "@/components/coaching/profile-settings-forms";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClassName, labelClassName } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import type {
  CalendarAgendaEvent,
  CalendarPageData,
} from "@/services/calendar-service";
import type { CoachSettingsData } from "@/services/profile-service";
import type {
  CalendarEventStatus,
  CalendarEventType,
} from "@/types/coaching";
import type { MessagingData } from "@/services/messaging-service";
import {
  calendarStatusLabel,
  eventTypeLabel,
  formatDate,
  formatDateTime,
  formatTime,
} from "@/utils/format";
import { cn } from "@/utils/cn";

export function MessagesPage({ data }: { data: MessagingData }) {
  const unreadConversationCount = data.participants.filter(
    (participant) => participant.unreadCount > 0,
  ).length;
  const noConversationTitle =
    data.variant === "coach"
      ? "Aucun coaché disponible"
      : "Aucun coach disponible";
  const noConversationDescription =
    data.variant === "coach"
      ? "Ajoutez un coaché à une de vos cohortes pour ouvrir une conversation sécurisée."
      : "Votre coach apparaîtra ici dès qu'une cohorte vous sera attribuée.";

  return (
    <>
      <MessageRealtimeBridge
        currentUserId={data.currentUserId}
        selectedParticipantId={data.selectedParticipant?.userId ?? null}
      />
      <PageHeader
        description="Conversation sécurisée entre coach et coaché, avec lecture et rafraîchissement temps réel."
        title="Messagerie"
      />
      <div className="min-w-0 p-4 sm:p-6">
        <Card className="grid overflow-hidden border-slate-200/80 bg-white/95 lg:min-h-[680px] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-slate-200 bg-gradient-to-b from-slate-50/95 via-white to-white lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 bg-white/95 p-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-sm shadow-slate-950/[0.03] ring-1 ring-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Conversations
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Autorisées par les cohortes
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {data.participants.length}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white bg-white/85 px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase text-slate-400">
                      Total
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {data.participants.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 ring-1 ring-white">
                    <p className="text-[11px] font-semibold uppercase text-sky-500">
                      Non lus
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-sky-800">
                      {unreadConversationCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ui-scrollbar max-h-[340px] space-y-2 overflow-y-auto p-3 sm:max-h-[380px] lg:max-h-[640px]">
              {data.participants.length ? (
                data.participants.map((participant) => {
                  const isSelected =
                    participant.userId === data.selectedParticipant?.userId;

                  return (
                    <Link
                      className={cn(
                        "group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-3 transition",
                        isSelected
                          ? "border-sky-200 bg-white pl-4 shadow-sm shadow-sky-950/[0.04] ring-1 ring-sky-100 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-sky-500 before:content-['']"
                          : "border-transparent bg-white/55 hover:border-sky-100 hover:bg-white hover:shadow-sm hover:shadow-slate-950/[0.03]",
                      )}
                      href={participant.href}
                      key={participant.userId}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ring-1",
                          isSelected
                            ? "bg-sky-600 text-white ring-sky-600"
                            : "bg-slate-50 text-slate-700 ring-slate-200 group-hover:bg-sky-50 group-hover:text-sky-700",
                        )}
                      >
                        {participant.fullName.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {participant.fullName}
                          </p>
                          {participant.lastMessageAt ? (
                            <span className="max-w-24 shrink-0 truncate text-[11px] font-medium text-slate-400">
                              {formatDateTime(participant.lastMessageAt)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                          {participant.lastMessagePreview}
                        </p>
                      </div>
                      {participant.unreadCount ? (
                        <span className="flex h-6 min-w-6 max-w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-500 px-2 text-xs font-semibold text-white">
                          {participant.unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })
              ) : (
                <div className="p-4">
                  <EmptyState
                    description={noConversationDescription}
                    icon={MessageCircle}
                    title={noConversationTitle}
                  />
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[520px] min-w-0 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_44%,#f8fafc_100%)] lg:min-h-[620px]">
            <div className="border-b border-slate-200 bg-white/95 p-4">
              {data.selectedParticipant ? (
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                      {data.selectedParticipant.fullName.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {data.selectedParticipant.fullName}
                      </p>
                      <p className="text-sm text-slate-500">
                        Conversation{" "}
                        {data.variant === "coach"
                          ? "coach vers coaché"
                          : "avec le coach"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit max-w-full shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    <span className="min-w-0 truncate">
                      {data.messages.length} message(s)
                    </span>
                  </span>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-slate-950">
                    Sélectionnez une conversation
                  </p>
                  <p className="text-sm text-slate-500">
                    Les messages apparaîtront ici.
                  </p>
                </>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {!data.selectedParticipant ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    description={noConversationDescription}
                    icon={CircleSlash}
                    title="Conversation indisponible"
                  />
                </div>
              ) : data.messages.length ? (
                data.messages.map((message) => (
                  <div
                    className={cn(
                      "flex",
                      message.isOwn ? "justify-end" : "justify-start",
                    )}
                    key={message.id}
                  >
                    <div
                      className={cn(
                        "max-w-[min(680px,92%)] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[min(680px,88%)]",
                        message.isOwn
                          ? "rounded-br-md bg-sky-600 text-white shadow-sky-950/10"
                          : "rounded-bl-md border border-slate-200 bg-white/95 text-slate-800 shadow-slate-950/[0.04]",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                      <div
                        className={cn(
                          "mt-2 flex justify-end gap-1 text-[11px]",
                          message.isOwn ? "text-sky-100" : "text-slate-500",
                        )}
                      >
                        {formatDateTime(message.createdAt)}
                        {message.isOwn && message.readAt ? (
                          <Check className="h-3 w-3 text-sky-100" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-sm rounded-2xl border border-dashed border-slate-200 bg-white/95 p-5 text-center text-sm leading-6 text-slate-500 shadow-sm shadow-slate-950/[0.04]">
                    <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    Aucun message dans cette conversation. Envoyez un premier
                    message clair et court.
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-14px_30px_rgba(15,23,42,0.04)] backdrop-blur">
              {data.selectedParticipant ? (
                <MessageComposerForm
                  receiverId={data.selectedParticipant.userId}
                />
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Aucune conversation n&apos;est possible pour ce compte pour le
                  moment.
                </p>
              )}
            </div>
          </section>
        </Card>
      </div>
    </>
  );
}

const calendarEventTypes: CalendarEventType[] = [
  "individual_coaching",
  "collective_workshop",
  "info_meeting",
  "reminder",
];

const calendarEventStatuses: CalendarEventStatus[] = [
  "scheduled",
  "done",
  "cancelled",
];

const eventTypeStyles: Record<CalendarEventType, string> = {
  collective_workshop: "border-indigo-200 bg-indigo-50 text-indigo-700",
  individual_coaching: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info_meeting: "border-sky-200 bg-sky-50 text-sky-700",
  reminder: "border-amber-200 bg-amber-50 text-amber-700",
};

const eventStatusStyles: Record<CalendarEventStatus, string> = {
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  done: "border-slate-200 bg-slate-50 text-slate-600",
  scheduled: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getDayKey(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatAgendaDay(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date(value));
}

function getAgendaGroups(events: CalendarAgendaEvent[]) {
  const groups = events.reduce((map, event) => {
    const key = getDayKey(event.startTime);
    const dayEvents = map.get(key) ?? [];
    dayEvents.push(event);
    map.set(key, dayEvents);

    return map;
  }, new Map<string, CalendarAgendaEvent[]>());

  return [...groups.values()]
    .map((dayEvents) =>
      dayEvents.toSorted(
        (first, second) =>
          new Date(first.startTime).getTime() -
          new Date(second.startTime).getTime(),
      ),
    )
    .toSorted(
      (first, second) =>
        new Date(first[0]?.startTime ?? 0).getTime() -
        new Date(second[0]?.startTime ?? 0).getTime(),
    );
}

function getWeekDays(events: CalendarAgendaEvent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const key = getDayKey(date.toISOString());
    const dayEvents = events.filter((event) => getDayKey(event.startTime) === key);

    return {
      count: dayEvents.length,
      date,
      key,
      nextEvent: dayEvents[0],
    };
  });
}

function TypeBadge({ type }: { type: CalendarEventType }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 items-center justify-center self-start justify-self-start overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium",
        eventTypeStyles[type],
      )}
    >
      <span className="min-w-0 truncate">{eventTypeLabel[type]}</span>
    </span>
  );
}

function CalendarStatusBadge({ status }: { status: CalendarEventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 items-center justify-center self-start justify-self-start overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium",
        eventStatusStyles[status],
      )}
    >
      <span className="min-w-0 truncate">{calendarStatusLabel[status]}</span>
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-300/70 via-indigo-300/60 to-emerald-300/60" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className="rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700 ring-1 ring-white transition group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
        {value}
      </p>
    </Card>
  );
}

function CalendarFilters({ data }: { data: CalendarPageData }) {
  return (
    <Card className="p-4 sm:p-5">
      <form className="grid min-w-0 gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
        <label className="block min-w-0">
          <span className={labelClassName}>Type</span>
          <select
            className={inputClassName("py-2.5")}
            defaultValue={data.filters.type}
            name="type"
          >
            <option value="all">Tous les types</option>
            {calendarEventTypes.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabel[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className={labelClassName}>Statut</span>
          <select
            className={inputClassName("py-2.5")}
            defaultValue={data.filters.status}
            name="status"
          >
            <option value="all">Tous les statuts</option>
            {calendarEventStatuses.map((status) => (
              <option key={status} value={status}>
                {calendarStatusLabel[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className={labelClassName}>Cible</span>
          <select
            className={inputClassName("py-2.5")}
            defaultValue={data.filters.target}
            name="target"
          >
            <option value="all">Toutes les cibles</option>
            <option value="coach">Coach seul</option>
            {data.targetOptions.map((target) => (
              <option key={target.value} value={target.value}>
                {target.type === "coachee" ? "Coaché" : "Cohorte"} ·{" "}
                {target.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <button className={buttonVariants()} type="submit">
            <Filter className="h-4 w-4" />
            Filtrer
          </button>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/coach/calendar"
          >
            Réinitialiser
          </Link>
        </div>
      </form>
    </Card>
  );
}

function CalendarStatusActions({ event }: { event: CalendarAgendaEvent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {calendarEventStatuses.map((status) => (
        <form action={updateCalendarEventStatusAction} key={status}>
          <input name="eventId" type="hidden" value={event.id} />
          <input name="status" type="hidden" value={status} />
          <button
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              event.status === status
                ? "cursor-default bg-slate-100 text-slate-400 hover:bg-slate-100"
                : "",
            )}
            disabled={event.status === status}
            type="submit"
          >
            {calendarStatusLabel[status]}
          </button>
        </form>
      ))}
    </div>
  );
}

function EventCard({
  event,
  canUpdateStatus,
}: {
  canUpdateStatus: boolean;
  event: CalendarAgendaEvent;
}) {
  return (
    <Card className="min-w-0 p-4 transition hover:border-sky-200 hover:bg-sky-50/30 hover:shadow-md hover:shadow-slate-950/[0.05]">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={event.type} />
            <CalendarStatusBadge status={event.status} />
          </div>
          <h3 className="mt-3 break-words text-base font-semibold text-slate-950">
            {event.title}
          </h3>
          <p className="mt-1 break-words text-sm font-medium text-slate-500">
            {formatTime(event.startTime)} - {formatTime(event.endTime)} ·{" "}
            {event.targetLabel}
          </p>
          {event.description ? (
            <p className="mt-3 break-words text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>
        {canUpdateStatus ? <CalendarStatusActions event={event} /> : null}
      </div>
    </Card>
  );
}

export function CalendarPage({ data }: { data: CalendarPageData }) {
  const isCoach = data.variant === "coach";
  const agendaGroups = getAgendaGroups(data.events);
  const weekDays = getWeekDays(data.events);
  const nextEvent = data.events.find(
    (event) =>
      event.status === "scheduled" && new Date(event.startTime) >= new Date(),
  );

  return (
    <>
      <PageHeader
        actions={
          isCoach ? (
            <a className={buttonVariants()} href="#new-event">
              <Plus className="h-4 w-4" />
              Nouvel événement
            </a>
          ) : null
        }
        description={
          isCoach
            ? "Agenda réel connecté à Supabase, avec création, filtres et suivi de statut."
            : "Vos rendez-vous et ateliers planifiés par votre coach."
        }
        title="Agenda"
      />

      <div className="min-w-0 space-y-6 overflow-hidden p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CalendarClock}
            label="À venir"
            value={data.metrics.upcomingCount}
          />
          <MetricCard
            icon={CalendarDays}
            label="Cette semaine"
            value={data.metrics.thisWeekCount}
          />
          <MetricCard
            icon={CalendarCheck2}
            label="Terminés"
            value={data.metrics.doneCount}
          />
          <MetricCard
            icon={CircleSlash}
            label="Annulés"
            value={data.metrics.cancelledCount}
          />
        </section>

        {isCoach ? <CalendarFilters data={data} /> : null}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_380px]">
          <section className="min-w-0 space-y-5">
            <Card className="min-w-0 p-3 sm:p-4">
              <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                {weekDays.map((day) => (
                  <div
                    className={cn(
                      "min-h-28 min-w-0 rounded-xl border p-3 ring-1 ring-white transition",
                      day.count
                        ? "border-sky-200 bg-sky-50/70"
                        : "border-slate-200/80 bg-white/95",
                    )}
                    key={day.key}
                  >
                    <p className="text-xs font-medium uppercase text-slate-400">
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                      }).format(day.date)}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                      }).format(day.date)}
                    </p>
                    <p className="mt-3 break-words text-xs font-medium text-slate-500">
                      {day.count ? `${day.count} événement(s)` : "Libre"}
                    </p>
                    {day.nextEvent ? (
                      <p className="mt-2 truncate rounded-md bg-white px-2 py-1 text-xs font-semibold text-sky-700 shadow-sm shadow-slate-950/[0.04]">
                        {day.nextEvent.title}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              {agendaGroups.length ? (
                agendaGroups.map((events) => (
                  <section
                    className="space-y-3"
                    key={getDayKey(events[0].startTime)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <h2 className="min-w-0 break-words text-center text-sm font-semibold capitalize text-slate-600">
                        {formatAgendaDay(events[0].startTime)}
                      </h2>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="space-y-3">
                      {events.map((event) => (
                        <EventCard
                          canUpdateStatus={isCoach}
                          event={event}
                          key={event.id}
                        />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <Card className="p-6">
                  <EmptyState
                    description={
                      isCoach
                        ? "Créez un rendez-vous individuel, un atelier de cohorte, une réunion info ou un rappel."
                        : "Aucun rendez-vous visible pour le moment."
                    }
                    icon={CalendarDays}
                    title="Aucun événement"
                  />
                </Card>
              )}
            </div>
          </section>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">
            {isCoach ? (
              <Card className="overflow-hidden" id="new-event">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-sky-600" />
                    <CardTitle>Nouvel événement</CardTitle>
                  </div>
                  <CardDescription>
                    Planifiez un rendez-vous, un atelier ou un rappel.
                  </CardDescription>
                </CardHeader>
                <div className="p-5">
                  <CalendarEventForm targetOptions={data.targetOptions} />
                </div>
              </Card>
            ) : null}

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-slate-500" />
                  <CardTitle>Prochain événement</CardTitle>
                </div>
              </CardHeader>
              <div className="p-5">
                {nextEvent ? (
                  <div className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 ring-1 ring-white">
                    <TypeBadge type={nextEvent.type} />
                    <p className="mt-3 break-words font-semibold text-slate-950">
                      {nextEvent.title}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {formatDateTime(nextEvent.startTime)}
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-600">
                      {nextEvent.targetLabel}
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm leading-6 text-slate-500 ring-1 ring-white">
                    Aucun événement planifié à venir.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

const roleLabel = {
  admin: "Administrateur",
  coach: "Coach",
  coachee: "Coaché",
};

export function SettingsPage({ data }: { data: CoachSettingsData }) {
  return (
    <>
      <PageHeader
        description="Profil coach, avatar et messages de relance réutilisables branchés sur Supabase."
        title="Paramètres"
      />

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[1fr_430px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-sky-100 text-xl font-semibold text-sky-700 shadow-sm shadow-sky-950/[0.06] ring-1 ring-sky-100">
              {data.profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={data.profile.avatarUrl}
                />
              ) : (
                data.profile.fullName.slice(0, 1)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="w-fit rounded-full border border-sky-100 bg-white/80 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-white">
                {roleLabel[data.profile.role]}
              </p>
              <h2 className="mt-2 truncate text-xl font-semibold text-slate-950">
                {data.profile.fullName}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                {data.profile.email}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <ProfileForm profile={data.profile} />
          </div>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-slate-500" />
                <CardTitle>Compte</CardTitle>
              </div>
            </CardHeader>
            <div className="grid gap-3 p-5 text-sm">
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 ring-1 ring-white">
                <p className="font-medium text-slate-500">Rôle</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {roleLabel[data.profile.role]}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 ring-1 ring-white">
                <p className="font-medium text-slate-500">Créé le</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {formatDate(data.profile.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          <NotificationPreferenceForm
            initialEnabledCategories={data.profile.notificationPreferences.coach}
            role="coach"
          />

          <Card>
            <CardHeader>
              <CardTitle>Nouveau template</CardTitle>
              <CardDescription>
                Préparez les messages qui reviennent souvent dans le suivi.
              </CardDescription>
            </CardHeader>
            <div className="p-5">
              <ReminderTemplateForm />
            </div>
          </Card>
        </aside>

        <div className="xl:col-span-2">
          <ReminderTemplateList templates={data.reminderTemplates} />
        </div>
      </div>
    </>
  );
}
