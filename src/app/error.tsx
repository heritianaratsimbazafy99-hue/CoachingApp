"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  unstable_retry: retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl border border-red-100 bg-white p-6 shadow-xl shadow-slate-950/5">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Erreur serveur
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Cette page n&apos;a pas pu se charger
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Un diagnostic admin est disponible pour vérifier les variables
              Vercel et l&apos;accès Supabase sans exposer les secrets.
            </p>
            {error.digest ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                Digest: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => retry()}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
            Réessayer
          </button>
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/api/admin-diagnostics"
          >
            Ouvrir le diagnostic
          </Link>
        </div>
      </section>
    </main>
  );
}
