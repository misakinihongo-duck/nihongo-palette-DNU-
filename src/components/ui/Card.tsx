import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  className?: string;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <section
      {...props}
      className={`rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_48px_rgba(47,136,197,0.12)] ${className}`}
    >
      {children}
    </section>
  );
}
