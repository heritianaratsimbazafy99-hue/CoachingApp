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
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,var(--app-body-radial-1),transparent_28rem),radial-gradient(circle_at_86%_18%,var(--app-body-radial-2),transparent_30rem),linear-gradient(180deg,var(--app-body-start)_0%,var(--app-body-mid)_100%)] text-slate-800">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="flex min-w-0 flex-col gap-10 lg:justify-between">
          <Link href="/" className="text-lg font-semibold tracking-normal">
            Coaching Platform
          </Link>

          <div className="flex w-full justify-start py-8 lg:py-0">
            <div
              className="w-[calc(100vw-2rem)] max-w-[22rem] rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.07] sm:p-8 lg:max-w-md"
            >
              <div>
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
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
          <div className="w-full rounded-xl border border-slate-200 bg-white/88 p-8 text-slate-800 shadow-sm shadow-slate-950/[0.04] backdrop-blur-xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-8 max-w-md text-4xl font-semibold tracking-normal text-slate-950">
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
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
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
