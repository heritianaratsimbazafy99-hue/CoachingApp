import { AlertTriangle, Power, UserCheck, UsersRound } from "lucide-react";
import {
  AssignCoacheeToCohortForm,
  ChangeCoacheeCoachForm,
  ToggleCoacheeStatusForm,
} from "@/components/coaching/admin-coachee-assignment-forms";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ListMetaTile,
  ListPanel,
  ListPanelBody,
  ListPanelRow,
} from "@/components/ui/list-panel";
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
          <ListPanel
            countLabel={`${data.coachees.length} coaché(s)`}
            description="Affectations, signaux de risque et actions de correction."
            icon={UsersRound}
            title="Pilotage des coachés"
          >
            <ListPanelBody>
              {data.coachees.map((coachee) => (
                <ListPanelRow
                  className="xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_minmax(0,1.25fr)] xl:items-start [contain-intrinsic-size:290px]"
                  key={coachee.id}
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                        <UsersRound className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-base font-semibold text-slate-950">
                          {coachee.fullName}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {coachee.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <CoacheeSignals coachee={coachee} />
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-3">
                    <ListMetaTile label="Dernière connexion">
                      {safeDate(coachee.lastSignInAt)}
                    </ListMetaTile>
                    <ListMetaTile label="Cohortes">
                      {coachee.cohorts.length
                        ? coachee.cohorts
                            .map((cohort) => cohort.name)
                            .join(", ")
                        : "Aucune"}
                    </ListMetaTile>
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
                </ListPanelRow>
              ))}
            </ListPanelBody>
          </ListPanel>
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
