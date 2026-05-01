import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  NotebookPen,
  PauseCircle,
  Send,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  deleteCoacheeGoalAction,
  updateCoacheeGoalStatusAction,
} from "@/app/coach/coachees/actions";
import {
  CoacheeGoalForm,
  CoachNoteForm,
} from "@/components/coaching/coachee-goal-forms";
import { CoacheeQuickActions } from "@/components/coaching/coachee-quick-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CoachCoacheesData,
  CoachCoacheeDetail,
} from "@/services/coach-service";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function CoacheesPage({ data }: { data: CoachCoacheesData }) {
  return (
    <>
      <PageHeader
        description="Liste des coachés avec progression, scores, retards et actions rapides."
        title="Mes coachés"
      />
      <div className="p-4 sm:p-6">
        {data.coachees.length ? (
          <div className="grid gap-4">
            {data.coachees.map((coachee) => (
              <article
                className="group grid gap-5 rounded-xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-950/[0.04] ring-1 ring-white transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-slate-950/[0.06] lg:grid-cols-[minmax(0,1.25fr)_220px_140px_250px] [contain-intrinsic-size:180px] [content-visibility:auto]"
                key={coachee.id}
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sm font-semibold text-sky-700 ring-1 ring-sky-100 transition group-hover:scale-105">
                    {getInitials(coachee.fullName)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      className="break-words text-lg font-semibold text-slate-950 hover:text-sky-700"
                      href={`/coach/coachees/${coachee.id}`}
                    >
                      {coachee.fullName}
                    </Link>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {coachee.email}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Dernière connexion : {formatDateTime(coachee.lastActiveAt)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Progression</span>
                    <span>{coachee.progress}%</span>
                  </div>
                  <ProgressBar value={coachee.progress} />
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 ring-1 ring-white">
                  <p className="text-sm text-slate-500">Score moyen</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatPercent(coachee.scoreAverage)}
                  </p>
                </div>
                <CoacheeQuickActions
                  coacheeId={coachee.id}
                  reminderTemplates={data.reminderTemplates}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Ajoutez des coachés dans une cohorte ou assignez-leur un contenu pour les voir ici."
            icon={UserRound}
            title="Aucun coaché"
          />
        )}
      </div>
    </>
  );
}

const goalStatusLabel: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  paused: "En pause",
};

const goalStatusStyles: Record<string, string> = {
  active: "border-sky-200 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
};

function GoalStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        goalStatusStyles[status] ?? "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {goalStatusLabel[status] ?? status}
    </span>
  );
}

function GoalStatusActions({
  coacheeId,
  goalId,
  status,
}: {
  coacheeId: string;
  goalId: string;
  status: string;
}) {
  const actions = [
    { icon: Target, label: "Actif", status: "active" },
    { icon: PauseCircle, label: "Pause", status: "paused" },
    { icon: CheckCircle2, label: "Terminé", status: "completed" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ icon: Icon, label, status: nextStatus }) => (
        <form action={updateCoacheeGoalStatusAction} key={nextStatus}>
          <input name="coacheeId" type="hidden" value={coacheeId} />
          <input name="goalId" type="hidden" value={goalId} />
          <input name="status" type="hidden" value={nextStatus} />
          <button
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
              status === nextStatus
                ? "cursor-default border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
            disabled={status === nextStatus}
            type="submit"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        </form>
      ))}
      <form action={deleteCoacheeGoalAction}>
        <input name="coacheeId" type="hidden" value={coacheeId} />
        <input name="goalId" type="hidden" value={goalId} />
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
          title="Supprimer l'objectif"
          type="submit"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function CoacheeProfilePage({ data }: { data: CoachCoacheeDetail }) {
  const profileMetrics = [
    {
      icon: Target,
      label: "Objectifs",
      tone: "border-sky-100 bg-sky-50 text-sky-700",
      value: data.goals.length,
    },
    {
      icon: CheckCircle2,
      label: "Suivis",
      tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
      value: data.progress.length,
    },
    {
      icon: NotebookPen,
      label: "Notes",
      tone: "border-indigo-100 bg-indigo-50 text-indigo-700",
      value: data.notes.length,
    },
    {
      icon: Send,
      label: "Relances",
      tone: "border-amber-100 bg-amber-50 text-amber-700",
      value: data.reminders.length,
    },
  ];

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "soft" })}
            href={`/coach/calendar?target=coachee:${data.profile.id}`}
          >
            <CalendarDays className="h-4 w-4" />
            Planifier un rendez-vous
          </Link>
        }
        description="Profil détaillé, assignations, scores, notes privées et historique."
        title={data.profile.fullName}
      />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                    {getInitials(data.profile.fullName) || (
                      <UserRound className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-lg font-semibold text-slate-950">
                      {data.profile.fullName}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {data.profile.email}
                    </p>
                  </div>
                </div>
                <Link
                  className={buttonVariants({ variant: "secondary" })}
                  href={`/coach/messages?conversation=${data.profile.id}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {profileMetrics.map(({ icon: Icon, label, tone, value }) => (
                  <div
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 ring-1 ring-white"
                    key={label}
                  >
                    <div
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                        tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">
                      {value}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                  <Target className="h-4 w-4" />
                </span>
                <CardTitle>Objectifs de coaching</CardTitle>
              </div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                {data.goals.length} objectif(s)
              </span>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.goals.length ? (
                data.goals.map((goal) => (
                  <article
                    className="grid gap-4 p-5 transition hover:bg-sky-50/35 lg:grid-cols-[minmax(0,1fr)_auto] [contain-intrinsic-size:130px] [content-visibility:auto]"
                    key={goal.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <GoalStatusBadge status={goal.status} />
                        {goal.dueDate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(goal.dueDate)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 break-words font-medium text-slate-950">
                        {goal.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Créé le {formatDate(goal.createdAt)}
                      </p>
                    </div>
                    <GoalStatusActions
                      coacheeId={data.profile.id}
                      goalId={goal.id}
                      status={goal.status}
                    />
                  </article>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState
                    description="Ajoutez un premier objectif pour cadrer le suivi individuel."
                    icon={Target}
                    title="Aucun objectif"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 ring-1 ring-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Progression individuelle</CardTitle>
                  <CardDescription>
                    Assignations, statuts et avancée opérationnelle.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.progress.length ? (
                data.progress.map((item) => (
                  <div
                    className="grid gap-3 p-5 transition hover:bg-sky-50/35 md:grid-cols-[minmax(0,1fr)_140px] [contain-intrinsic-size:120px] [content-visibility:auto]"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {item.assignmentTitle}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {item.assignmentDescription}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState
                    description="Aucune progression enregistrée pour le moment."
                    icon={CheckCircle2}
                    title="Aucune progression"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 ring-1 ring-white">
                  <NotebookPen className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Résultats quiz</CardTitle>
                  <CardDescription>
                    Dernières tentatives, score obtenu et statut.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.quizAttempts.length ? (
                data.quizAttempts.map((attempt) => (
                  <div
                    className="grid gap-4 p-5 transition hover:bg-sky-50/35 md:grid-cols-[minmax(0,1fr)_160px_120px] md:items-center [contain-intrinsic-size:120px] [content-visibility:auto]"
                    key={attempt.id}
                  >
                    <p className="min-w-0 break-words font-medium">
                      {attempt.quizTitle}
                    </p>
                    <div>
                      <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                        <span>Score</span>
                        <span>{formatPercent(attempt.percentage)}</span>
                      </div>
                      <ProgressBar value={attempt.percentage} />
                    </div>
                    <div>
                      <StatusBadge status={attempt.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState
                    description="Aucun résultat quiz pour le moment."
                    icon={CheckCircle2}
                    title="Aucun résultat"
                  />
                </div>
              )}
            </div>
          </Card>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Nouvel objectif</CardTitle>
                  <CardDescription>
                    Visible par le coaché dans son profil.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="p-5">
              <CoacheeGoalForm coacheeId={data.profile.id} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 ring-1 ring-white">
                  <NotebookPen className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Entretiens individuels</CardTitle>
                  <CardDescription>
                    Notes privées visibles uniquement par les coachs autorisés
                    et les admins.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="space-y-3 p-5">
              {data.notes.length ? (
                data.notes.map((note) => (
                  <div
                    className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 ring-1 ring-white [contain-intrinsic-size:120px] [content-visibility:auto]"
                    key={note.id}
                  >
                    <p className="whitespace-pre-line break-words">
                      {note.note}
                    </p>
                    <p className="mt-3 border-t border-slate-200 pt-2 text-xs font-medium text-slate-400">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  description="Aucun entretien individuel enregistré."
                  icon={NotebookPen}
                  title="Aucune note"
                />
              )}
              <div className="pt-1">
                <CoachNoteForm coacheeId={data.profile.id} />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 ring-1 ring-white">
                  <Send className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Relances envoyées</CardTitle>
                  <CardDescription>
                    Historique des rappels liés au suivi de parcours.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="space-y-3 p-5">
              {data.reminders.length ? (
                data.reminders.map((reminder) => (
                  <div
                    className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-white transition hover:border-indigo-200 hover:bg-indigo-50 [contain-intrinsic-size:150px] [content-visibility:auto]"
                    key={reminder.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {reminder.type === "correction"
                          ? "Correction"
                          : reminder.type === "blocked"
                            ? "Blocage"
                            : "Template"}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {formatDateTime(reminder.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 break-words font-medium text-slate-950">
                      {reminder.title}
                    </p>
                    {reminder.reason ? (
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {reminder.reason}
                      </p>
                    ) : null}
                    <Link
                      className="mt-3 inline-flex rounded-lg border border-indigo-100 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-white"
                      href={`/coach/messages?conversation=${data.profile.id}`}
                    >
                      Ouvrir la conversation
                    </Link>
                  </div>
                ))
              ) : (
                <EmptyState
                  description="Aucune relance envoyée depuis les parcours ou templates."
                  icon={Send}
                  title="Aucune relance"
                />
              )}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
