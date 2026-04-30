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
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="grid min-h-[720px] gap-0 p-6 lg:grid-cols-[340px_1fr]">
        <aside className="overflow-hidden rounded-t-2xl border border-sky-100 bg-white shadow-sm shadow-sky-900/5 lg:rounded-l-2xl lg:rounded-tr-none lg:border-r-0">
          <div className="border-b border-sky-100 p-4">
            <div className="flex items-center rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
              <MessageCircle className="h-4 w-4 text-sky-600" />
              <span className="ml-2 text-sm font-medium text-slate-600">
                Conversations
              </span>
            </div>
          </div>
          <div className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto">
            {data.participants.length ? (
              data.participants.map((participant) => {
                const isSelected =
                  participant.userId === data.selectedParticipant?.userId;

                return (
                  <Link
                    className={`flex items-center gap-3 p-4 transition ${
                      isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                    href={participant.href}
                    key={participant.userId}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                      {participant.fullName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {participant.fullName}
                        </p>
                        {participant.lastMessageAt ? (
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatDateTime(participant.lastMessageAt)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {participant.lastMessagePreview}
                      </p>
                    </div>
                    {participant.unreadCount ? (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-600 px-2 text-xs font-semibold text-white">
                        {participant.unreadCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })
            ) : (
              <div className="p-4">
                <EmptyState
                  description="Ajoutez d'abord un coaché à une cohorte pour ouvrir une conversation."
                  icon={MessageCircle}
                  title="Aucune conversation"
                />
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[720px] flex-col overflow-hidden rounded-b-2xl border border-sky-100 bg-sky-50/60 shadow-sm shadow-sky-900/5 lg:rounded-r-2xl lg:rounded-bl-none">
          <div className="border-b border-sky-100 bg-white p-4">
            {data.selectedParticipant ? (
              <>
                <p className="font-semibold text-slate-950">
                  {data.selectedParticipant.fullName}
                </p>
                <p className="text-sm text-slate-500">
                  Conversation{" "}
                  {data.variant === "coach" ? "coach vers coaché" : "avec le coach"}
                </p>
              </>
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

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {data.messages.length ? (
              data.messages.map((message) => (
                <div
                  className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <div
                    className={`max-w-[min(680px,85%)] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.isOwn
                        ? "rounded-br-sm bg-sky-100 text-slate-900"
                        : "rounded-bl-sm bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <div className="mt-1 flex justify-end gap-1 text-[11px] text-slate-500">
                      {formatDateTime(message.createdAt)}
                      {message.isOwn && message.readAt ? (
                        <Check className="h-3 w-3 text-sky-700" />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm rounded-2xl bg-white/80 p-5 text-center text-sm leading-6 text-slate-500 shadow-sm">
                  Aucun message dans cette conversation. Envoyez un premier
                  message clair et court.
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-sky-100 bg-white p-4">
            <MessageComposerForm
              receiverId={data.selectedParticipant?.userId ?? null}
            />
          </div>
        </section>
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        eventTypeStyles[type],
      )}
    >
      {eventTypeLabel[type]}
    </span>
  );
}

function CalendarStatusBadge({ status }: { status: CalendarEventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        eventStatusStyles[status],
      )}
    >
      {calendarStatusLabel[status]}
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
    <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
        {value}
      </p>
    </div>
  );
}

function CalendarFilters({ data }: { data: CalendarPageData }) {
  return (
    <form className="grid gap-3 rounded-xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 md:grid-cols-[1fr_1fr_1.4fr_auto]">
      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">Type</span>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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

      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">
          Statut
        </span>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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

      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">
          Cible
        </span>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          defaultValue={data.filters.target}
          name="target"
        >
          <option value="all">Toutes les cibles</option>
          <option value="coach">Coach seul</option>
          {data.targetOptions.map((target) => (
            <option key={target.value} value={target.value}>
              {target.type === "coachee" ? "Coaché" : "Cohorte"} · {target.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
          type="submit"
        >
          <Filter className="h-4 w-4" />
          Filtrer
        </button>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          href="/coach/calendar"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
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
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              event.status === status
                ? "cursor-default border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
    <article className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={event.type} />
            <CalendarStatusBadge status={event.status} />
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            {event.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {formatTime(event.startTime)} - {formatTime(event.endTime)} ·{" "}
            {event.targetLabel}
          </p>
          {event.description ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>
        {canUpdateStatus ? <CalendarStatusActions event={event} /> : null}
      </div>
    </article>
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
            <a
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
              href="#new-event"
            >
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

      <div className="space-y-6 p-6">
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

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="space-y-5">
            <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                {weekDays.map((day) => (
                  <div
                    className="min-h-28 rounded-lg border border-sky-100 bg-sky-50/70 p-3"
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
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {day.count ? `${day.count} événement(s)` : "Libre"}
                    </p>
                    {day.nextEvent ? (
                      <p className="mt-2 truncate rounded-md bg-white px-2 py-1 text-xs font-medium text-sky-700 shadow-sm shadow-sky-900/5">
                        {day.nextEvent.title}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {agendaGroups.length ? (
                agendaGroups.map((events) => (
                  <section className="space-y-3" key={getDayKey(events[0].startTime)}>
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <h2 className="text-sm font-semibold capitalize text-slate-600">
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
                <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
                  <EmptyState
                    description={
                      isCoach
                        ? "Créez un rendez-vous individuel, un atelier de cohorte, une réunion info ou un rappel."
                        : "Aucun rendez-vous visible pour le moment."
                    }
                    icon={CalendarDays}
                    title="Aucun événement"
                  />
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            {isCoach ? (
              <section
                className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5"
                id="new-event"
              >
                <div className="mb-5 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-600" />
                  <h2 className="font-semibold text-slate-950">
                    Nouvel événement
                  </h2>
                </div>
                <CalendarEventForm targetOptions={data.targetOptions} />
              </section>
            ) : null}

            <section className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold text-slate-950">
                  Prochain événement
                </h2>
              </div>
              {nextEvent ? (
                <div className="mt-5 rounded-lg border border-slate-200 p-4">
                  <TypeBadge type={nextEvent.type} />
                  <p className="mt-3 font-semibold text-slate-950">
                    {nextEvent.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(nextEvent.startTime)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {nextEvent.targetLabel}
                  </p>
                </div>
              ) : (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  Aucun événement planifié à venir.
                </p>
              )}
            </section>
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

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_430px]">
        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sky-100 text-xl font-semibold text-sky-700">
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-700">
                {roleLabel[data.profile.role]}
              </p>
              <h2 className="truncate text-xl font-semibold text-slate-950">
                {data.profile.fullName}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                {data.profile.email}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ProfileForm profile={data.profile} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-950">Compte</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-xl bg-sky-50/70 p-4">
                <p className="font-medium text-slate-500">Rôle</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {roleLabel[data.profile.role]}
                </p>
              </div>
              <div className="rounded-xl bg-sky-50/70 p-4">
                <p className="font-medium text-slate-500">Créé le</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {formatDate(data.profile.createdAt)}
                </p>
              </div>
            </div>
          </section>

          <NotificationPreferenceForm
            initialEnabledCategories={data.profile.notificationPreferences.coach}
            role="coach"
          />

          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <h2 className="font-semibold text-slate-950">Nouveau template</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Préparez les messages qui reviennent souvent dans le suivi.
            </p>
            <div className="mt-5">
              <ReminderTemplateForm />
            </div>
          </section>
        </aside>

        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Templates de relance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.reminderTemplates.length} template(s) disponibles.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <ReminderTemplateList templates={data.reminderTemplates} />
          </div>
        </section>
      </div>
    </>
  );
}
