import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--app-body-start),var(--app-body-mid),var(--app-body-end))] px-6 py-12 text-slate-900"
    >
      <section
        aria-label="Chargement de la page"
        className="w-full max-w-xl rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-xl shadow-slate-950/5 ring-1 ring-white/80 backdrop-blur"
        role="status"
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Coaching Platform
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Chargement de l&apos;espace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Nous préparons les données, les accès et les dernières actions.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
        </div>
      </section>
    </main>
  );
}
