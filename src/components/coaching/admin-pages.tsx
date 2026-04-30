import Link from "next/link";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  UsersRound,
} from "lucide-react";
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

export function AdminCohortsPage({ cohorts }: { cohorts: AdminCohort[] }) {
  return (
    <>
      <PageHeader
        description="Progression globale des cohortes et scores moyens."
        title="Cohortes"
      />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        {cohorts.length ? (
          cohorts.map((cohort) => (
            <article
              className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/5"
              key={cohort.id}
            >
              <p className="text-lg font-semibold">{cohort.name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {cohort.description}
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
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
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-slate-500">
                  <span>Progression</span>
                  <span>{cohort.progress}%</span>
                </div>
                <ProgressBar value={cohort.progress} />
              </div>
            </article>
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              description="Créez une cohorte côté coach ou depuis le module admin lorsque la création sera activée."
              icon={Layers3}
              title="Aucune cohorte"
            />
          </div>
        )}
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
