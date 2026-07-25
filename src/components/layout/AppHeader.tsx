import Link from "next/link";
import type { Role } from "@/lib/types";
import { roleLabel } from "@/lib/role";

type AppHeaderProps = {
  role?: Role;
};

export function AppHeader({ role }: AppHeaderProps) {
  return (
    <header className="mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-white/75 shadow-[0_16px_46px_rgba(47,136,197,0.12)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold text-[#2F3337]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#5DB6DE] text-white shadow-[0_10px_24px_rgba(47,136,197,0.22)]">
            あ
          </span>
          <span>Nihongo Palette</span>
        </Link>
        {role ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-[#DDF4FA] px-3 py-1 font-bold text-[#2F88C5]">
              {roleLabel(role)}
            </span>
            <Link
              href={`/dashboard?role=${role}`}
              className="font-bold text-[#2F88C5]"
            >
              Dashboard
            </Link>
            <Link
              href={`/workspace?role=${role}`}
              className="font-bold text-[#2F88C5]"
            >
              Workspace
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
