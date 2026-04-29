import { Download, GripVertical, Plus } from "lucide-react";
import { getQuiz, profiles, quizAttempts, quizzes } from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { quizAttemptStatusLabel } from "@/utils/format";

export function QuizBuilderPage({ quizId }: { quizId?: string }) {
  const quiz = getQuiz(quizId ?? "quiz-1");

  return (
    <>
      <PageHeader
        description="Construisez les questions, points, bonnes réponses et explications."
        title={quiz ? `Modifier : ${quiz.title}` : "Créer un quiz"}
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {(quiz?.questions ?? []).map((question) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={question.id}
            >
              <div className="flex items-start gap-3">
                <GripVertical className="mt-1 h-5 w-5 text-slate-300" />
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Question {question.position} · {question.points} points
                  </p>
                  <h2 className="mt-2 font-semibold">{question.questionText}</h2>
                  <div className="mt-4 space-y-2">
                    {question.options.length ? (
                      question.options.map((option) => (
                        <div
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          key={option.id}
                        >
                          <span>{option.optionText}</span>
                          {option.isCorrect ? (
                            <span className="text-xs font-medium text-emerald-700">
                              Bonne réponse
                            </span>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                        Question ouverte avec correction manuelle.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
          <ActionButton message="Question ajoutée">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une question
          </ActionButton>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Paramètres quiz</h2>
          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-700">Titre</span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue={quiz?.title}
            />
          </label>
          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-700">
              Score minimum (%)
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
              defaultValue={quiz?.passingScore}
              type="number"
            />
          </label>
          <div className="mt-5">
            <ActionButton message="Quiz enregistré" variant="primary">
              Enregistrer le quiz
            </ActionButton>
          </div>
        </aside>
      </div>
    </>
  );
}

export function QuizResultsPage() {
  return (
    <>
      <PageHeader
        actions={
          <ActionButton message="Export CSV généré">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </ActionButton>
        }
        description="Scores, statuts, corrections et feedbacks par coaché."
        title="Résultats quiz"
      />
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {quizAttempts.map((attempt) => {
              const profile = profiles.find(
                (candidate) => candidate.id === attempt.userId,
              );
              const quiz = quizzes.find((candidate) => candidate.id === attempt.quizId);
              return (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_180px_120px_140px]"
                  key={attempt.id}
                >
                  <div>
                    <p className="font-medium">{profile?.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">{quiz?.title}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {attempt.scoreObtained}/{attempt.scoreMax} points
                  </p>
                  <p className="text-sm font-semibold">{attempt.percentage}%</p>
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

export function CorrectionsPage() {
  const pending = quizAttempts.filter(
    (attempt) => attempt.status === "pending_correction",
  );

  return (
    <>
      <PageHeader
        description="Corrigez les questions ouvertes, attribuez des points et ajoutez un feedback."
        title="Corrections ouvertes"
      />
      <div className="space-y-4 p-6">
        {pending.map((attempt) => {
          const profile = profiles.find((item) => item.id === attempt.userId);
          return (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={attempt.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{profile?.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Statut : {quizAttemptStatusLabel[attempt.status]}
                  </p>
                </div>
                <StatusBadge status={attempt.status} />
              </div>
              <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Réponse ouverte démo : “Je dois clarifier mon intention avant
                chaque rendez-vous.”
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr_auto]">
                <input
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Points"
                  type="number"
                />
                <input
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Feedback coach"
                />
                <ActionButton message="Correction enregistrée" variant="primary">
                  Corriger
                </ActionButton>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
