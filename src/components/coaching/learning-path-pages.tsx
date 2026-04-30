import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  FileText,
  GraduationCap,
  Layers3,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  TrendingUp,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  deleteLearningPathAction,
  duplicateLearningPathAction,
  sendLearningPathReminderAction,
} from "@/app/coach/paths/actions";
import { LearningPathForm } from "@/components/coaching/learning-path-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CoachLearningPath,
  CoachLearningPathData,
  CoachLearningPathEditorData,
  CoachLearningPathLearnerProgress,
  CoacheeLearningPathData,
  LearningPathItem,
  LearningPathItemProgress,
} from "@/services/learning-path-service";
import {
  contentTypeLabel,
  formatDate,
  formatDateTime,
  formatPercent,
} from "@/utils/format";
import { cn } from "@/utils/cn";

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

const progressStyles: Record<LearningPathItemProgress["status"], string> = {
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  failed: "border-rose-100 bg-rose-50 text-rose-700",
  passed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  pending_correction: "border-indigo-100 bg-indigo-50 text-indigo-700",
  todo: "border-slate-200 bg-white text-slate-600",
};

function ProgressBadge({
  progress,
}: {
  progress: LearningPathItemProgress | undefined;
}) {
  if (!progress) {
    return null;
  }

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold",
        progressStyles[progress.status],
      )}
    >
      {progress.label}
    </span>
  );
}

function StepIcon({ item }: { item: LearningPathItem }) {
  if (item.progress?.isCompleted) {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  if (item.progress?.status === "failed") {
    return <RotateCcw className="h-5 w-5" />;
  }

  if (item.kind === "quiz") {
    return <ListChecks className="h-5 w-5" />;
  }

  return item.progress ? (
    <Circle className="h-5 w-5" />
  ) : (
    <FileText className="h-5 w-5" />
  );
}

function stepCtaLabel(item: LearningPathItem) {
  if (item.kind === "content") {
    return item.progress?.isCompleted ? "Revoir" : "Lire";
  }

  if (item.progress?.status === "failed") {
    return "Repasser";
  }

  if (item.progress?.status === "passed") {
    return "Revoir";
  }

  return "Passer";
}

const learnerStatusLabel: Record<
  CoachLearningPathLearnerProgress["status"],
  string
> = {
  blocked: "À surveiller",
  completed: "Terminé",
  in_progress: "En cours",
  not_started: "Pas démarré",
};

const learnerStatusStyles: Record<
  CoachLearningPathLearnerProgress["status"],
  string
> = {
  blocked: "border-rose-100 bg-rose-50 text-rose-700",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  in_progress: "border-sky-100 bg-sky-50 text-sky-700",
  not_started: "border-slate-200 bg-white text-slate-600",
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

function LearnerStatusBadge({
  status,
}: {
  status: CoachLearningPathLearnerProgress["status"];
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold",
        learnerStatusStyles[status],
      )}
    >
      {learnerStatusLabel[status]}
    </span>
  );
}

function LearningPathReminderForm({
  coacheeId,
  pathTitle,
  reason,
  reminderType,
}: {
  coacheeId: string;
  pathTitle: string;
  reason: string;
  reminderType: "blocked" | "correction";
}) {
  return (
    <form action={sendLearningPathReminderAction}>
      <input name="coacheeId" type="hidden" value={coacheeId} />
      <input name="pathTitle" type="hidden" value={pathTitle} />
      <input name="reason" type="hidden" value={reason} />
      <input name="reminderType" type="hidden" value={reminderType} />
      <button
        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-sky-200 bg-white px-3 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
        type="submit"
      >
        Relancer
      </button>
    </form>
  );
}

