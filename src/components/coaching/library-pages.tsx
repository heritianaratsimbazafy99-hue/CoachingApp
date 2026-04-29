import Link from "next/link";
import { BookOpen, FileText, Filter, Plus, Search } from "lucide-react";
import {
  contents,
  getSubthemeTitle,
  getThemeTitle,
  quizzes,
  subthemes,
  themes,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { contentTypeLabel } from "@/utils/format";

export function LibraryPage() {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
            {themes.map((theme) => (
              <div className="rounded-lg bg-slate-50 p-3" key={theme.id}>
                <p className="font-medium">{theme.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {theme.description}
                </p>
              </div>
            ))}
          </div>
          <h2 className="mt-6 text-sm font-semibold text-slate-500">
            Sous-thèmes
          </h2>
          <div className="mt-4 space-y-2">
            {subthemes.map((subtheme) => (
              <p
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                key={subtheme.id}
              >
                {subtheme.title}
              </p>
            ))}
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

          {contents.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {contents.map((content) => (
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
                      {getThemeTitle(content.themeId)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {getSubthemeTitle(content.subthemeId)}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      href={`/coach/library/${content.id}/edit`}
                    >
                      Modifier
                    </Link>
                    <ActionButton
                      confirmMessage="Supprimer ce contenu de démonstration ?"
                      message="Suppression simulée"
                      variant="danger"
                    >
                      Supprimer
                    </ActionButton>
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

export function ContentEditorPage({ contentId }: { contentId?: string }) {
  const content = contents.find((item) => item.id === contentId);

  return (
    <>
      <PageHeader
        description="Formulaire V1 pour créer ou modifier cours, vidéos, liens et ressources."
        title={content ? "Modifier le contenu" : "Nouveau contenu"}
      />
      <div className="p-6">
        <form className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Titre</span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-950/10"
                defaultValue={content?.title}
                placeholder="Titre du contenu"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-950/10"
                defaultValue={content?.description}
                placeholder="Résumé court visible dans la bibliothèque"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Corps du cours
              </span>
              <textarea
                className="mt-2 min-h-64 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:ring-4 focus:ring-slate-950/10"
                defaultValue={content?.body}
                placeholder="Texte riche, liens, consignes, ressources..."
              />
            </label>
          </div>
          <aside className="space-y-5 rounded-xl bg-slate-50 p-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Type</span>
              <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Cours texte</option>
                <option>Vidéo URL</option>
                <option>Lien externe</option>
                <option>Document</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Quiz associé</span>
              <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Aucun quiz</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id}>{quiz.title}</option>
                ))}
              </select>
            </label>
            <ActionButton message="Contenu enregistré" variant="primary">
              Enregistrer
            </ActionButton>
          </aside>
        </form>
      </div>
    </>
  );
}
