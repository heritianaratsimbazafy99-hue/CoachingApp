import Link from "next/link";
import {
  BookOpenCheck,
  FileText,
  GraduationCap,
  Layers3,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { deleteLearningPathAction } from "@/app/coach/paths/actions";
import { LearningPathForm } from "@/components/coaching/learning-path-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CoachLearningPath,
  CoachLearningPathData,
  CoacheeLearningPathData,
  LearningPathItem,
} from "@/services/learning-path-service";
import { contentTypeLabel, formatDate } from "@/utils/format";

function ItemBadge({ item }: { item: LearningPathItem }) {
  if (item.kind === "quiz") {
    return (
      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
        Quiz
      </span>
    );
  }

  return (
    <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
      {item.type ? contentTypeLabel[item.type] : "Contenu"}
    </span>
  );
}

function LearningPathItemRow({
  item,
  variant,
}: {
  item: LearningPathItem;
  variant: "coach" | "coachee";
}) {
  const content = (
    <div className="grid gap-3 rounded-xl border border-sky-100 bg-white p-3 sm:grid-cols-[44px_1fr_auto] sm:items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
        {item.kind === "quiz" ? (
          <ListChecks className="h-5 w-5" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-950">{item.label}</p>
          <ItemBadge item={item} />
          {item.status === "draft" ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              Brouillon
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {item.description}
        </p>
      </div>
      <span className="text-sm font-semibold text-slate-400">
        #{item.position}
      </span>
    </div>
  );

  if (variant === "coach" || item.label.includes("indisponible")) {
    return content;
  }

  return (
    <Link className="block transition hover:scale-[1.005]" href={item.href}>
      {content}
    </Link>
  );
}

function LearningPathCard({
  path,
  variant,
}: {
  path: CoachLearningPath;
  variant: "coach" | "coachee";
}) {
  return (
    <article className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-sky-700">
            {path.cohortName}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {path.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {path.description}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            Créé le {formatDate(path.createdAt)} · {path.itemCount} étape(s)
          </p>
        </div>

        {variant === "coach" ? (
          <form action={deleteLearningPathAction}>
            <input name="pathId" type="hidden" value={path.id} />
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
              title="Supprimer le parcours"
              type="submit"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        {path.items.length ? (
          path.items.map((item) => (
            <LearningPathItemRow item={item} key={item.id} variant={variant} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-sky-200 bg-sky-50/60 p-4 text-sm text-slate-500">
            Aucune étape dans ce parcours.
          </p>
        )}
      </div>
    </article>
  );
}

export function CoachLearningPathsPage({
  data,
}: {
  data: CoachLearningPathData;
}) {
  return (
    <>
      <PageHeader
        actions={
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href="#new-path"
          >
            <Plus className="h-4 w-4" />
            Nouveau parcours
          </a>
        }
        description="Composez des séquences pédagogiques avec contenus et quiz pour vos cohortes."
        title="Parcours"
      />

      <div className="grid gap-6 p-6 xl:grid-cols-[420px_1fr]">
        <section
          className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5"
          id="new-path"
        >
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Séquence cohorte
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Nouveau parcours
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              L&apos;ordre des éléments suit l&apos;ordre des cases cochées dans
              le formulaire.
            </p>
          </div>
          <LearningPathForm
            cohorts={data.cohorts}
            itemOptions={data.itemOptions}
          />
        </section>

        <section className="space-y-4">
          {data.paths.length ? (
            data.paths.map((path) => (
              <LearningPathCard key={path.id} path={path} variant="coach" />
            ))
          ) : (
            <EmptyState
              action={
                <a
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                  href="#new-path"
                >
                  <Plus className="h-4 w-4" />
                  Créer un parcours
                </a>
              }
              description="Créez un parcours pour guider une cohorte dans un ordre clair."
              icon={BookOpenCheck}
              title="Aucun parcours"
            />
          )}
        </section>
      </div>
    </>
  );
}

export function CoacheeLearningPathsPage({
  data,
}: {
  data: CoacheeLearningPathData;
}) {
  return (
    <>
      <PageHeader
        description="Vos parcours regroupent les contenus et quiz importants dans l'ordre conseillé."
        title="Mes parcours"
      />

      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Séquences visibles"
            icon={GraduationCap}
            label="Parcours"
            tone="sky"
            value={String(data.metrics.pathCount)}
          />
          <StatCard
            helper="Contenus à lire"
            icon={FileText}
            label="Contenus"
            tone="emerald"
            value={String(data.metrics.contentCount)}
          />
          <StatCard
            helper="Évaluations incluses"
            icon={ListChecks}
            label="Quiz"
            tone="indigo"
            value={String(data.metrics.quizCount)}
          />
          <StatCard
            helper="Toutes étapes"
            icon={Layers3}
            label="Étapes"
            tone="amber"
            value={String(data.metrics.totalItemCount)}
          />
        </section>

        <section className="space-y-4">
          {data.paths.length ? (
            data.paths.map((path) => (
              <LearningPathCard key={path.id} path={path} variant="coachee" />
            ))
          ) : (
            <EmptyState
              description="Votre coach n'a pas encore publié de parcours pour vos cohortes."
              icon={BookOpenCheck}
              title="Aucun parcours"
            />
          )}
        </section>
      </div>
    </>
  );
}
