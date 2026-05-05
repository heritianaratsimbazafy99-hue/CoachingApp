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
} from "@/app/coach/paths/actions";
import { LearningPathForm } from "@/components/coaching/learning-path-form";
import { LearningPathReminderForm } from "@/components/coaching/learning-path-reminder-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold leading-none text-indigo-700 sm:max-w-[11rem]">
        <span className="min-w-0 truncate">Quiz</span>
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold leading-none text-sky-700 sm:max-w-[11rem]">
      <span className="min-w-0 truncate">
        {item.type ? contentTypeLabel[item.type] : "Contenu"}
      </span>
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
        "inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold leading-none sm:max-w-[12rem]",
        progressStyles[progress.status],
      )}
    >
      <span className="min-w-0 truncate">{progress.label}</span>
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
        "inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold leading-none sm:max-w-[12rem]",
        learnerStatusStyles[status],
      )}
    >
      <span className="min-w-0 truncate">{learnerStatusLabel[status]}</span>
    </span>
  );
}

function CoachPathSignals({
  signals,
}: {
  signals: CoachLearningPathData["signals"];
}) {
  return (
    <section className="grid gap-4 2xl:grid-cols-3">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-sky-600" />
            <CardTitle>Derniers événements</CardTitle>
          </div>
        </CardHeader>
        <div className="ui-scrollbar max-h-[22rem] space-y-3 overflow-y-auto p-5">
          {signals.recentEvents.length ? (
            signals.recentEvents.map((event) => (
              <Link
                className="block rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-950/[0.03] transition hover:border-sky-200 hover:bg-sky-50/45"
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
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Les actions de parcours apparaîtront ici.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <CardTitle>Coachés bloqués</CardTitle>
          </div>
        </CardHeader>
        <div className="ui-scrollbar max-h-[22rem] space-y-3 overflow-y-auto p-5">
          {signals.blockedLearners.length ? (
            signals.blockedLearners.map((item) => (
              <article
                className="min-w-0 rounded-xl border border-rose-100 bg-rose-50/50 p-3"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link className="min-w-0 hover:underline" href={item.href}>
                    <span className="block break-words text-sm font-semibold text-slate-950">
                      {item.coacheeName}
                    </span>
                    <span className="mt-1 block break-words text-xs text-slate-500">
                      {item.pathTitle} · {item.reason}
                    </span>
                  </Link>
                  <span className="inline-flex max-w-20 shrink-0 overflow-hidden rounded-full bg-white px-2.5 py-1 text-xs font-semibold leading-none text-rose-700 ring-1 ring-rose-100">
                    <span className="min-w-0 truncate">
                      {formatPercent(item.percentage)}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-indigo-600" />
            <CardTitle>Corrections parcours</CardTitle>
          </div>
        </CardHeader>
        <div className="ui-scrollbar max-h-[22rem] space-y-3 overflow-y-auto p-5">
          {signals.pendingCorrections.length ? (
            signals.pendingCorrections.map((item) => (
              <article
                className="min-w-0 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
                key={item.id}
              >
                <Link className="block hover:underline" href={item.href}>
                  <span className="block break-words text-sm font-semibold text-slate-950">
                    {item.coacheeName}
                  </span>
                  <span className="mt-1 block break-words text-xs text-slate-500">
                    {item.pathTitle} · {item.reason}
                  </span>
                  {item.lastActivityAt ? (
                    <span className="mt-1 block text-xs font-medium text-slate-400">
                      Soumis le {formatDateTime(item.lastActivityAt)}
                    </span>
                  ) : null}
                </Link>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </Card>
    </section>
  );
}

function CoachPathTracking({ path }: { path: CoachLearningPath }) {
  const summary = path.coachSummary;

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 ring-1 ring-white">
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
              className="grid gap-3 rounded-xl border border-white bg-white p-3 shadow-sm shadow-slate-950/[0.03] transition hover:border-sky-100 hover:bg-sky-50/35 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center"
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
                  <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold leading-none text-indigo-700">
                    <span className="min-w-0 truncate">
                      {learner.pendingCorrectionCount} correction
                    </span>
                  </span>
                ) : null}
                {learner.failedQuizCount ? (
                  <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold leading-none text-rose-700">
                    <span className="min-w-0 truncate">
                      {learner.failedQuizCount} reprise
                    </span>
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
        "grid gap-3 rounded-xl border bg-white p-3 shadow-sm shadow-slate-950/[0.03] transition sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center",
        item.progress?.isCompleted
          ? "border-emerald-100 ring-1 ring-emerald-50"
          : "border-sky-100 ring-1 ring-white hover:border-sky-200 hover:bg-sky-50/40",
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
          <p className="min-w-0 break-words font-medium text-slate-950">
            {item.label}
          </p>
          <ItemBadge item={item} />
          <ProgressBadge progress={item.progress} />
          {item.status === "draft" ? (
            <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold leading-none text-slate-600">
              <span className="min-w-0 truncate">Brouillon</span>
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-slate-500">
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
          <span className="inline-flex max-w-[10rem] items-center gap-1 overflow-hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="min-w-0 truncate">{stepCtaLabel(item)}</span>
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
  const isCoachee = variant === "coachee";

  return (
    <Card
      className={cn(
        "overflow-hidden p-5",
        isCoachee ? "border-emerald-100/80" : "",
      )}
    >
      <div
        className={cn(
          "-mx-5 -mt-5 mb-5 h-1 opacity-75",
          isCoachee
            ? "bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400"
            : "bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400",
        )}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase",
                isCoachee ? "text-emerald-700" : "text-sky-700",
              )}
            >
              {path.cohortName}
            </p>
            {isCoachee && path.progress ? (
              <span className="inline-flex w-fit max-w-[9rem] shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-700">
                <span className="min-w-0 truncate">
                  {formatPercent(path.progress.percentage)}
                </span>
              </span>
            ) : null}
          </div>
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
          <div className="flex shrink-0 items-center gap-2">
            <Link
              className={cn(
                buttonVariants({ variant: "soft" }),
                "h-10 w-10 px-0",
              )}
              href={`/coach/paths/${path.id}/edit`}
              title="Modifier le parcours"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <form action={duplicateLearningPathAction}>
              <input name="pathId" type="hidden" value={path.id} />
              <button
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "h-10 w-10 px-0 text-indigo-700 hover:text-indigo-700",
                )}
                title="Dupliquer le parcours"
                type="submit"
              >
                <Copy className="h-4 w-4" />
              </button>
            </form>
            <form action={deleteLearningPathAction}>
              <input name="pathId" type="hidden" value={path.id} />
              <button
                className={cn(
                  buttonVariants({ variant: "danger" }),
                  "h-10 w-10 px-0",
                )}
                title="Supprimer le parcours"
                type="submit"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {isCoachee && path.progress ? (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 ring-1 ring-white">
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
              className={buttonVariants({ size: "sm" })}
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
    </Card>
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
            className={buttonVariants()}
            href="#new-path"
          >
            <Plus className="h-4 w-4" />
            Nouveau parcours
          </a>
        }
        description="Composez des séquences pédagogiques avec contenus et quiz pour vos cohortes."
        title="Parcours"
      />

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[420px_1fr]">
        <Card
          className="ui-scrollbar xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto"
          id="new-path"
        >
          <CardHeader>
            <CardTitle>Nouveau parcours</CardTitle>
            <CardDescription>
              Ajoutez les étapes puis réordonnez-les avant publication.
            </CardDescription>
          </CardHeader>
          <div className="p-5">
            <LearningPathForm
              cohorts={data.cohorts}
              itemOptions={data.itemOptions}
            />
          </div>
        </Card>

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
                  className={buttonVariants()}
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
            className={buttonVariants({ variant: "secondary" })}
            href="/coach/paths"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Retour
          </Link>
        }
        description="Ajustez la cohorte, les étapes et l'ordre exact du parcours."
        title="Modifier le parcours"
      />

      <div className="p-4 sm:p-6">
        <Card className="mx-auto max-w-3xl p-5">
          <LearningPathForm
            cohorts={data.cohorts}
            defaultValues={data.path}
            itemOptions={data.itemOptions}
            mode="edit"
          />
        </Card>
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

      <div className="space-y-6 p-4 sm:p-6">
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
