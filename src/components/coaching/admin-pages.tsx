import { BarChart3, GraduationCap, UsersRound } from "lucide-react";
import { cohorts, profiles, quizAttempts } from "@/lib/demo-data";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatPercent } from "@/utils/format";

export function AdminDashboard() {
  const coaches = profiles.filter((profile) => profile.role === "coach");
  const coachees = profiles.filter((profile) => profile.role === "coachee");
  const average =
    quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
    quizAttempts.length;

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
            value={String(coaches.length)}
          />
          <StatCard
            helper="Comptes coachés actifs"
            icon={UsersRound}
            label="Coachés"
            value={String(coachees.length)}
          />
          <StatCard
            helper="Moyenne globale"
            icon={BarChart3}
            label="Score quiz"
            value={formatPercent(average)}
          />
        </section>
        <AdminUsersPage compact />
      </div>
    </>
  );
}

export function AdminUsersPage({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {compact ? null : (
        <PageHeader
          description="Gestion des comptes et rôles utilisateurs."
          title="Utilisateurs"
        />
      )}
      <div className={compact ? "" : "p-6"}>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {profiles.map((profile) => (
              <div
                className="grid gap-3 p-5 md:grid-cols-[1fr_120px_180px]"
                key={profile.id}
              >
                <div>
                  <p className="font-medium">{profile.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
                </div>
                <p className="capitalize text-sm font-medium text-slate-600">
                  {profile.role}
                </p>
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                  type="button"
                >
                  Modifier le rôle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminCoachesPage() {
  const coaches = profiles.filter((profile) => profile.role === "coach");
  return (
    <>
      <PageHeader
        description="Liste des coachs et charge de cohortes."
        title="Coachs"
      />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        {coaches.map((coach) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={coach.id}
          >
            <p className="text-lg font-semibold">{coach.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">{coach.email}</p>
            <p className="mt-4 text-sm text-slate-600">
              Cohortes responsables :{" "}
              {cohorts.filter((cohort) => cohort.coachId === coach.id).length}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

export function AdminCohortsPage() {
  return (
    <>
      <PageHeader
        description="Progression globale des cohortes et scores moyens."
        title="Cohortes"
      />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        {cohorts.map((cohort) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={cohort.id}
          >
            <p className="text-lg font-semibold">{cohort.name}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {cohort.description}
            </p>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Progression</span>
                <span>{cohort.progress}%</span>
              </div>
              <ProgressBar value={cohort.progress} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function AdminStatsPage() {
  return (
    <>
      <PageHeader
        description="Statistiques globales prêtes pour des graphiques réels Supabase."
        title="Statistiques globales"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {["Taux de complétion", "Retards", "Scores quiz"].map((label, index) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <p className="font-semibold">{label}</p>
            <div className="mt-6 flex h-48 items-end gap-2">
              {[42, 70, 54, 82, 66, 90].map((value) => (
                <div
                  className="flex-1 rounded-t-lg bg-slate-950"
                  key={`${label}-${value}`}
                  style={{ height: `${Math.max(24, value - index * 8)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
