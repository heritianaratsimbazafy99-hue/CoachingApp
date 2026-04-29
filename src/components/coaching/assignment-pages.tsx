import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import {
  assignments,
  cohorts,
  contents,
  getProfile,
  profiles,
  quizzes,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/format";

export function AssignmentsPage() {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            href="/coach/assignments/new"
          >
            <Plus className="h-4 w-4" />
            Créer une assignation
          </Link>
        }
        description="Suivez les contenus, quiz, deadlines, retards et relances."
        title="Assignations"
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          {["Tous", "En retard", "Cette semaine", "À corriger"].map((filter) => (
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              key={filter}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => {
              const target = assignment.assignedToUserId
                ? getProfile(assignment.assignedToUserId)?.fullName
                : cohorts.find(
                    (cohort) => cohort.id === assignment.assignedToCohortId,
                  )?.name;

              return (
                <div
                  className="grid gap-4 p-5 lg:grid-cols-[1.2fr_160px_130px_130px_160px]"
                  key={assignment.id}
                >
                  <div>
                    <p className="font-semibold">{assignment.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {assignment.instructions}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">{target}</p>
                  <StatusBadge status={assignment.status} />
                  <PriorityBadge priority={assignment.priority} />
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4" />
                    {formatDate(assignment.deadline)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function AssignmentComposerPage() {
  const coachees = profiles.filter((profile) => profile.role === "coachee");

  return (
    <>
      <PageHeader
        description="Assignez un contenu, un quiz ou les deux à un coaché ou une cohorte."
        title="Nouvelle assignation"
      />
      <div className="p-6">
        <form className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Titre</span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
                placeholder="Ex : Module posture + quiz"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Instructions
              </span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
                placeholder="Message visible côté coaché"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Contenu
                </span>
                <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option>Aucun</option>
                  {contents.map((content) => (
                    <option key={content.id}>{content.title}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Quiz</span>
                <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option>Aucun</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id}>{quiz.title}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <aside className="space-y-5 rounded-xl bg-slate-50 p-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Cible</span>
              <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Choisir une cible</option>
                {coachees.map((profile) => (
                  <option key={profile.id}>Coaché : {profile.fullName}</option>
                ))}
                {cohorts.map((cohort) => (
                  <option key={cohort.id}>Cohorte : {cohort.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Deadline
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
                type="date"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Priorité
              </span>
              <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Normale</option>
                <option>Importante</option>
              </select>
            </label>
            <ActionButton message="Assignation créée" variant="primary">
              Créer l&apos;assignation
            </ActionButton>
          </aside>
        </form>
      </div>
    </>
  );
}
