import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page introuvable | Coaching Platform",
  description: "La page demandée n'existe pas ou n'est plus disponible.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--app-body-start),var(--app-body-mid),var(--app-body-end))] px-6 py-12 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-950/5 ring-1 ring-white/80 backdrop-blur">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
            <SearchX className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Page introuvable
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Cette page n&apos;est pas disponible
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Le lien a peut-être changé, ou l&apos;espace demandé n&apos;est
              pas accessible avec votre compte actuel.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link className={buttonVariants()} href="/">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/login"
          >
            <ArrowLeft className="h-4 w-4" />
            Connexion
          </Link>
        </div>
      </section>
    </main>
  );
}