function CoachPathSignals({
  signals,
}: {
  signals: CoachLearningPathData["signals"];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-sky-600" />
          <h2 className="font-semibold text-slate-950">Derniers événements</h2>
        </div>
        <div className="mt-4 space-y-3">
          {signals.recentEvents.length ? (
            signals.recentEvents.map((event) => (
              <Link
                className="block rounded-xl border border-sky-100 bg-sky-50/50 p-3 transition hover:bg-sky-50"
                href={event.href}
                key={event.id}
              >
                <p className="text-sm font-semibold text-slate-950">
                  {event.action}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {event.coacheeName} · {event.detail}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {formatDateTime(event.createdAt)}
                </p>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-3 text-sm text-slate-500">
              Les actions de parcours apparaîtront ici.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white/95 p-5 shadow-sm shadow-rose-900/5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <h2 className="font-semibold text-slate-950">Coachés bloqués</h2>
        </div>
        <div className="mt-4 space-y-3">
          {signals.blockedLearners.length ? (
            signals.blockedLearners.map((item) => (
              <article
                className="rounded-xl border border-rose-100 bg-rose-50/50 p-3"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link className="min-w-0 hover:underline" href={item.href}>
                    <span className="block text-sm font-semibold text-slate-950">
                      {item.coacheeName}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.pathTitle} · {item.reason}
                    </span>
                  </Link>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                    {formatPercent(item.percentage)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-rose-700">
                    Reprise conseillée
                  </span>
                  <LearningPathReminderForm
                    coacheeId={item.coacheeId}
                    pathTitle={item.pathTitle}
                    reason={item.reason}
                    reminderType="blocked"
                  />
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50/40 p-3 text-sm text-slate-500">
              Aucun blocage détecté sur les parcours.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-white/95 p-5 shadow-sm shadow-indigo-900/5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-950">Corrections parcours</h2>
        </div>
        <div className="mt-4 space-y-3">
          {signals.pendingCorrections.length ? (
            signals.pendingCorrections.map((item) => (
              <article
                className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
                key={item.id}
              >
                <Link className="block hover:underline" href={item.href}>
                  <span className="block text-sm font-semibold text-slate-950">
                    {item.coacheeName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.pathTitle} · {item.reason}
                  </span>
                  {item.lastActivityAt ? (
                    <span className="mt-1 block text-xs font-medium text-slate-400">
                      Soumis le {formatDateTime(item.lastActivityAt)}
                    </span>
                  ) : null}
                </Link>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-indigo-700">
                    Message rassurant
                  </span>
                  <LearningPathReminderForm
                    coacheeId={item.coacheeId}
                    pathTitle={item.pathTitle}
                    reason={item.reason}
                    reminderType="correction"
                  />
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3 text-sm text-slate-500">
              Aucune correction liée aux parcours.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CoachPathTracking({ path }: { path: CoachLearningPath }) {
  const summary = path.coachSummary;

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Coachés</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {summary.learnerCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Progression moyenne</p>
          <p className="mt-1 text-2xl font-semibold text-sky-700">
            {formatPercent(summary.averageProgress)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">En cours</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-700">
            {summary.inProgressLearnersCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">À surveiller</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">
            {summary.blockedLearnersCount}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={summary.averageProgress} />
      </div>

      <div className="mt-4 space-y-2">
        {path.learnerProgress?.length ? (
          path.learnerProgress.slice(0, 6).map((learner) => (
            <div
              className="grid gap-3 rounded-lg border border-white bg-white p-3 shadow-sm shadow-slate-950/[0.03] md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center"
              key={learner.userId}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  {learner.avatarUrl ? (
                    <span
                      aria-hidden="true"
                      className="h-full w-full rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${learner.avatarUrl})` }}
                    />
                  ) : (
                    initials(learner.fullName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {learner.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Prochaine étape : {learner.nextLabel}
                  </p>
                  {learner.lastActivityAt ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Dernière activité {formatDateTime(learner.lastActivityAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {learner.completedCount}/{learner.totalCount}
                  </span>
                  <span>{formatPercent(learner.percentage)}</span>
                </div>
                <ProgressBar value={learner.percentage} />
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <LearnerStatusBadge status={learner.status} />
                {learner.pendingCorrectionCount ? (
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {learner.pendingCorrectionCount} correction
                  </span>
                ) : null}
                {learner.failedQuizCount ? (
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    {learner.failedQuizCount} reprise
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
            Aucun coaché dans cette cohorte pour le moment.
          </p>
        )}
      </div>
      {path.learnerProgress && path.learnerProgress.length > 6 ? (
        <p className="mt-3 text-xs font-medium text-slate-500">
          +{path.learnerProgress.length - 6} autre(s) coaché(s) dans cette cohorte.
        </p>
      ) : null}
    </div>
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
    <div
      className={cn(
        "grid gap-3 rounded-xl border bg-white p-3 transition sm:grid-cols-[44px_1fr_auto] sm:items-center",
        item.progress?.isCompleted
          ? "border-emerald-100"
          : "border-sky-100 hover:border-sky-200 hover:bg-sky-50/40",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
          item.progress?.isCompleted
            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
            : item.progress?.status === "failed"
              ? "bg-rose-50 text-rose-700 ring-rose-100"
              : "bg-sky-50 text-sky-700 ring-sky-100",
        )}
      >
        <StepIcon item={item} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-950">{item.label}</p>
          <ItemBadge item={item} />
          <ProgressBadge progress={item.progress} />
          {item.status === "draft" ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              Brouillon
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {item.description}
        </p>
        {item.progress?.percentage !== null &&
        item.progress?.percentage !== undefined ? (
          <p className="mt-2 text-xs font-medium text-slate-500">
            Dernier score {formatPercent(item.progress.percentage)}
            {item.progress.submittedAt
              ? ` · ${formatDateTime(item.progress.submittedAt)}`
              : ""}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm font-semibold text-slate-400">
          #{item.position}
        </span>
        {variant === "coachee" && !item.label.includes("indisponible") ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {stepCtaLabel(item)}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (variant === "coach" || item.label.includes("indisponible")) {
    return content;
  }

  return (
    <Link className="block" href={item.href}>
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
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
              href={`/coach/paths/${path.id}/edit`}
              title="Modifier le parcours"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <form action={duplicateLearningPathAction}>
              <input name="pathId" type="hidden" value={path.id} />
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 transition hover:bg-indigo-100"
                title="Dupliquer le parcours"
                type="submit"
              >
                <Copy className="h-4 w-4" />
              </button>
            </form>
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
          </div>
        ) : null}
      </div>

      {variant === "coachee" && path.progress ? (
        <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              {path.progress.completedCount}/{path.progress.totalCount} étapes
              terminées
            </p>
            <span className="text-sm font-semibold text-sky-700">
              {formatPercent(path.progress.percentage)}
            </span>
          </div>
          <ProgressBar value={path.progress.percentage} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Prochaine étape :{" "}
              <span className="font-semibold text-slate-900">
                {path.progress.nextLabel}
              </span>
            </p>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              href={path.progress.nextHref}
            >
              {path.progress.nextActionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}

      {variant === "coach" ? <CoachPathTracking path={path} /> : null}

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
              Ajoutez les étapes puis réordonnez-les avant publication.
            </p>
          </div>
          <LearningPathForm
            cohorts={data.cohorts}
            itemOptions={data.itemOptions}
          />
        </section>

        <section className="space-y-4">
          {data.paths.length ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  helper="Parcours créés"
                  icon={BookOpenCheck}
                  label="Parcours"
                  tone="sky"
                  value={String(data.metrics.pathCount)}
                />
                <StatCard
                  helper="Coachés uniques suivis"
                  icon={UserRound}
                  label="Coachés"
                  tone="emerald"
                  value={String(data.metrics.learnerCount)}
                />
                <StatCard
                  helper="Toutes cohortes"
                  icon={TrendingUp}
                  label="Progression"
                  tone="indigo"
                  value={formatPercent(data.metrics.averageProgress)}
                />
                <StatCard
                  helper="Quiz échoué ou reprise nécessaire"
                  icon={AlertCircle}
                  label="À surveiller"
                  tone="rose"
                  value={String(data.metrics.blockedLearnersCount)}
                />
              </section>

              <CoachPathSignals signals={data.signals} />

              {data.paths.map((path) => (
                <LearningPathCard key={path.id} path={path} variant="coach" />
              ))}
            </>
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

export function CoachLearningPathEditPage({
  data,
}: {
  data: CoachLearningPathEditorData;
}) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/coach/paths"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Retour
          </Link>
        }
        description="Ajustez la cohorte, les étapes et l'ordre exact du parcours."
        title="Modifier le parcours"
      />

      <div className="p-6">
        <section className="mx-auto max-w-3xl rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
          <LearningPathForm
            cohorts={data.cohorts}
            defaultValues={data.path}
            itemOptions={data.itemOptions}
            mode="edit"
          />
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
            helper={`${data.metrics.totalItemCount} étape(s) au total`}
            icon={Layers3}
            label="Terminées"
            tone="amber"
            value={String(data.metrics.completedItemCount)}
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
