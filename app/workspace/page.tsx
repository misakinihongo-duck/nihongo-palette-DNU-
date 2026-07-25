import Link from "next/link";
import { WorkspaceClient } from "@/components/workspace/WorkspaceClient";

type WorkspacePageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const params = await searchParams;
  const role = params?.role === "student" ? "student" : "teacher";

  return (
    <main className="min-h-screen bg-[#F7FCFF]">
      <header className="flex min-h-24 items-center justify-between border-b border-[#E8F1F6] bg-white/88 px-6 shadow-[0_10px_30px_rgba(47,136,197,0.07)]">
        <Link href="/" className="flex items-center gap-4">
          <div className="palette-logo scale-[0.66]" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="text-3xl font-black tracking-wide text-[#10233B]">
            日本語パレット
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <div className="flex rounded-full bg-[#EAF4FB] p-1 text-sm font-black text-[#7B8C98] shadow-inner">
            <span className="rounded-full bg-[#D4ECFB] px-4 py-2 text-[#1592D1]">JP</span>
            <span className="px-4 py-2">EN</span>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-[#B8DAF1] to-[#7BB3DC] text-sm font-black text-white">
            {role === "teacher" ? "T" : "S"}
          </div>
        </div>
      </header>

      <WorkspaceClient role={role} />
    </main>
  );
}
