import Link from "next/link";
import { BookOpen, FileText, Filter, Plus, Search } from "lucide-react";
import { ContentEditorForm } from "@/components/coaching/content-editor-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href="/coach/library/new"
          >
            <Plus className="h-4 w-4" />
            Nouveau contenu
          </Link>
        }
        description="Organisez vos cours, vidéos, ressources, liens et quiz par thèmes."
        title="Bibliothèque de contenus"
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Thèmes</h2>
          <div className="mt-4 space-y-2">
            {data.themes.length ? (
              data.themes.map((theme) => (
                <div className="rounded-lg bg-slate-50 p-3" key={theme.id}>
                  <p className="font-medium">{theme.title}</p>
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
          <h2 className="mt-6 text-sm font-semibold text-slate-500">
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
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <div className="flex flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">
                Rechercher par titre, tag ou thème
              </span>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
          </div>

          {data.contents.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.contents.map((content) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={content.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <StatusBadge status={content.status} />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">{content.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {content.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {contentTypeLabel[content.type]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {content.themeTitle}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {content.subthemeTitle}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
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
      <div className="p-6">
        <ContentEditorForm
          content={data.content}
          subthemes={data.subthemes}
          themes={data.themes}
        />
      </div>
    </>
  );
}
