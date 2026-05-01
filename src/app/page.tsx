import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  MessageCircle,
  PieChart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const features = [
  {
    title: "Contenus & quiz",
    description: "Créez des cours, ressources et quiz assignables avec deadline.",
    icon: BookOpenCheck,
  },
  {
    title: "Cohortes",
    description: "Organisez les coachés par groupe et suivez leur progression.",
    icon: UsersRound,
  },
  {
    title: "Cockpit coach",
    description: "Visualisez retards, scores, tâches et prochaines actions.",
    icon: PieChart,
  },
  {
    title: "Messagerie",
    description: "Gardez les échanges coach et coaché au même endroit.",
    icon: MessageCircle,
  },
  {
    title: "Agenda",
    description: "Planifiez rendez-vous, ateliers, rappels et meetings info.",
    icon: CalendarDays,
  },
  {
    title: "Accès sécurisé",
    description: "Admin, coach et coaché avec données protégées par rôle.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,var(--app-body-start),var(--app-body-mid),var(--app-body-end))] text-slate-800">
      <header className="mx-auto flex w-full max-w-[342px] flex-col gap-4 py-6 sm:w-[calc(100vw-3rem)] sm:max-w-6xl sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Coaching Platform
        </Link>

        <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-lg border border-sky-100 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-sky-50 sm:border-transparent sm:bg-transparent sm:px-4 sm:hover:bg-white/80"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex justify-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 sm:px-4"
          >
            Créer un compte
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[342px] gap-10 pb-16 pt-8 sm:w-[calc(100vw-3rem)] sm:max-w-6xl lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-12">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">SaaS de coaching</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Pilotez vos coachings sans complexité.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Une plateforme claire pour gérer les coachés, contenus, quiz,
            deadlines, cohortes, messages et rendez-vous depuis un seul espace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            >
              Démarrer la démo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/80 px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm shadow-sky-900/5">
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cockpit coach
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Vue du jour</h2>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                Actif
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["24", "coachés"],
                ["7", "retards"],
                ["82%", "score moyen"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-sky-100 bg-white/85 p-4"
                >
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Quiz leadership", "En attente de correction", "orange"],
                ["Module confiance", "Deadline demain", "blue"],
                ["Atelier collectif", "Aujourd'hui 15:00", "green"],
              ].map(([title, status, color]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-xl border border-sky-100 bg-white/85 p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{status}</p>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      color === "orange"
                        ? "bg-orange-400"
                        : color === "blue"
                          ? "bg-blue-400"
                          : "bg-emerald-400"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[342px] gap-4 pb-20 sm:w-[calc(100vw-3rem)] sm:max-w-6xl sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-sky-100 bg-white/80 p-5 shadow-sm shadow-sky-900/5"
          >
            <feature.icon className="h-5 w-5 text-slate-700" />
            <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
