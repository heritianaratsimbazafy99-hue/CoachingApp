export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-sky-50">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#a5b4fc)] transition-all"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
