import Link from "next/link";
import { MessageCircle, NotebookPen, Send, UserRound } from "lucide-react";
import {
  assignmentProgress,
  assignments,
  coachNotes,
  getProfile,
  profiles,
  quizAttempts,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatPercent } from "@/utils/format";

export function CoacheesPage() {
  const coachees = profiles.filter((profile) => profile.role === "coachee");

  return (
    <>
      <PageHeader
        description="Liste des coachés avec progression, scores, retards et actions rapides."
        title="Mes coachés"
      />
      <div className="p-6">
        <div className="grid gap-4">
          {coachees.map((coachee) => {
            const progress = assignmentProgress.filter(
              (item) => item.userId === coachee.id,
            );
            const completed = progress.filter(
              (item) => item.status === "completed",
            ).length;
            const percentage = progress.length
              ? Math.round((completed / progress.length) * 100)
              : 0;
            const attempts = quizAttempts.filter(
              (attempt) => attempt.userId === coachee.id,
            );
            const average = attempts.length
              ? attempts.reduce((sum, item) => sum + item.percentage, 0) /
                attempts.length
              : 0;

            return (
              <article
                className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_220px_140px_260px]"
                key={coachee.id}
              >
                <div>
                  <Link
                    className="text-lg font-semibold hover:underline"
                    href={`/coach/coachees/${coachee.id}`}
                  >
                    {coachee.fullName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{coachee.email}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Dernière connexion : {formatDateTime(coachee.lastActiveAt)}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Progression</span>
                    <span>{percentage}%</span>
                  </div>
                  <ProgressBar value={percentage} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Score moyen</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatPercent(average)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton message={`Message préparé pour ${coachee.fullName}`}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </ActionButton>
                  <ActionButton message={`Relance envoyée à ${coachee.fullName}`}>
                    <Send className="mr-2 h-4 w-4" />
                    Relancer
                  </ActionButton>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function CoacheeProfilePage({ id }: { id: string }) {
  const coachee = getProfile(id);
  const progress = assignmentProgress.filter((item) => item.userId === id);
  const attempts = quizAttempts.filter((attempt) => attempt.userId === id);
  const notes = coachNotes.filter((note) => note.coacheeId === id);

  if (!coachee) {
    return (
      <>
        <PageHeader
          description="Le coaché demandé n'existe pas dans les données démo."
          title="Coaché introuvable"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <ActionButton message={`Rendez-vous planifié avec ${coachee.fullName}`}>
            Planifier un rendez-vous
          </ActionButton>
        }
        description="Profil détaillé, assignations, scores, notes privées et historique."
        title={coachee.fullName}
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <UserRound className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <p className="font-semibold">{coachee.fullName}</p>
                <p className="text-sm text-slate-500">{coachee.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold">Progression individuelle</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {progress.map((item) => {
                const assignment = assignments.find(
                  (candidate) => candidate.id === item.assignmentId,
                );

                return (
                  <div
                    className="grid gap-3 p-5 md:grid-cols-[1fr_140px]"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium">{assignment?.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {assignment?.description}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold">Résultats quiz</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {attempts.map((attempt) => (
                <div className="grid gap-3 p-5 md:grid-cols-[1fr_120px_120px]" key={attempt.id}>
                  <p className="font-medium">{attempt.quizId}</p>
                  <p className="text-sm font-semibold">{attempt.percentage}%</p>
                  <StatusBadge status={attempt.status} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">Notes privées coach</h2>
            </div>
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <p
                  className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                  key={note.id}
                >
                  {note.note}
                </p>
              ))}
            </div>
            <textarea
              className="mt-4 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ajouter une note privée..."
            />
            <div className="mt-3">
              <ActionButton message="Note enregistrée" variant="primary">
                Enregistrer la note
              </ActionButton>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
