import Link from "next/link";
import {
  AlertTriangle,
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
import { DisclosurePanel } from "@/components/ui/disclosure-panel";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ListMetaTile,
  ListPanel,
  ListPanelBody,
  ListPanelRow,
} from "@/components/ui/list-panel";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const roleStyles: Record<AdminUser["role"], string> = {
  admin: "border-indigo-100 bg-indigo-50 text-indigo-700 ring-indigo-100",
  coach: "border-sky-100 bg-sky-50 text-sky-700 ring-sky-100",
  coachee: "border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "Jamais";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
      <div className="space-y-6 p-4 sm:p-6">
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
      <div className={compact ? "" : "p-4 sm:p-6"}>
        {compact ? null : (
          <Card className="mb-6 overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                  <UsersRound className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <CardTitle>Créer un utilisateur</CardTitle>
                  <CardDescription>
                    Privilégiez l&apos;invitation email pour laisser la personne
                    définir son mot de passe. Le mode temporaire reste
                    disponible si besoin.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="p-5">
              <AdminUserCreateForm />
            </div>
          </Card>
        )}
        {visibleUsers.length ? (
          <ListPanel
            actions={
              compact ? (
                <Link
                  className={buttonVariants({ size: "sm", variant: "secondary" })}
                  href="/admin/users"
                >
                  Tout voir
                </Link>
              ) : null
            }
            countLabel={`${visibleUsers.length} compte(s)`}
            description={
              compact
                ? "Comptes Supabase synchronisés avec les profils."
                : "Rôle, onboarding et dernière activité."
            }
            icon={UsersRound}
            title={compact ? "Utilisateurs récents" : "Comptes utilisateurs"}
          >
            <ListPanelBody>
              {visibleUsers.map((profile) => {
                const onboardingStatus = getOnboardingStatus(profile);

                return (
                  <ListPanelRow
                    className={
                      compact
                        ? "lg:grid-cols-[minmax(0,1fr)_130px_180px]"
                        : "lg:grid-cols-[minmax(0,1fr)_130px_190px_minmax(220px,280px)] lg:items-start"
                    }
                    key={profile.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-950 text-xs font-semibold text-white shadow-sm shadow-slate-950/10">
                        {initials(profile.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="break-words font-medium text-slate-950">
                          {profile.fullName}
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    <ListMetaTile label="Rôle">
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ring-1 ${roleStyles[profile.role]}`}
                      >
                        {roleLabel[profile.role]}
                      </span>
                    </ListMetaTile>

                    <div className="grid gap-2">
                      <ListMetaTile label="Dernière connexion">
                        {formatDate(profile.lastSignInAt)}
                      </ListMetaTile>
                      {compact ? null : (
                        <ListMetaTile label="Onboarding">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${onboardingStatus.className}`}
                          >
                            {onboardingStatus.label}
                          </span>
                        </ListMetaTile>
                      )}
                    </div>

                    {compact ? (
                      <ListMetaTile label="Créé le">
                        {formatDate(profile.createdAt)}
                      </ListMetaTile>
                    ) : (
                      <div className="space-y-3">
                        <AdminRoleForm
                          currentRole={profile.role}
                          userId={profile.id}
                        />
                        <AdminUserOnboardingActions userId={profile.id} />
                      </div>
                    )}
                  </ListPanelRow>
                );
              })}
            </ListPanelBody>
          </ListPanel>
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
      <div className="p-4 sm:p-6">
        {coaches.length ? (
          <ListPanel
            countLabel={`${coaches.length} coach(s)`}
            description="Charge de cohortes et dernière activité par coach."
            icon={GraduationCap}
            title="Liste des coachs"
          >
            <ListPanelBody>
              {coaches.map((coach) => (
                <ListPanelRow
                  className="lg:grid-cols-[minmax(0,1fr)_180px_190px]"
                  key={coach.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-base font-semibold text-slate-950">
                        {coach.fullName}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {coach.email}
                      </p>
                    </div>
                  </div>
                  <ListMetaTile label="Cohortes responsables">
                    {cohorts.filter((cohort) => cohort.coachId === coach.id).length}
                  </ListMetaTile>
                  <ListMetaTile label="Dernière connexion">
                    {formatDate(coach.lastSignInAt)}
                  </ListMetaTile>
                </ListPanelRow>
              ))}
            </ListPanelBody>
          </ListPanel>
        ) : (
          <EmptyState
            description="Aucun utilisateur n'a encore le rôle coach."
            icon={GraduationCap}
            title="Aucun coach"
          />
        )}
      </div>
    </>
  );
}

export function AdminCohortsPage({
  cohorts,
  loadError,
  users,
}: {
  cohorts: AdminCohort[];
  loadError?: string;
  users: AdminUser[];
}) {
  const coaches = users.filter((profile) => profile.role === "coach");
  const coachees = users.filter((profile) => profile.role === "coachee");

  return (
    <>
      <PageHeader
        actions={
          <a
            className={buttonVariants()}
            href="#admin-new-cohort"
          >
            <Layers3 className="h-4 w-4" />
            Nouvelle cohorte
          </a>
        }
        description="Création, coach responsable, membres et suivi opérationnel des cohortes."
        title="Cohortes"
      />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[380px_1fr]">
        {loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm shadow-rose-950/[0.04] ring-1 ring-white xl:col-span-2">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Chargement partiel des cohortes
                </p>
                <p className="mt-1 leading-6">{loadError}</p>
              </div>
            </div>
          </div>
        ) : null}
        <Card
          className="overflow-hidden xl:sticky xl:top-24 xl:self-start"
          id="admin-new-cohort"
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                <Layers3 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <CardTitle>Nouvelle cohorte</CardTitle>
                <CardDescription>
                  Créez la cohorte avec son coach responsable dès le départ.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="p-5">
            <AdminCohortCreateForm coaches={coaches} />
          </div>
        </Card>

        {cohorts.length ? (
          <ListPanel
            className="min-w-0"
            countLabel={`${cohorts.length} cohorte(s)`}
            description="Vue opérationnelle des responsables, membres, dates et actions."
            icon={Layers3}
            title="Cohortes existantes"
          >
            <ListPanelBody>
              {cohorts.map((cohort) => {
                const memberIds = new Set(
                  cohort.members.map((member) => member.id),
                );
                const availableCoachees = coachees.filter(
                  (coachee) => !memberIds.has(coachee.id),
                );

                return (
                  <ListPanelRow
                    className="block p-5 hover:bg-sky-50/25 [contain-intrinsic-size:380px]"
                    key={cohort.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-lg font-semibold">
                          {cohort.name}
                        </p>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                          {cohort.description}
                        </p>
                      </div>
                      <AdminCohortDeleteForm cohort={cohort} />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ListMetaTile label="Coach">
                        {cohort.coachName}
                      </ListMetaTile>
                      <ListMetaTile label="Membres">
                        {cohort.memberCount}
                      </ListMetaTile>
                      <ListMetaTile label="Assignations">
                        {cohort.assignmentCount}
                      </ListMetaTile>
                      <ListMetaTile label="Dates">
                        {formatCohortDate(cohort.startDate)} →{" "}
                        {formatCohortDate(cohort.endDate)}
                      </ListMetaTile>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs text-slate-500">
                        <span>Progression</span>
                        <span>{cohort.progress}%</span>
                      </div>
                      <ProgressBar value={cohort.progress} />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <DisclosurePanel
                        description="Nom, coach responsable, période et description."
                        title="Modifier la cohorte"
                      >
                        <AdminCohortEditForm
                          coaches={coaches}
                          cohort={cohort}
                        />
                      </DisclosurePanel>

                      <DisclosurePanel
                        description={`${cohort.memberCount} membre(s) dans cette cohorte.`}
                        title="Gérer les coachés"
                      >
                        <div className="space-y-4">
                          <AdminCohortMemberForm
                            cohortId={cohort.id}
                            options={availableCoachees}
                          />
                          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white ring-1 ring-white">
                            {cohort.members.length ? (
                              cohort.members.map((member) => (
                                <div
                                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"
                                  key={member.id}
                                >
                                  <div className="min-w-0">
                                    <p className="break-words text-sm font-medium text-slate-800">
                                      {member.fullName}
                                    </p>
                                    <p className="mt-1 break-all text-xs text-slate-500">
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
                      </DisclosurePanel>
                    </div>
                  </ListPanelRow>
                );
              })}
            </ListPanelBody>
          </ListPanel>
        ) : (
          <EmptyState
            description="Créez une première cohorte avec un coach responsable et ajoutez les coachés concernés."
            icon={Layers3}
            title="Aucune cohorte"
          />
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
      <div className="space-y-6 p-4 sm:p-6">
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
        <section className="grid gap-4 lg:grid-cols-3">
          {panels.map((panel) => {
            const visualValue = Math.min(100, Math.max(8, panel.value));

            return (
              <Card className="overflow-hidden" key={panel.label}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {panel.label}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Indicateur agrégé sur les données Supabase disponibles.
                      </p>
                    </div>
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-white">
                      {formatPercent(panel.value)}
                    </span>
                  </div>
                  <div className="mt-5 h-32 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 ring-1 ring-white">
                    <div className="flex h-full items-end rounded-xl bg-white px-4 pb-4 ring-1 ring-slate-200/80">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-sky-700 via-blue-500 to-emerald-400 transition-all"
                        style={{ height: `${visualValue}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-600 via-blue-500 to-emerald-400"
                      style={{ width: `${Math.min(100, panel.value)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </>
  );
}
