export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-50">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#4f46e5)] transition-all"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
