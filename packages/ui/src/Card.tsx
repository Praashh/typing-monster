import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-linear-to-b from-[#171b26] to-[#0e1017] border border-white/[0.06] rounded-[20px] py-9 px-11 text-center min-w-[320px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_32px_rgba(57,189,248,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
