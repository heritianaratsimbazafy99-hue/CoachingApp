import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

const benefits = [
  "Accès sécurisé par rôle",
  "Suivi clair des coachings",
  "Espace prêt pour admins, coachs et coachés",
];

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7efe2_0%,#f5f8ef_48%,#e8f3ef_100%)] text-slate-800">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl px-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="flex min-w-0 flex-col gap-10 lg:justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Coaching Platform
          </Link>

          <div className="py-8 lg:py-0">
            <div
              className="rounded-2xl border border-sky-100 bg-[#fffaf2]/92 p-6 shadow-sm shadow-sky-900/5 ring-1 ring-white/70 sm:w-full sm:p-8"
              style={{ maxWidth: "28rem", width: "calc(100vw - 3rem)" }}
            >
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>

              <div className="mt-8">{children}</div>
            </div>
          </div>

          <p className="hidden text-sm text-slate-500 lg:block">
            SaaS de coaching pour structurer les parcours, les contenus et les
            rendez-vous.
          </p>
        </section>

        <aside className="hidden items-center lg:flex">
          <div className="w-full rounded-3xl border border-sky-100 bg-[#fffaf2]/90 p-8 text-slate-800 shadow-sm shadow-sky-900/5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
              Un espace simple pour piloter chaque relation de coaching.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
              Connectez les profils, centralisez les actions et gardez une vue
              nette sur les prochains suivis.
            </p>

            <div className="mt-10 grid gap-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-700"
                >
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
