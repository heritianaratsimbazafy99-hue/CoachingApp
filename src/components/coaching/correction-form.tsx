"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { saveCorrectionAction } from "@/app/coach/quizzes/actions";
import type { FormState } from "@/app/coach/quizzes/actions";
import { buttonVariants } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { inputClassName, labelClassName } from "@/components/ui/form-field";
import type { CoachCorrectionItem } from "@/services/coach-service";
import { cn } from "@/utils/cn";

const initialFormState: FormState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}
      disabled={pending}
      type="submit"
    >
      <Check className="h-4 w-4" />
      {pending ? "Correction..." : "Valider"}
    </button>
  );
}

export function CorrectionForm({ item }: { item: CoachCorrectionItem }) {
  const [state, formAction] = useActionState(
    saveCorrectionAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input name="answerId" type="hidden" value={item.answerId} />
      <input name="attemptId" type="hidden" value={item.attemptId} />

      <div className="grid gap-4 md:grid-cols-[160px_1fr_auto]">
        <label className="block">
          <span className={labelClassName}>Points</span>
          <input
            className={inputClassName()}
            defaultValue={item.pointsObtained}
            max={item.pointsMax}
            min={0}
            name="pointsObtained"
            step="0.5"
            type="number"
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Feedback coach</span>
          <input
            className={inputClassName()}
            defaultValue={item.coachFeedback}
            name="coachFeedback"
            placeholder="Feedback court pour le coaché"
          />
        </label>

        <div className="flex items-end">
          <SubmitButton />
        </div>
      </div>

      <FormStatusMessage message={state.message} status={state.status} />
    </form>
  );
}
