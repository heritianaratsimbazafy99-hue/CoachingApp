"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, PlusCircle, Save } from "lucide-react";
import {
  addQuizQuestionAction,
  saveQuizAction,
} from "@/app/coach/quizzes/actions";
import type { FormState } from "@/app/coach/quizzes/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
import type { CoachQuizEditorData } from "@/services/coach-service";
import type { QuestionType } from "@/types/coaching";
import { cn } from "@/utils/cn";
import { contentTypeLabel } from "@/utils/format";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  tone?: "emerald" | "slate";
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Choix multiple",
  open: "Réponse ouverte",
  single_choice: "Choix unique",
};

const initialFormState: FormState = {
  message: "",
  status: "idle",
};

function SubmitButton({
  label,
  pendingLabel,
  tone = "slate",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = tone === "emerald" ? PlusCircle : Save;

  return (
    <button
      className={cn(
        buttonVariants({
          size: "lg",
          variant: tone === "emerald" ? "soft" : "primary",
        }),
        "w-full",
        tone === "emerald"
          ? "border-indigo-100 bg-indigo-50 text-indigo-800 hover:border-indigo-200 hover:bg-indigo-100"
          : "",
      )}
      disabled={pending}
      type="submit"
    >
      <Icon className="h-4 w-4" />
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormMessage({
  message,
  status,
}: {
  message: string;
  status: "error" | "idle" | "success";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium",
        status === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {message}
    </p>
  );
}

export function QuizEditorForm({ data }: { data: CoachQuizEditorData }) {
  const [saveState, saveFormAction] = useActionState(
    saveQuizAction,
    initialFormState,
  );
  const [questionState, questionFormAction] = useActionState(
    addQuizQuestionAction,
    initialFormState,
  );
  const [questionType, setQuestionType] =
    useState<QuestionType>("single_choice");
  const isOpenQuestion = questionType === "open";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <form action={saveFormAction} className="p-5 sm:p-6">
          <input name="quizId" type="hidden" value={data.quiz?.id ?? ""} />
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className={labelClassName}>Titre</span>
              <input
                className={inputClassName()}
                defaultValue={data.quiz?.title}
                name="title"
                placeholder="Ex : Fondamentaux de posture"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className={labelClassName}>Description</span>
              <textarea
                className={textareaClassName()}
                defaultValue={data.quiz?.description}
                name="description"
                placeholder="Ce quiz valide les notions clés du module."
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Contenu lié</span>
              <select
                className={inputClassName()}
                defaultValue={data.quiz?.contentId ?? ""}
                name="contentId"
              >
                <option value="">Sans contenu lié</option>
                {data.contents.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title} · {contentTypeLabel[content.type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClassName}>Score minimum (%)</span>
              <input
                className={inputClassName()}
                defaultValue={data.quiz?.passingScore ?? 70}
                max={100}
                min={0}
                name="passingScore"
                type="number"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
            <FormMessage message={saveState.message} status={saveState.status} />
            <SubmitButton
              label="Enregistrer le quiz"
              pendingLabel="Enregistrement..."
            />
          </div>
        </form>
      </Card>

      {data.quiz ? (
        <Card className="overflow-hidden">
          <form action={questionFormAction}>
            <input name="quizId" type="hidden" value={data.quiz.id} />
            <CardHeader className="bg-sky-50/60">
              <div className="flex items-center gap-2 text-sky-800">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle className="text-sm">Nouvelle question</CardTitle>
              </div>
              <CardDescription>
                Ajoute une question sans quitter l&apos;éditeur du quiz.
              </CardDescription>
            </CardHeader>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className={labelClassName}>Type</span>
                <select
                  className={inputClassName()}
                  name="questionType"
                  onChange={(event) =>
                    setQuestionType(event.target.value as QuestionType)
                  }
                  value={questionType}
                >
                  {Object.entries(questionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClassName}>Question</span>
                <textarea
                  className={textareaClassName("min-h-24")}
                  name="questionText"
                  placeholder="Que doit maîtriser le coaché ?"
                  required
                />
              </label>

              <label className="block">
                <span className={labelClassName}>Points</span>
                <input
                  className={inputClassName()}
                  defaultValue={1}
                  min={0}
                  name="points"
                  type="number"
                />
              </label>

              <label className="block">
                <span className={labelClassName}>Options</span>
                <textarea
                  className={textareaClassName()}
                  disabled={isOpenQuestion}
                  name="options"
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </label>

              <label className="block">
                <span className={labelClassName}>Bonnes réponses</span>
                <input
                  className={inputClassName()}
                  disabled={isOpenQuestion}
                  name="correctOptions"
                  placeholder="1 ou 1,3"
                />
              </label>

              <label className="block">
                <span className={labelClassName}>Explication</span>
                <textarea
                  className={textareaClassName("min-h-20")}
                  name="explanation"
                  placeholder="Feedback affichable après correction"
                />
              </label>

              <FormMessage
                message={questionState.message}
                status={questionState.status}
              />
              <SubmitButton
                label="Ajouter la question"
                pendingLabel="Ajout..."
                tone="emerald"
              />
            </div>
          </form>
        </Card>
      ) : (
        <Card className="border-dashed p-5 text-sm leading-6 text-slate-600">
          Enregistre le quiz une première fois pour ajouter ses questions.
        </Card>
      )}
    </div>
  );
}
