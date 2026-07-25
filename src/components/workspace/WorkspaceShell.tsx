import { TeacherSupportPanel } from "@/components/workspace/TeacherSupportPanel";
import { StudentReviewPanel } from "@/components/workspace/StudentReviewPanel";
import { WritingEditor } from "@/components/workspace/WritingEditor";
import { WritingList } from "@/components/workspace/WritingList";
import type { Role } from "@/lib/types";

type WorkspaceShellProps = {
  role: Role;
};

export function WorkspaceShell({ role }: WorkspaceShellProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <WritingList />
      <WritingEditor />
      {role === "teacher" ? <TeacherSupportPanel /> : <StudentReviewPanel />}
    </div>
  );
}
