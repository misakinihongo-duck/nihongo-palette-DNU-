import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-[#5DB6DE] text-white shadow-[0_12px_28px_rgba(47,136,197,0.22)] hover:bg-[#2F88C5]",
  secondary: "bg-[#F7B7AD] text-[#2F3337] shadow-[0_12px_28px_rgba(247,183,173,0.26)] hover:bg-[#f49f92]",
  ghost: "border border-[#CDEBF5] bg-white text-[#2F3337] hover:border-[#5DB6DE] hover:bg-[#F7FCFF]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-2 text-sm font-bold transition ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
