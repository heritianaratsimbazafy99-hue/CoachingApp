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
    <div className="flex flex-col gap-5 border-b border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0f9ff_52%,#f8fafc_100%)] px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:py-8">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm font-semibold text-sky-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
