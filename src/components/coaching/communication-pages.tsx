import { CalendarDays, Check, MessageCircle, Plus, Send } from "lucide-react";
import {
  calendarEvents,
  getProfile,
  messages,
  profiles,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { eventTypeLabel, formatDateTime } from "@/utils/format";

export function MessagesPage({ variant = "coach" }: { variant?: "coach" | "coachee" }) {
  const selectedConversation = profiles.find((profile) =>
    variant === "coach" ? profile.role === "coachee" : profile.role === "coach",
  );

  return (
    <>
      <PageHeader
        description="Messagerie simple style WhatsApp Web avec statut lu / non lu."
        title="Messagerie"
      />
      <div className="grid min-h-[720px] gap-0 p-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-l-xl border border-r-0 border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <MessageCircle className="h-4 w-4 text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Conversations</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {profiles
              .filter((profile) =>
                variant === "coach"
                  ? profile.role === "coachee"
                  : profile.role === "coach",
              )
              .map((profile) => (
                <button
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
                  key={profile.id}
                  type="button"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {profile.fullName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {profile.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      Dernier message récent
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </button>
              ))}
          </div>
        </aside>

        <section className="flex flex-col rounded-r-xl border border-slate-200 bg-[#efeae2]">
          <div className="border-b border-slate-200 bg-white p-4">
            <p className="font-semibold">{selectedConversation?.fullName}</p>
            <p className="text-sm text-slate-500">En ligne récemment</p>
          </div>
          <div className="flex-1 space-y-3 p-5">
            {messages.map((message) => {
              const isOwn =
                variant === "coach"
                  ? message.senderId === "coach-1"
                  : message.senderId !== "coach-1";
              return (
                <div
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isOwn ? "bg-emerald-100" : "bg-white"
                    }`}
                  >
                    <p>{message.body}</p>
                    <div className="mt-1 flex justify-end gap-1 text-[11px] text-slate-500">
                      {formatDateTime(message.createdAt)}
                      {message.readAt ? <Check className="h-3 w-3" /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm"
                placeholder="Écrire un message..."
              />
              <ActionButton message="Message envoyé" variant="primary">
                <Send className="h-4 w-4" />
              </ActionButton>
            </div>
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
