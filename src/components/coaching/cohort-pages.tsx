import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import {
  AddCohortMemberForm,
  CreateCohortForm,
  RemoveCohortMemberButton,
} from "@/components/coaching/cohort-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  CoachCohortDetail,
  CoachCohortSummary,
} from "@/services/coach-service";
import { formatDate, formatPercent } from "@/utils/format";

function safeDate(value: string | null) {
  return value ? formatDate(value) : "Non définie";
}

export function CohortsPage({ cohorts }: { cohorts: CoachCohortSummary[] }) {
  return (
    <>
      <PageHeader
        actions={
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href="#new-cohort"
          >
            <Plus className="h-4 w-4" />
            Nouvelle cohorte
          </a>
        }
        description="Créez des groupes, assignez des parcours et suivez les retards collectifs."
        title="Cohortes"
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[380px_1fr]">
        <section
          className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5"
          id="new-cohort"
        >
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Groupe de suivi
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Nouvelle cohorte
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Créez un groupe clair, puis ajoutez les coachés depuis la fiche
              cohorte.
            </p>
          </div>
          <CreateCohortForm />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {cohorts.length ? (
            cohorts.map((cohort) => (
              <article
                className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/10"
                key={cohort.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      className="text-xl font-semibold text-slate-950 hover:text-sky-700 hover:underline"
                      href={`/coach/cohorts/${cohort.id}`}
                    >
                      {cohort.name}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {cohort.description}
                    </p>
                  </div>
                  <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                    <UsersRound className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Membres</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {cohort.memberCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Score moyen</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatPercent(cohort.scoreAverage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Fin</p>
                    <p className="mt-1 text-sm font-medium">
                      {safeDate(cohort.endDate)}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Progression globale</span>
                    <span>{cohort.progress}%</span>
                  </div>
                  <ProgressBar value={cohort.progress} />
                </div>
              </article>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyState
                description="Créez votre première cohorte pour regrouper les coachés et suivre leur progression."
                icon={UsersRound}
                title="Aucune cohorte"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function CohortDetailPage({ cohort }: { cohort: CoachCohortDetail }) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href={`/coach/assignments/new?target=cohort:${cohort.id}`}
          >
            <Plus className="h-4 w-4" />
            Assigner à la cohorte
          </Link>
        }
        description={cohort.description}
        title={cohort.name}
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper={`${safeDate(cohort.startDate)} → ${safeDate(cohort.endDate)}`}
            icon={UsersRound}
            label="Membres"
            value={String(cohort.memberCount)}
          />
          <StatCard
            helper="Tous quiz confondus"
            icon={UsersRound}
            label="Score moyen"
            value={formatPercent(cohort.scoreAverage)}
          />
          <StatCard
            helper="Progression individuelle agrégée"
            icon={UsersRound}
            label="Progression"
            value={formatPercent(cohort.progress)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-white shadow-sm shadow-sky-900/5">
            <div className="space-y-4 border-b border-sky-100 p-5">
              <div>
                <h2 className="font-semibold">Membres</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ajoutez ou retirez les coachés de cette cohorte.
                </p>
              </div>
              <AddCohortMemberForm
                cohortId={cohort.id}
                options={cohort.availableCoachees}
              />
            </div>
            <div className="divide-y divide-slate-100">
              {cohort.members.length ? (
                cohort.members.map((member) => (
                  <div
                    className="grid grid-cols-[1fr_auto] items-center gap-4 p-5"
                    key={member.id}
                  >
                    <div>
                      <Link
                        className="font-medium hover:underline"
                        href={`/coach/coachees/${member.id}`}
                      >
                        {member.fullName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {member.email}
                      </p>
                    </div>
                    <RemoveCohortMemberButton
                      cohortId={cohort.id}
                      userId={member.id}
                    />
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-slate-500">
                  Aucun membre dans cette cohorte.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-white shadow-sm shadow-sky-900/5">
            <div className="border-b border-sky-100 p-5">
              <h2 className="font-semibold">Assignations de cohorte</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {cohort.assignments.length ? (
                cohort.assignments.map((assignment) => (
                  <div
                    className="grid gap-3 p-5 md:grid-cols-[1fr_120px]"
                    key={assignment.id}
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Deadline {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-slate-500">
                  Aucune assignation pour cette cohorte.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
