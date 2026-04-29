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
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl px-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="flex flex-col justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Coaching Platform
          </Link>

          <div className="py-12 lg:py-0">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
          <div className="w-full rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
              Un espace simple pour piloter chaque relation de coaching.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
              Connectez les profils, centralisez les actions et gardez une vue
              nette sur les prochains suivis.
            </p>

            <div className="mt-10 grid gap-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-100"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
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
