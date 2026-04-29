import Link from "next/link";
import { CalendarDays, Check, MessageCircle, Plus } from "lucide-react";
import { calendarEvents, getProfile } from "@/lib/demo-data";
import { MessageComposerForm } from "@/components/coaching/message-composer-form";
import { MessageRealtimeBridge } from "@/components/coaching/message-realtime-bridge";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { MessagingData } from "@/services/messaging-service";
import { eventTypeLabel, formatDateTime } from "@/utils/format";

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
        <aside className="overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 lg:rounded-l-2xl lg:rounded-tr-none lg:border-r-0">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
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
                      isSelected ? "bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                    href={participant.href}
                    key={participant.userId}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
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
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-semibold text-white">
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

        <section className="flex min-h-[720px] flex-col overflow-hidden rounded-b-2xl border border-slate-200 bg-[#f3efe7] shadow-sm shadow-slate-950/5 lg:rounded-r-2xl lg:rounded-bl-none">
          <div className="border-b border-slate-200 bg-white p-4">
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
                        ? "rounded-br-sm bg-emerald-100 text-slate-900"
                        : "rounded-bl-sm bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <div className="mt-1 flex justify-end gap-1 text-[11px] text-slate-500">
                      {formatDateTime(message.createdAt)}
                      {message.isOwn && message.readAt ? (
                        <Check className="h-3 w-3 text-emerald-700" />
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

          <div className="border-t border-slate-200 bg-white p-4">
            <MessageComposerForm
              receiverId={data.selectedParticipant?.userId ?? null}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export function CalendarPage({ variant = "coach" }: { variant?: "coach" | "coachee" }) {
  return (
    <>
      <PageHeader
        actions={
          variant === "coach" ? (
            <ActionButton message="Rendez-vous créé" variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rendez-vous
            </ActionButton>
          ) : null
        }
        description="Agenda clair avec vue liste et calendrier simplifié."
        title="Agenda"
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, index) => (
              <div
                className="min-h-24 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-500"
                key={index}
              >
                {index + 1}
                {[2, 5].includes(index) ? (
                  <div className="mt-2 rounded bg-slate-950 px-2 py-1 text-left text-[11px] text-white">
                    Coaching
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold">Prochains événements</h2>
          </div>
          <div className="mt-5 space-y-3">
            {calendarEvents.map((event) => (
              <div className="rounded-lg border border-slate-200 p-4" key={event.id}>
                <p className="font-medium">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDateTime(event.startTime)}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {eventTypeLabel[event.type]}
                  {event.coacheeId ? ` · ${getProfile(event.coacheeId)?.fullName}` : ""}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Préférences coach, templates de relance et réglages de notification."
        title="Paramètres"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Profil coach</h2>
          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue="Miora Coach"
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue="coach@coaching.test"
            />
            <ActionButton message="Paramètres enregistrés" variant="primary">
              Enregistrer
            </ActionButton>
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Notifications</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {["Messages non lus", "Quiz à corriger", "Deadlines dépassées"].map(
              (item) => (
                <label className="flex items-center gap-3" key={item}>
                  <input defaultChecked type="checkbox" />
                  {item}
                </label>
              ),
            )}
          </div>
        </section>
      </div>
    </>
  );
}
