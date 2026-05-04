import Link from "next/link";
import { BookOpen, FileText, FolderOpen, Layers3, Plus, Tags } from "lucide-react";
import { ContentEditorForm } from "@/components/coaching/content-editor-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ListMetaTile,
  ListPanel,
  ListPanelBody,
  ListPanelRow,
} from "@/components/ui/list-panel";
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
          <Link className={buttonVariants()} href="/coach/library/new">
            <Plus className="h-4 w-4" />
            Nouveau contenu
          </Link>
        }
        description="Organisez vos cours, vidéos, ressources, liens et quiz par thèmes."
        title="Bibliothèque de contenus"
      />

      <div className="grid items-start gap-6 p-4 sm:p-6 lg:grid-cols-[300px_1fr]">
        <Card className="overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700">
                <FolderOpen className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Classement</CardTitle>
                <CardDescription>
                  Thèmes et sous-thèmes disponibles pour structurer la bibliothèque.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="ui-scrollbar space-y-5 overflow-y-auto p-4 lg:max-h-[calc(100vh-14rem)]">
            <div>
              <h2 className="text-sm font-semibold text-slate-600">Thèmes</h2>
              <div className="ui-scrollbar mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {data.themes.length ? (
                  data.themes.map((theme) => (
                    <div
                      className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm shadow-slate-950/[0.03] ring-1 ring-white transition hover:border-sky-200 hover:bg-sky-50/35"
                      key={theme.id}
                    >
                      <p className="break-words font-medium text-slate-900">
                        {theme.title}
                      </p>
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
                        {theme.description || "Aucune description"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
                    Aucun thème.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-600">
                Sous-thèmes
              </h2>
              <div className="ui-scrollbar mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {data.subthemes.length ? (
                  data.subthemes.map((subtheme) => (
                    <p
                      className="truncate rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-white transition hover:border-slate-300 hover:bg-white"
                      key={subtheme.id}
                    >
                      {subtheme.title}
                    </p>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500">
                    Aucun sous-thème.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 ring-1 ring-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <BookOpen className="h-4 w-4" />
                {data.contents.length} contenu(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Publiés ou en brouillon
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 ring-1 ring-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Layers3 className="h-4 w-4" />
                {data.themes.length} thème(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Structure pédagogique
              </p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 ring-1 ring-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Tags className="h-4 w-4" />
                {data.subthemes.length} sous-thème(s)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Classement des ressources
              </p>
            </div>
          </Card>

          <ListPanel
            countLabel={`${data.contents.length} ressource(s)`}
            description="Liste dense pour retrouver, classer et modifier rapidement les ressources pédagogiques."
            icon={BookOpen}
            title="Catalogue"
          >
            {data.contents.length ? (
              <ListPanelBody>
                {data.contents.map((content) => (
                  <ListPanelRow
                    className="xl:grid-cols-[minmax(0,1.35fr)_minmax(120px,0.5fr)_minmax(170px,0.75fr)_auto] xl:items-center"
                    key={content.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold text-slate-950">
                          {content.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-slate-600">
                          {content.description}
                        </p>
                      </div>
                    </div>

                    <ListMetaTile label="Type">
                      {contentTypeLabel[content.type]}
                    </ListMetaTile>

                    <ListMetaTile label="Classement">
                      <span className="block truncate">{content.themeTitle}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                        {content.subthemeTitle}
                      </span>
                    </ListMetaTile>

                    <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
                      <StatusBadge status={content.status} />
                      <Link
                        className={buttonVariants({
                          size: "sm",
                          variant: "secondary",
                        })}
                        href={`/coach/library/${content.id}/edit`}
                      >
                        Modifier
                      </Link>
                    </div>
                  </ListPanelRow>
                ))}
              </ListPanelBody>
            ) : (
              <div className="p-5">
                <EmptyState
                  description="Créez votre premier cours, vidéo ou quiz pour alimenter la bibliothèque."
                  icon={BookOpen}
                  title="Aucun contenu"
                />
              </div>
            )}
          </ListPanel>
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
