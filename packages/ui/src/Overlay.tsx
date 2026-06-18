import type { ReactNode } from "react";

export function Overlay({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-[rgba(8,9,13,0.85)] backdrop-blur-[10px] rounded-[20px] z-50 animate-fade ${className}`}
    >
      {children}
    </div>
  );
}
