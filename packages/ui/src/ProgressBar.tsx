export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 min-w-[150px] h-1.5 rounded-full bg-white/[0.03] border border-white/[0.01] overflow-hidden relative ${className}`}
    >
      <div
        className="h-full bg-accent rounded-full transition-[width] duration-150 ease-out shadow-[0_0_12px_var(--color-accent),0_0_4px_var(--color-accent)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
