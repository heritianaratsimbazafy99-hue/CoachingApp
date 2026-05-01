"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SendHorizonal } from "lucide-react";
import { createAssignmentAction } from "@/app/coach/assignments/actions";
import type { CreateAssignmentState } from "@/app/coach/assignments/actions";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
import type { CoachAssignmentComposerData } from "@/services/coach-service";
import { cn } from "@/utils/cn";
import { contentTypeLabel } from "@/utils/format";

const initialCreateAssignmentState: CreateAssignmentState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
      disabled={pending}
      type="submit"
    >
      <SendHorizonal className="h-4 w-4" />
      {pending ? "Création..." : "Créer l'assignation"}
    </button>
  );
}

export function AssignmentComposerForm({
  data,
  initialTarget,
}: {
  data: CoachAssignmentComposerData;
  initialTarget?: string;
}) {
  const [state, formAction] = useActionState(
    createAssignmentAction,
    initialCreateAssignmentState,
  );
  const targetValues = new Set([
    ...data.coachees.map((coachee) => `coachee:${coachee.id}`),
    ...data.cohorts.map((cohort) => `cohort:${cohort.id}`),
  ]);
  const targetDefaultValue =
    initialTarget && targetValues.has(initialTarget) ? initialTarget : "";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <Card className="overflow-hidden">
      <form action={formAction} className="grid gap-0 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className={labelClassName}>Titre</span>
            <input
              className={inputClassName()}
              name="title"
              placeholder="Ex : Module posture + quiz"
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Description courte</span>
            <input
              className={inputClassName()}
              name="description"
              placeholder="Objectif de l'assignation"
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Instructions</span>
            <textarea
              className={textareaClassName("min-h-36")}
              name="instructions"
              placeholder="Message visible côté coaché"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Contenu</span>
              <select className={inputClassName()} name="contentId">
                <option value="">Aucun contenu</option>
                {data.contents.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title} · {contentTypeLabel[content.type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClassName}>Quiz</span>
              <select className={inputClassName()} name="quizId">
                <option value="">Aucun quiz</option>
                {data.quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <aside className="space-y-5 border-t border-slate-100 bg-slate-50/80 p-5 ring-1 ring-white sm:p-6 lg:border-l lg:border-t-0">
          <label className="block">
            <span className={labelClassName}>Cible</span>
            <select
              className={inputClassName()}
              defaultValue={targetDefaultValue}
              name="target"
              required
            >
              <option value="">Choisir une cible</option>
              {data.coachees.map((coachee) => (
                <option key={coachee.id} value={`coachee:${coachee.id}`}>
                  Coaché : {coachee.fullName}
                </option>
              ))}
              {data.cohorts.map((cohort) => (
                <option key={cohort.id} value={`cohort:${cohort.id}`}>
                  Cohorte : {cohort.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Deadline</span>
            <input
              className={inputClassName()}
              min={minDate}
              name="deadline"
              required
              type="date"
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Priorité</span>
            <select
              className={inputClassName()}
              defaultValue="normal"
              name="priority"
            >
              <option value="normal">Normale</option>
              <option value="high">Importante</option>
            </select>
          </label>

          <FormStatusMessage message={state.message} status={state.status} />

          <SubmitButton />
        </aside>
      </form>
    </Card>
  );
}
