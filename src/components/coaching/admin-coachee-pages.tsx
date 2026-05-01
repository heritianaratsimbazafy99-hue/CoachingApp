import { AlertTriangle, Power, UserCheck, UsersRound } from "lucide-react";
import {
  AssignCoacheeToCohortForm,
  ChangeCoacheeCoachForm,
  ToggleCoacheeStatusForm,
} from "@/components/coaching/admin-coachee-assignment-forms";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  AdminCoacheeAssignment,
  AdminCoacheeAssignmentsData,
} from "@/services/admin-service";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

function safeDate(value: string | null) {
  return value ? formatDate(value) : "Jamais";
}

function StatusBadge({ children, tone }: { children: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-semibold ring-1",
        tone,
      )}
    >
      {children}
    </span>
  );
}

function CoacheeSignals({ coachee }: { coachee: AdminCoacheeAssignment }) {
  return (
    <div className="flex flex-wrap gap-2">
      {coachee.hasCohort ? (
        <StatusBadge tone="border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100">
          Cohorte OK
        </StatusBadge>
      ) : (
        <StatusBadge tone="border-amber-100 bg-amber-50 text-amber-700 ring-amber-100">
          Sans cohorte
        </StatusBadge>
      )}
      {coachee.hasActiveCoach ? (
        <StatusBadge tone="border-sky-100 bg-sky-50 text-sky-700 ring-sky-100">
          Coach actif
        </StatusBadge>
      ) : (
        <StatusBadge tone="border-rose-100 bg-rose-50 text-rose-700 ring-rose-100">
          Sans coach actif
        </StatusBadge>
      )}
      {coachee.isDisabled ? (
        <StatusBadge tone="border-slate-200 bg-slate-100 text-slate-700 ring-slate-200">
          Désactivé
        </StatusBadge>
      ) : null}
    </div>
  );
}

function AttentionList({
  coachees,
  emptyLabel,
  title,
}: {
  coachees: AdminCoacheeAssignment[];
  emptyLabel: string;
  title: string;
}) {
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
          {coachees.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {coachees.length ? (
          coachees.slice(0, 6).map((coachee) => (
            <div
              className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 ring-1 ring-white"
              key={coachee.id}
            >
              <p className="break-words text-sm font-medium text-slate-800">
                {coachee.fullName}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {coachee.email}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-sm leading-6 text-slate-500">
            {emptyLabel}
          </p>
        )}
      </div>
    </Card>
  );
}

export function AdminCoacheeAssignmentsPage({
  data,
}: {
  data: AdminCoacheeAssignmentsData;
}) {
  const withoutCohort = data.coachees.filter((coachee) => !coachee.hasCohort);
  const withoutActiveCoach = data.coachees.filter(
    (coachee) => !coachee.hasActiveCoach,
  );

  return (
    <>
      <PageHeader
        description="Détectez les coachés non affectés, corrigez leur cohorte ou leur coach, et bloquez un accès si nécessaire."
        title="Affectations coachés"
      />
      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid min-w-0 gap-4 md:grid-cols-4">
          <StatCard
            helper="Comptes avec rôle coaché"
            icon={UsersRound}
            label="Coachés"
            value={String(data.metrics.totalCoachees)}
          />
          <StatCard
            helper="Aucune cohorte liée"
            icon={AlertTriangle}
            label="Sans cohorte"
            value={String(data.metrics.withoutCohortCount)}
          />
          <StatCard
            helper="Aucun coach responsable actif"
            icon={UserCheck}
            label="Sans coach actif"
            value={String(data.metrics.withoutActiveCoachCount)}
          />
          <StatCard
            helper="Bannis côté Supabase Auth"
            icon={Power}
            label="Désactivés"
            value={String(data.metrics.disabledCount)}
          />
        </section>

        <section className="grid min-w-0 gap-4 lg:grid-cols-2">
          <AttentionList
            coachees={withoutCohort}
            emptyLabel="Tous les coachés sont rattachés à au moins une cohorte."
            title="Coachés sans cohorte"
          />
          <AttentionList
            coachees={withoutActiveCoach}
            emptyLabel="Tous les coachés ont au moins un coach actif via leurs cohortes."
            title="Coachés sans coach actif"
          />
        </section>

        {data.coachees.length ? (
          <section className="space-y-4">
            {data.coachees.map((coachee) => (
              <article
                className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-950/[0.04] ring-1 ring-white transition hover:border-sky-200 hover:shadow-md hover:shadow-slate-950/[0.06] sm:p-5 [contain-intrinsic-size:260px] [content-visibility:auto]"
                key={coachee.id}
              >
                <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-lg font-semibold text-slate-950">
                          {coachee.fullName}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {coachee.email}
                        </p>
                      </div>
                      <CoacheeSignals coachee={coachee} />
                    </div>

                    <div className="mt-4 grid min-w-0 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                        Dernière connexion
                        <span className="mt-1 block font-medium text-slate-900">
                          {safeDate(coachee.lastSignInAt)}
                        </span>
                      </p>
                      <p className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                        Cohortes
                        <span className="mt-1 block break-words font-medium text-slate-900">
                          {coachee.cohorts.length
                            ? coachee.cohorts
                                .map((cohort) => cohort.name)
                                .join(", ")
                            : "Aucune"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 ring-1 ring-white sm:p-4">
                    <AssignCoacheeToCohortForm
                      coachee={coachee}
                      cohorts={data.cohorts}
                    />
                    <ChangeCoacheeCoachForm
                      coaches={data.coaches}
                      coachee={coachee}
                    />
                    <ToggleCoacheeStatusForm coachee={coachee} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            description="Créez ou invitez des coachés depuis la page utilisateurs pour commencer les affectations."
            icon={UsersRound}
            title="Aucun coaché"
          />
        )}
      </div>
    </>
  );
}
