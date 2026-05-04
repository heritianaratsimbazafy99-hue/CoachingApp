type PageHeaderProps = {
  actions?: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="relative isolate flex flex-col gap-5 overflow-hidden border-b border-slate-200/80 bg-white/88 px-4 py-6 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-sky-300/70 before:via-indigo-300/70 before:to-emerald-300/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:py-8">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex max-w-full overflow-hidden rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-white">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-wrap gap-3 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
