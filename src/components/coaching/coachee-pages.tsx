import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
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
                className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06] lg:grid-cols-[minmax(0,1.2fr)_220px_140px_250px] [contain-intrinsic-size:180px] [content-visibility:auto]"
                key={coachee.id}
              >
                <div>
                  <Link
                    className="text-lg font-semibold hover:underline"
                    href={`/coach/coachees/${coachee.id}`}
                  >
                    {coachee.fullName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{coachee.email}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Dernière connexion : {formatDateTime(coachee.lastActiveAt)}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Progression</span>
                    <span>{coachee.progress}%</span>
                  </div>
                  <ProgressBar value={coachee.progress} />
                </div>
                <div>
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
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
                <UserRound className="h-6 w-6 text-sky-700" />
              </div>
              <div>
                <p className="font-semibold">{data.profile.fullName}</p>
                <p className="text-sm text-slate-500">{data.profile.email}</p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-sky-600" />
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
                    className="grid gap-4 p-5 transition hover:bg-slate-50/70 lg:grid-cols-[minmax(0,1fr)_auto] [contain-intrinsic-size:130px] [content-visibility:auto]"
                    key={goal.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <GoalStatusBadge status={goal.status} />
                        {goal.dueDate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(goal.dueDate)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-slate-950">
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
              <CardTitle>Progression individuelle</CardTitle>
              <CardDescription>
                Assignations, statuts et avancée opérationnelle.
              </CardDescription>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.progress.length ? (
                data.progress.map((item) => (
                  <div
                    className="grid gap-3 p-5 transition hover:bg-slate-50/70 md:grid-cols-[minmax(0,1fr)_140px] [contain-intrinsic-size:120px] [content-visibility:auto]"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium">{item.assignmentTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
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
              <CardTitle>Résultats quiz</CardTitle>
              <CardDescription>
                Dernières tentatives, score obtenu et statut.
              </CardDescription>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.quizAttempts.length ? (
                data.quizAttempts.map((attempt) => (
                  <div
                    className="grid gap-4 p-5 transition hover:bg-slate-50/70 md:grid-cols-[minmax(0,1fr)_160px_120px] md:items-center [contain-intrinsic-size:120px] [content-visibility:auto]"
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

        <aside className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-sky-600" />
              <h2 className="font-semibold">Nouvel objectif</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              L&apos;objectif sera visible par le coaché dans son profil.
            </p>
            <div className="mt-5">
              <CoacheeGoalForm coacheeId={data.profile.id} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-sky-700" />
              <h2 className="font-semibold">Entretiens individuels</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Notes privées visibles uniquement par les coachs autorisés et les
              admins.
            </p>
            <div className="mt-4 space-y-3">
              {data.notes.length ? (
                data.notes.map((note) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 [contain-intrinsic-size:120px] [content-visibility:auto]"
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
            </div>
            <div className="mt-4">
              <CoachNoteForm coacheeId={data.profile.id} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold">Relances envoyées</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.reminders.length ? (
                data.reminders.map((reminder) => (
                  <div
                    className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm leading-6 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 [contain-intrinsic-size:150px] [content-visibility:auto]"
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
                    <p className="mt-3 font-medium text-slate-950">
                      {reminder.title}
                    </p>
                    {reminder.reason ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {reminder.reason}
                      </p>
                    ) : null}
                    <Link
                      className="mt-3 inline-flex rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-white/80"
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
