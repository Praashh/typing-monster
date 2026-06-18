import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  active?: boolean;
}

const base =
  "inline-flex items-center justify-center font-mono font-semibold cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "text-[#0d0f14] bg-accent border-0 rounded-xl px-7 py-3 text-[13px] shadow-[0_0_24px_rgba(57,189,248,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(57,189,248,0.6)] hover:brightness-[1.08] active:translate-y-0",
  outline:
    "text-label bg-white/[0.02] border border-white/5 rounded-full px-4 py-1.5 text-xs hover:text-txt hover:border-white/15 hover:bg-white/[0.06] hover:-translate-y-px",
  ghost:
    "text-label bg-transparent border-0 rounded-full px-6 py-2 text-[22px] leading-none hover:text-accent hover:bg-accent/[0.06] hover:scale-[1.08]",
};

const activeStyles: Partial<Record<Variant, string>> = {
  outline:
    "text-accent border-accent bg-accent/[0.08] shadow-[0_0_12px_rgba(57,189,248,0.25)]",
};

export function Button({
  variant = "primary",
  active = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${active && activeStyles[variant] ? activeStyles[variant] : ""} ${className}`}
      {...props}
    />
  );
}
