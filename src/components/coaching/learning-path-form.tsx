"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Check,
  Plus,
  Save,
  X,
} from "lucide-react";
import {
  createLearningPathAction,
  updateLearningPathAction,
  type LearningPathActionState,
} from "@/app/coach/paths/actions";
import type {
  CoachLearningPathData,
  LearningPathItemOption,
} from "@/services/learning-path-service";
import { cn } from "@/utils/cn";

const initialLearningPathActionState: LearningPathActionState = {
  message: "",
  status: "idle",
};

type LearningPathFormProps = {
  cohorts: CoachLearningPathData["cohorts"];
  defaultValues?: {
    cohortId: string;
    description: string;
    id: string;
    items: string[];
    title: string;
  };
  itemOptions: CoachLearningPathData["itemOptions"];
  mode?: "create" | "edit";
};

function SubmitButton({
  disabled,
  mode,
}: {
  disabled: boolean;
  mode: "create" | "edit";
}) {
  const { pending } = useFormStatus();
  const Icon = mode === "edit" ? Save : Plus;

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <Icon className="h-4 w-4" />
      {pending
        ? mode === "edit"
          ? "Enregistrement..."
          : "Création..."
        : mode === "edit"
          ? "Enregistrer le parcours"
          : "Créer le parcours"}
    </button>
  );
}

function KindBadge({ item }: { item: LearningPathItemOption }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        item.kind === "content"
          ? "border-sky-100 bg-sky-50 text-sky-700"
          : "border-indigo-100 bg-indigo-50 text-indigo-700",
      )}
    >
      {item.kind === "content" ? "Contenu" : "Quiz"}
    </span>
  );
}

function OptionRow({
  disabled,
  isSelected,
  item,
  onAdd,
}: {
  disabled: boolean;
  isSelected: boolean;
  item: LearningPathItemOption;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-sky-100 bg-white p-3 transition hover:border-sky-200 hover:bg-sky-50/50">
      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{item.label}</span>
          <KindBadge item={item} />
        </span>
        <span className="mt-1 block text-xs text-slate-500">{item.meta}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
          {item.description}
        </span>
      </div>
      <button
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed",
          isSelected
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100",
        )}
        disabled={disabled || isSelected}
        onClick={onAdd}
        title={isSelected ? "Déjà ajouté" : "Ajouter au parcours"}
        type="button"
      >
        {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
    </div>
  );
}

function OrderedItemRow({
  canMoveDown,
  canMoveUp,
  item,
  onMoveDown,
  onMoveUp,
  onRemove,
  position,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  item: LearningPathItemOption;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  position: number;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[36px_1fr_auto] sm:items-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-500">
        {position}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-950">
            {item.label}
          </p>
          <KindBadge item={item} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          title="Monter"
          type="button"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          title="Descendre"
          type="button"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
          onClick={onRemove}
          title="Retirer"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function LearningPathForm({
  cohorts,
  defaultValues,
  itemOptions,
  mode = "create",
}: LearningPathFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedItems, setSelectedItems] = useState(defaultValues?.items ?? []);
  const action =
    mode === "edit" ? updateLearningPathAction : createLearningPathAction;
  const [state, formAction] = useActionState(
    action,
    initialLearningPathActionState,
  );
  const itemByValue = useMemo(
    () => new Map(itemOptions.map((item) => [item.value, item])),
    [itemOptions],
  );
  const selectedOptions = selectedItems
    .map((value) => itemByValue.get(value))
    .filter(Boolean) as LearningPathItemOption[];
  const canSave = cohorts.length > 0 && itemOptions.length > 0 && selectedItems.length > 0;

  useEffect(() => {
    if (state.status === "success" && mode === "create") {
      formRef.current?.reset();
      const resetId = window.setTimeout(() => setSelectedItems([]), 0);

      return () => window.clearTimeout(resetId);
    }
  }, [mode, state.status]);

  function addItem(value: string) {
    setSelectedItems((current) =>
      current.includes(value) ? current : [...current, value],
    );
  }

  function removeItem(value: string) {
    setSelectedItems((current) => current.filter((item) => item !== value));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setSelectedItems((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);

      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      {mode === "edit" && defaultValues ? (
        <input name="pathId" type="hidden" value={defaultValues.id} />
      ) : null}
      {selectedItems.map((value) => (
        <input key={value} name="items" type="hidden" value={value} />
      ))}

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Titre</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          defaultValue={defaultValues?.title}
          disabled={!cohorts.length}
          name="title"
          placeholder="Ex : Parcours onboarding leadership"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Cohorte</span>
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          defaultValue={defaultValues?.cohortId ?? ""}
          disabled={!cohorts.length}
          name="cohortId"
          required
        >
          <option value="">Choisir une cohorte</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          defaultValue={defaultValues?.description}
          disabled={!cohorts.length}
          name="description"
          placeholder="Objectif du parcours, rythme, consignes..."
        />
      </label>

      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-sky-700" />
          <p className="text-sm font-semibold text-slate-900">
            Bibliothèque disponible
          </p>
        </div>
        <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {itemOptions.length ? (
            itemOptions.map((item) => (
              <OptionRow
                disabled={!cohorts.length}
                isSelected={selectedItems.includes(item.value)}
                item={item}
                key={item.value}
                onAdd={() => addItem(item.value)}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-sky-200 bg-white p-4 text-sm leading-6 text-slate-500">
              Créez au moins un contenu ou un quiz avant de composer un parcours.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Ordre du parcours</p>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {selectedItems.length} étape(s)
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {selectedOptions.length ? (
            selectedOptions.map((item, index) => (
              <OrderedItemRow
                canMoveDown={index < selectedOptions.length - 1}
                canMoveUp={index > 0}
                item={item}
                key={item.value}
                onMoveDown={() => moveItem(index, 1)}
                onMoveUp={() => moveItem(index, -1)}
                onRemove={() => removeItem(item.value)}
                position={index + 1}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Ajoutez des contenus ou quiz depuis la bibliothèque pour composer
              l&apos;ordre exact du parcours.
            </p>
          )}
        </div>
      </div>

      {state.message ? (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton disabled={!canSave} mode={mode} />
    </form>
  );
}
