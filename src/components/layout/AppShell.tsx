import type { ReactNode } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import type { Role } from "@/lib/types";

type AppShellProps = {
  role: Role;
  title: string;
  description: string;
  children: ReactNode;
  variant?: "default" | "workspace";
};

export function AppShell({ role, title, description, children, variant = "default" }: AppShellProps) {
  if (variant === "workspace") {
    return (
      <main className="min-h-screen bg-[#F7FCFF]">
        <AppHeader role={role} />
        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-2 rounded-[30px] border border-[#DDEAF1] bg-white/88 px-5 py-4 shadow-[0_12px_34px_rgba(47,136,197,0.08)] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-[#2F88C5]">Learning Workspace</p>
              <h1 className="mt-1 text-3xl font-black text-[#2F3337]">{title}</h1>
            </div>
            <p className="max-w-3xl text-sm font-bold leading-6 text-[#6F7F8A]">
              {description}
            </p>
          </div>
          {children}
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:p-10">
      <AppHeader role={role} />
      <main className="soft-frame mx-auto mt-5 grid max-w-7xl gap-6 rounded-[42px] p-4 sm:p-6 lg:grid-cols-[220px_1fr] lg:p-8">
        <aside className="rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-[0_18px_48px_rgba(47,136,197,0.12)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2F88C5]">
            Menu
          </p>
          <nav className="mt-4 grid gap-2 text-sm font-semibold">
            <Link className="rounded-2xl px-3 py-2 text-[#2F3337] hover:bg-[#DDF4FA]" href={`/dashboard?role=${role}#overview`}>
              Overview
            </Link>
            <Link className="rounded-2xl px-3 py-2 text-[#2F3337] hover:bg-[#DDF4FA]" href={`/workspace?role=${role}`}>
              Writing
            </Link>
            <Link className="rounded-2xl px-3 py-2 text-[#2F3337] hover:bg-[#DDF4FA]" href={`/vocabulary?role=${role}`}>
              Vocabulary
            </Link>
            <Link className="rounded-2xl px-3 py-2 text-[#2F3337] hover:bg-[#DDF4FA]" href={`/articles?role=${role}`}>
              Articles
            </Link>
          </nav>
          <div className="mt-8 rounded-[24px] bg-[#DDF4FA] p-4">
            <p className="text-sm font-bold text-[#2F88C5]">今日の合図</p>
            <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
              作文から語彙、記事へ。レッスンの学びをそのまま残します。
            </p>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="mb-6">
            <p className="text-sm font-bold text-[#2F88C5]">Phase 1 mock UI</p>
            <h1 className="mt-1 text-3xl font-bold text-[#2F3337]">{title}</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[#6F7F8A]">
              {description}
            </p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
