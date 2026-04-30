import { AlertTriangle, Power, UserCheck, UsersRound } from "lucide-react";
import {
  AssignCoacheeToCohortForm,
  ChangeCoacheeCoachForm,
  ToggleCoacheeStatusForm,
} from "@/components/coaching/admin-coachee-assignment-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  AdminCoacheeAssignment,
  AdminCoacheeAssignmentsData,
} from "@/services/admin-service";
import { formatDate } from "@/utils/format";

function safeDate(value: string | null) {
  return value ? formatDate(value) : "Jamais";
}

function StatusBadge({ children, tone }: { children: string; tone: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      {children}
    </span>
  );
}

function CoacheeSignals({ coachee }: { coachee: AdminCoacheeAssignment }) {
  return (
    <div className="flex flex-wrap gap-2">
      {coachee.hasCohort ? (
        <StatusBadge tone="bg-emerald-50 text-emerald-700 ring-emerald-100">
          Cohorte OK
        </StatusBadge>
      ) : (
        <StatusBadge tone="bg-amber-50 text-amber-700 ring-amber-100">
          Sans cohorte
        </StatusBadge>
      )}
      {coachee.hasActiveCoach ? (
        <StatusBadge tone="bg-sky-50 text-sky-700 ring-sky-100">
          Coach actif
        </StatusBadge>
      ) : (
        <StatusBadge tone="bg-red-50 text-red-700 ring-red-100">
          Sans coach actif
        </StatusBadge>
      )}
      {coachee.isDisabled ? (
        <StatusBadge tone="bg-slate-100 text-slate-700 ring-slate-200">
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
    <section className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {coachees.length ? (
          coachees.slice(0, 6).map((coachee) => (
            <div
              className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2"
              key={coachee.id}
            >
              <p className="text-sm font-medium text-slate-800">
                {coachee.fullName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{coachee.email}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </section>
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
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-4">
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

        <section className="grid gap-4 lg:grid-cols-2">
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
                className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5"
                key={coachee.id}
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {coachee.fullName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {coachee.email}
                        </p>
                      </div>
                      <CoacheeSignals coachee={coachee} />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        Dernière connexion
                        <span className="mt-1 block font-medium text-slate-900">
                          {safeDate(coachee.lastSignInAt)}
                        </span>
                      </p>
                      <p>
                        Cohortes
                        <span className="mt-1 block font-medium text-slate-900">
                          {coachee.cohorts.length
                            ? coachee.cohorts
                                .map((cohort) => cohort.name)
                                .join(", ")
                            : "Aucune"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
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
