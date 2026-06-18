export function Stat({
  label,
  value,
  accent,
  size = "md",
  className = "",
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const valueSize = size === "lg" ? "text-[72px]" : "text-[28px]";
  const labelSize = size === "lg" ? "text-xs mt-2" : "text-[10px] mt-1.5";

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <strong
        className={`${valueSize} font-bold tabular-nums tracking-tight ${
          accent
            ? "text-accent [text-shadow:0_0_16px_rgba(57,189,248,0.35)]"
            : "text-white"
        }`}
      >
        {value}
      </strong>
      <span
        className={`${labelSize} text-txt-dim uppercase tracking-[0.16em] font-semibold`}
      >
        {label}
      </span>
    </div>
  );
}
