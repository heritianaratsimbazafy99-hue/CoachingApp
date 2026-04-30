import Link from "next/link";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  UsersRound,
} from "lucide-react";
import {
  AdminCohortCreateForm,
  AdminCohortDeleteForm,
  AdminCohortEditForm,
  AdminCohortMemberForm,
  AdminCohortMemberRemoveForm,
} from "@/components/coaching/admin-cohort-forms";
import { AdminUserOnboardingActions } from "@/components/coaching/admin-user-onboarding-actions";
import { AdminRoleForm } from "@/components/coaching/admin-role-form";
import { AdminUserCreateForm } from "@/components/coaching/admin-user-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatPercent } from "@/utils/format";
import type {
  AdminCohort,
  AdminDashboardData,
  AdminMetrics,
  AdminUser,
} from "@/services/admin-service";

const roleLabel: Record<AdminUser["role"], string> = {
  admin: "Admin",
  coach: "Coach",
  coachee: "Coaché",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCohortDate(value: string | null) {
  return value ? formatDate(value) : "Non définie";
}

function getOnboardingStatus(profile: AdminUser) {
  if (profile.emailConfirmedAt) {
    return {
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      label: "Confirmé",
    };
  }

  if (profile.invitedAt) {
    return {
      className: "bg-sky-50 text-sky-700 ring-sky-100",
      label: "Invité",
    };
  }

  if (profile.confirmationSentAt) {
    return {
      className: "bg-amber-50 text-amber-700 ring-amber-100",
      label: "Email envoyé",
    };
  }

  return {
    className: "bg-slate-50 text-slate-600 ring-slate-100",
    label: "À inviter",
  };
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <>
      <PageHeader
        description="Supervision globale de la plateforme, des coachs, cohortes et résultats."
        title="Dashboard admin"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Utilisateurs coach"
            icon={GraduationCap}
            label="Coachs"
            value={String(data.metrics.coachesCount)}
          />
          <StatCard
            helper="Comptes coachés actifs"
            icon={UsersRound}
            label="Coachés"
            value={String(data.metrics.coacheesCount)}
          />
          <StatCard
            helper="Moyenne globale"
            icon={BarChart3}
            label="Score quiz"
            value={formatPercent(data.metrics.quizScoreAverage)}
          />
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Cohortes actives ou historiques"
            icon={Layers3}
            label="Cohortes"
            value={String(data.metrics.cohortsCount)}
          />
          <StatCard
            helper="Modules et ressources"
            icon={BookOpenCheck}
            label="Contenus"
            value={String(data.metrics.contentsCount)}
          />
          <StatCard
            helper="Corrections manuelles"
            icon={ClipboardCheck}
            label="À corriger"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
        </section>
        <AdminUsersPage compact users={data.users} />
      </div>
    </>
  );
}

