import Link from "next/link";
import { BookOpen, FileText, Layers3, Plus, Tags } from "lucide-react";
import { ContentEditorForm } from "@/components/coaching/content-editor-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  CoachContentEditorData,
  CoachLibraryData,
} from "@/services/coach-service";
import { contentTypeLabel } from "@/utils/format";

export function LibraryPage({ data }: { data: CoachLibraryData }) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants()}
            href="/coach/library/new"
          >
            <Plus className="h-4 w-4" />
            Nouveau contenu
          </Link>
        }
        description="Organisez vos cours, vidéos, ressources, liens et quiz par thèmes."
        title="Bibliothèque de contenus"
      />

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-600">Thèmes</h2>
          <div className="mt-4 space-y-2">
            {data.themes.length ? (
              data.themes.map((theme) => (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  key={theme.id}
                >
                  <p className="font-medium text-slate-900">{theme.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {theme.description || "Aucune description"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Aucun thème.
              </p>
            )}
          </div>
          <h2 className="mt-6 text-sm font-semibold text-slate-600">
            Sous-thèmes
          </h2>
          <div className="mt-4 space-y-2">
            {data.subthemes.length ? (
              data.subthemes.map((subtheme) => (
                <p
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                  key={subtheme.id}
                >
                  {subtheme.title}
                </p>
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                Aucun sous-thème.
              </p>
            )}
          </div>
        </Card>

        <section className="space-y-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <BookOpen className="h-4 w-4" />
                {data.contents.length} contenu(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Publiés ou en brouillon
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Layers3 className="h-4 w-4" />
                {data.themes.length} thème(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Structure pédagogique
              </p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Tags className="h-4 w-4" />
                {data.subthemes.length} sous-thème(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Classement des ressources
              </p>
            </div>
          </Card>

          {data.contents.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.contents.map((content) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06]"
                  key={content.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <StatusBadge status={content.status} />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-950">
                    {content.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {content.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700 ring-1 ring-sky-100">
                      {contentTypeLabel[content.type]}
                    </span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                      {content.themeTitle}
                    </span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                      {content.subthemeTitle}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className={buttonVariants()}
                      href={`/coach/library/${content.id}/edit`}
                    >
                      Modifier
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Créez votre premier cours, vidéo ou quiz pour alimenter la bibliothèque."
              icon={BookOpen}
              title="Aucun contenu"
            />
          )}
        </section>
      </div>
    </>
  );
}

export function ContentEditorPage({ data }: { data: CoachContentEditorData }) {
  return (
    <>
      <PageHeader
        description="Formulaire V1 pour créer ou modifier cours, vidéos, liens et ressources."
        title={data.content ? "Modifier le contenu" : "Nouveau contenu"}
      />
      <div className="p-4 sm:p-6">
        <ContentEditorForm
          content={data.content}
          subthemes={data.subthemes}
          themes={data.themes}
        />
      </div>
    </>
  );
}
