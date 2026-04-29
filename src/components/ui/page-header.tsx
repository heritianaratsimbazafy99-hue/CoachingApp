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
    <div className="flex flex-col gap-5 border-b border-emerald-900/10 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_48%,#eef2ff_100%)] px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#10231f]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
