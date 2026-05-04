import Link from "next/link";
import { BarChart3, CalendarDays, Plus, UsersRound } from "lucide-react";
import {
  AddCohortMemberForm,
  CreateCohortForm,
  RemoveCohortMemberButton,
} from "@/components/coaching/cohort-forms";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <a className={buttonVariants()} href="#new-cohort">
            <Plus className="h-4 w-4" />
            Nouvelle cohorte
          </a>
        }
        description="Créez des groupes, assignez des parcours et suivez les retards collectifs."
        title="Cohortes"
      />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[380px_1fr]">
        <Card className="p-5" id="new-cohort">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase text-sky-700">
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
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {cohorts.length ? (
            cohorts.map((cohort) => (
              <article
                className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-950/[0.04] ring-1 ring-white transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-slate-950/[0.06]"
                key={cohort.id}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-300/70 via-indigo-300/60 to-emerald-300/60" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      className="break-words text-xl font-semibold text-slate-950 hover:text-sky-700"
                      href={`/coach/cohorts/${cohort.id}`}
                    >
                      {cohort.name}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {cohort.description}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-2.5 text-sky-700 transition group-hover:scale-105">
                    <UsersRound className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-sm text-slate-500">Membres</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {cohort.memberCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-sm text-slate-500">Score moyen</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {formatPercent(cohort.scoreAverage)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-sm text-slate-500">Fin</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
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
            className={buttonVariants()}
            href={`/coach/assignments/new?target=cohort:${cohort.id}`}
          >
            <Plus className="h-4 w-4" />
            Assigner à la cohorte
          </Link>
        }
        description={cohort.description}
        title={cohort.name}
      />
      <div className="space-y-6 p-4 sm:p-6">
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
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Membres</CardTitle>
                  <CardDescription>
                    Ajoutez ou retirez les coachés de cette cohorte.
                  </CardDescription>
                </div>
              </div>
              <AddCohortMemberForm
                cohortId={cohort.id}
                options={cohort.availableCoachees}
              />
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {cohort.members.length ? (
                cohort.members.map((member) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 transition hover:bg-sky-50/35"
                    key={member.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className="break-words font-semibold text-slate-950 hover:text-sky-700"
                        href={`/coach/coachees/${member.id}`}
                      >
                        {member.fullName}
                      </Link>
                      <p className="mt-1 break-all text-sm text-slate-500">
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
                <div className="p-5">
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    Aucun membre dans cette cohorte.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-700">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Assignations de cohorte</CardTitle>
                  <CardDescription>
                    Contenus et quiz assignés au groupe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {cohort.assignments.length ? (
                cohort.assignments.map((assignment) => (
                  <div
                    className="grid gap-3 p-5 transition hover:bg-sky-50/35 md:grid-cols-[minmax(0,1fr)_120px]"
                    key={assignment.id}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-950">
                        {assignment.title}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Deadline {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                ))
              ) : (
                <div className="p-5">
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    Aucune assignation pour cette cohorte.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
