import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import {
  getCoacheeAssignments,
  getContent,
  getQuiz,
  quizAttempts,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/format";
import { QuizRunner } from "@/components/coaching/quiz-runner";

const demoUserId = "coachee-1";

export function CoacheeTasksPage() {
  const tasks = getCoacheeAssignments(demoUserId);

  return (
    <>
      <PageHeader
        description="Vos contenus, quiz, deadlines et retards au même endroit."
        title="Mes tâches"
      />
      <div className="space-y-4 p-6">
        {tasks.length ? (
          tasks.map((task) => {
            const content = task.contentId ? getContent(task.contentId) : null;
            return (
              <article
                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_130px_140px]"
                key={task.id}
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {task.instructions}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Deadline {formatDate(task.deadline)}
                  </p>
                </div>
                <StatusBadge status={task.status} />
                <Link
                  className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white"
                  href={
                    content ? `/coachee/contents/${content.id}` : `/coachee/quiz/${task.quizId}`
                  }
                >
                  Commencer
                </Link>
              </article>
            );
          })
        ) : (
          <EmptyState
            description="Votre coach n'a pas encore assigné de contenu ou quiz."
            icon={BookOpen}
            title="Aucune tâche"
          />
        )}
      </div>
    </>
  );
}

export function ContentReaderPage({ id }: { id: string }) {
  const content = getContent(id);
  const quiz = content?.quizId ? getQuiz(content.quizId) : null;

  if (!content) {
    return (
      <PageHeader
        description="Ce contenu n'existe pas dans les données démo."
        title="Contenu introuvable"
      />
    );
  }

  return (
    <>
      <PageHeader description={content.description} title={content.title} />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="prose prose-slate max-w-none">
            <p className="text-lg leading-8 text-slate-700">{content.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton message="Contenu marqué comme terminé" variant="primary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marquer comme terminé
            </ActionButton>
            {quiz ? (
              <Link
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                href={`/coachee/quiz/${quiz.id}`}
              >
                Passer au quiz
              </Link>
            ) : null}
          </div>
        </article>
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Progression</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>1. Lire le contenu</p>
            <p>2. Marquer comme terminé</p>
            <p>3. Passer au quiz associé</p>
            <p>4. Voir votre score</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export function QuizPage({ id }: { id: string }) {
  const quiz = getQuiz(id);

  if (!quiz) {
    return (
      <PageHeader
        description="Ce quiz n'existe pas dans les données démo."
        title="Quiz introuvable"
      />
    );
  }

  return <QuizRunner quiz={quiz} />;
}

export function CoacheeResultsPage() {
  const attempts = quizAttempts.filter((attempt) => attempt.userId === demoUserId);

  return (
    <>
      <PageHeader
        description="Vos scores, pourcentages, statuts et feedbacks coach."
        title="Mes scores"
      />
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {attempts.map((attempt) => {
              const quiz = getQuiz(attempt.quizId);
              return (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_140px_140px]"
                  key={attempt.id}
                >
                  <div>
                    <p className="font-medium">{quiz?.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attempt.scoreObtained}/{attempt.scoreMax} points
                    </p>
                  </div>
                  <p className="text-2xl font-semibold">{attempt.percentage}%</p>
                  <StatusBadge status={attempt.status} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function CoacheeProfilePage() {
  return (
    <>
      <PageHeader
        description="Vos informations de compte et préférences."
        title="Mon profil"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Informations personnelles</h2>
          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue="Aina Rakoto"
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue="aina@coaching.test"
            />
            <ActionButton message="Profil enregistré" variant="primary">
              Enregistrer
            </ActionButton>
          </div>
        </section>
      </div>
    </>
  );
}