export function AdminUsersPage({
  compact = false,
  users,
}: {
  compact?: boolean;
  users: AdminUser[];
}) {
  const visibleUsers = compact ? users.slice(0, 6) : users;

  return (
    <>
      {compact ? null : (
        <PageHeader
          description="Gestion des comptes et rôles utilisateurs."
          title="Utilisateurs"
        />
      )}
      <div className={compact ? "" : "p-6"}>
        {compact ? null : (
          <section className="mb-6 rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
            <div className="mb-5">
              <h2 className="font-semibold">Créer un utilisateur</h2>
              <p className="mt-1 text-sm text-slate-500">
                Privilégiez l&apos;invitation email pour laisser la personne définir
                son mot de passe. Le mode temporaire reste disponible si besoin.
              </p>
            </div>
            <AdminUserCreateForm />
          </section>
        )}
        {visibleUsers.length ? (
          <div className="rounded-xl border border-sky-100 bg-white/95 shadow-sm shadow-sky-900/5">
            {compact ? (
              <div className="flex items-center justify-between border-b border-sky-100 p-5">
                <div>
                  <h2 className="font-semibold">Utilisateurs récents</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Comptes Supabase synchronisés avec les profils.
                  </p>
                </div>
                <Link
                  className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                  href="/admin/users"
                >
                  Tout voir
                </Link>
              </div>
            ) : null}
          <div className="divide-y divide-slate-100">
            {visibleUsers.map((profile) => {
              const onboardingStatus = getOnboardingStatus(profile);

              return (
                <div
                  className="grid gap-4 p-5 md:grid-cols-[1fr_120px_170px_280px]"
                  key={profile.id}
                >
                  <div>
                    <p className="font-medium">{profile.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {profile.email}
                    </p>
                  </div>
                  <p className="capitalize text-sm font-medium text-slate-600">
                    {roleLabel[profile.role]}
                  </p>
                  <div className="space-y-3 text-sm text-slate-500">
                    <p>
                      Dernière connexion
                      <span className="mt-1 block font-medium text-slate-700">
                        {formatDate(profile.lastSignInAt)}
                      </span>
                    </p>
                    {compact ? null : (
                      <p>
                        Onboarding
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${onboardingStatus.className}`}
                        >
                          {onboardingStatus.label}
                        </span>
                      </p>
                    )}
                  </div>
                  {compact ? (
                    <span className="text-sm text-slate-500">
                      Créé le {formatDate(profile.createdAt)}
                    </span>
                  ) : (
                    <div className="space-y-3">
                      <AdminRoleForm
                        currentRole={profile.role}
                        userId={profile.id}
                      />
                      <AdminUserOnboardingActions userId={profile.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        ) : (
          <EmptyState
            description="Aucun compte n'a encore été synchronisé dans Supabase Auth."
            icon={UsersRound}
            title="Aucun utilisateur"
          />
        )}
      </div>
    </>
  );
}

export function AdminCoachesPage({
  cohorts,
  users,
}: {
  cohorts: AdminCohort[];
  users: AdminUser[];
}) {
  const coaches = users.filter((profile) => profile.role === "coach");

  return (
    <>
      <PageHeader
        description="Liste des coachs et charge de cohortes."
        title="Coachs"
      />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        {coaches.length ? (
          coaches.map((coach) => (
            <article
              className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/5"
              key={coach.id}
            >
              <p className="text-lg font-semibold">{coach.fullName}</p>
              <p className="mt-1 text-sm text-slate-500">{coach.email}</p>
              <p className="mt-4 text-sm text-slate-600">
                Cohortes responsables :{" "}
                {cohorts.filter((cohort) => cohort.coachId === coach.id).length}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Dernière connexion : {formatDate(coach.lastSignInAt)}
              </p>
            </article>
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              description="Aucun utilisateur n'a encore le rôle coach."
              icon={GraduationCap}
              title="Aucun coach"
            />
          </div>
        )}
      </div>
    </>
  );
}

export function AdminCohortsPage({
  cohorts,
  users,
}: {
  cohorts: AdminCohort[];
  users: AdminUser[];
}) {
  const coaches = users.filter((profile) => profile.role === "coach");
  const coachees = users.filter((profile) => profile.role === "coachee");

  return (
    <>
      <PageHeader
        actions={
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href="#admin-new-cohort"
          >
            <Layers3 className="h-4 w-4" />
            Nouvelle cohorte
          </a>
        }
        description="Création, coach responsable, membres et suivi opérationnel des cohortes."
        title="Cohortes"
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[380px_1fr]">
        <section
          className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5"
          id="admin-new-cohort"
        >
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Administration
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Nouvelle cohorte
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Créez la cohorte avec son coach responsable dès le départ.
            </p>
          </div>
          <AdminCohortCreateForm coaches={coaches} />
        </section>

        <section className="space-y-4">
          {cohorts.length ? (
            cohorts.map((cohort) => {
              const memberIds = new Set(
                cohort.members.map((member) => member.id),
              );
              const availableCoachees = coachees.filter(
                (coachee) => !memberIds.has(coachee.id),
              );

              return (
                <article
                  className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5"
                  key={cohort.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{cohort.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {cohort.description}
                      </p>
                    </div>
                    <AdminCohortDeleteForm cohort={cohort} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                    <p>
                      Coach
                      <span className="mt-1 block font-medium text-slate-900">
                        {cohort.coachName}
                      </span>
                    </p>
                    <p>
                      Membres
                      <span className="mt-1 block font-medium text-slate-900">
                        {cohort.memberCount}
                      </span>
                    </p>
                    <p>
                      Assignations
                      <span className="mt-1 block font-medium text-slate-900">
                        {cohort.assignmentCount}
                      </span>
                    </p>
                    <p>
                      Dates
                      <span className="mt-1 block font-medium text-slate-900">
                        {formatCohortDate(cohort.startDate)} →{" "}
                        {formatCohortDate(cohort.endDate)}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-slate-500">
                      <span>Progression</span>
                      <span>{cohort.progress}%</span>
                    </div>
                    <ProgressBar value={cohort.progress} />
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <details className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                        Modifier la cohorte
                      </summary>
                      <div className="mt-4">
                        <AdminCohortEditForm
                          coaches={coaches}
                          cohort={cohort}
                        />
                      </div>
                    </details>

                    <details className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                        Gérer les coachés
                      </summary>
                      <div className="mt-4 space-y-4">
                        <AdminCohortMemberForm
                          cohortId={cohort.id}
                          options={availableCoachees}
                        />
                        <div className="divide-y divide-slate-100 rounded-lg border border-sky-100 bg-white">
                          {cohort.members.length ? (
                            cohort.members.map((member) => (
                              <div
                                className="grid grid-cols-[1fr_auto] items-center gap-3 p-3"
                                key={member.id}
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {member.fullName}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {member.email}
                                  </p>
                                </div>
                                <AdminCohortMemberRemoveForm
                                  cohortId={cohort.id}
                                  memberId={member.id}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="p-3 text-sm text-slate-500">
                              Aucun coaché dans cette cohorte.
                            </p>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              description="Créez une première cohorte avec un coach responsable et ajoutez les coachés concernés."
              icon={Layers3}
              title="Aucune cohorte"
            />
          )}
        </section>
      </div>
    </>
  );
}

export function AdminStatsPage({ metrics }: { metrics: AdminMetrics }) {
  const panels = [
    {
      label: "Taux de complétion",
      value: metrics.completionRate,
    },
    {
      label: "Retards",
      value: metrics.assignmentsCount
        ? Math.round(
            (metrics.lateAssignmentsCount / metrics.assignmentsCount) * 100,
          )
        : 0,
    },
    {
      label: "Scores quiz",
      value: metrics.quizScoreAverage,
    },
  ];

  return (
    <>
      <PageHeader
        description="Statistiques globales calculées depuis Supabase."
        title="Statistiques globales"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            helper="Tous rôles confondus"
            icon={UsersRound}
            label="Utilisateurs"
            value={String(metrics.usersCount)}
          />
          <StatCard
            helper="Contenus publiés ou brouillons"
            icon={BookOpenCheck}
            label="Contenus"
            value={String(metrics.contentsCount)}
          />
          <StatCard
            helper="Quiz disponibles"
            icon={ClipboardCheck}
            label="Quiz"
            value={String(metrics.quizzesCount)}
          />
          <StatCard
            helper="Assignations totales"
            icon={BarChart3}
            label="Assignations"
            value={String(metrics.assignmentsCount)}
          />
        </section>
        <section className="grid gap-6 lg:grid-cols-3">
          {panels.map((panel) => (
            <div
              className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5"
              key={panel.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{panel.label}</p>
                <span className="text-sm font-semibold text-slate-500">
                  {formatPercent(panel.value)}
                </span>
              </div>
              <div className="mt-6 h-48">
                <div className="flex h-full items-end rounded-lg border border-sky-100 bg-sky-50/70 px-5 pb-5">
                  <div
                    className="w-full rounded-t-lg bg-sky-500 transition-all"
                    style={{ height: `${Math.max(8, panel.value)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
