import Link from "next/link";

type PlaceholderDashboardProps = {
  description: string;
  title: string;
};

export function PlaceholderDashboard({
  description,
  title,
}: PlaceholderDashboardProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-6 py-6 text-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Coaching Platform
        </Link>
        <Link
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/login"
        >
          Connexion
        </Link>
      </div>

      <section className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Dashboard en préparation
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {description}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Parcours", "Messages", "Rendez-vous"].map((item) => (
            <div
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              key={item}
            >
              <p className="text-sm font-medium">{item}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Module bientôt disponible.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
