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
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  CoachCoacheeDetail,
  CoachCoacheeSummary,
} from "@/services/coach-service";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export function CoacheesPage({
  coachees,
}: {
  coachees: CoachCoacheeSummary[];
}) {
  return (
    <>
      <PageHeader
        description="Liste des coachés avec progression, scores, retards et actions rapides."
        title="Mes coachés"
      />
      <div className="p-6">
        {coachees.length ? (
          <div className="grid gap-4">
            {coachees.map((coachee) => (
              <article
                className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_220px_140px_260px]"
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
                <div className="flex flex-wrap gap-2">
                  <ActionButton message={`Message préparé pour ${coachee.fullName}`}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </ActionButton>
                  <ActionButton message={`Relance envoyée à ${coachee.fullName}`}>
                    <Send className="mr-2 h-4 w-4" />
                    Relancer
                  </ActionButton>
                </div>
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
          <ActionButton message={`Rendez-vous planifié avec ${data.profile.fullName}`}>
            Planifier un rendez-vous
          </ActionButton>
        }
        description="Profil détaillé, assignations, scores, notes privées et historique."
        title={data.profile.fullName}
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <UserRound className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <p className="font-semibold">{data.profile.fullName}</p>
                <p className="text-sm text-slate-500">{data.profile.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold">Objectifs de coaching</h2>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {data.goals.length} objectif(s)
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {data.goals.length ? (
                data.goals.map((goal) => (
                  <article className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]" key={goal.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <GoalStatusBadge status={goal.status} />
                        {goal.dueDate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold">Progression individuelle</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.progress.length ? (
                data.progress.map((item) => (
                  <div
                    className="grid gap-3 p-5 md:grid-cols-[1fr_140px]"
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
                <p className="p-5 text-sm text-slate-500">
                  Aucune progression enregistrée.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold">Résultats quiz</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.quizAttempts.length ? (
                data.quizAttempts.map((attempt) => (
                  <div
                    className="grid gap-3 p-5 md:grid-cols-[1fr_120px_120px]"
                    key={attempt.id}
                  >
                    <p className="font-medium">{attempt.quizTitle}</p>
                    <p className="text-sm font-semibold">
                      {attempt.percentage}%
                    </p>
                    <StatusBadge status={attempt.status} />
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-slate-500">
                  Aucun résultat quiz pour le moment.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold">Nouvel objectif</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              L&apos;objectif sera visible par le coaché dans son profil.
            </p>
            <div className="mt-5">
              <CoacheeGoalForm coacheeId={data.profile.id} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">Notes privées coach</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.notes.length ? (
                data.notes.map((note) => (
                  <div
                    className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                    key={note.id}
                  >
                    <p>{note.note}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  Aucune note privée.
                </p>
              )}
            </div>
            <div className="mt-4">
              <CoachNoteForm coacheeId={data.profile.id} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
